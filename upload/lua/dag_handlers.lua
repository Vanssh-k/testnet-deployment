local _M = {}
local http = require "resty.http"
local json = require "cjson.safe"
local config = require "config"
local auth = require "auth"

-- Use the authenticate function from the auth module
_M.authenticate = auth.authenticate

-- Buffer to collect response chunks
local response_buffer = {}

function _M.set_cors_headers()
  ngx.header["Access-Control-Allow-Origin"] = "*"
  ngx.header["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
  ngx.header["Access-Control-Allow-Headers"] = "*"
  ngx.header["Access-Control-Allow-Credentials"] = "true"
  ngx.header["Content-Type"] = "application/json"
end

-- Process the response from IPFS dag/import in the body filter phase
function _M.process_dag_import_response()
    -- Buffer the response chunks
    if ngx.arg[1] then
        table.insert(response_buffer, ngx.arg[1])
    end
    
    -- If this is the last chunk, process the complete response
    if ngx.arg[2] then
        local response_body = table.concat(response_buffer)
        response_buffer = {}  -- Clear the buffer
        
        -- Clear the response since we'll generate our own
        ngx.arg[1] = nil
        
        -- Log the full response for debugging
        ngx.log(ngx.ERR, "Full response body: " .. response_body)
        
        -- Set headers
        local headers = ngx.req.get_headers()
        local publicKey = headers["publicKey"]
        local encryption = headers["encryption"] and headers["encryption"]:lower() == "true"
        
        -- Parse response to get Root CID
        local response_data
        -- Try to decode the full response first
        response_data = json.decode(response_body)
        
        -- If full decode fails, try to find valid JSON objects in the response
        if not response_data then
            for obj in response_body:gmatch("(%b{})") do
                response_data = json.decode(obj)
                if response_data and response_data.Root and response_data.Root.Cid then
                    break
                end
            end
        end
        
        -- Verify we have a valid response with a CID
        if not response_data or not response_data.Root or not response_data.Root.Cid then
            ngx.log(ngx.ERR, "Invalid response from IPFS: " .. (response_body or ""))
            ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
            ngx.arg[1] = json.encode({error = "Invalid response from IPFS"})
            ngx.arg[2] = true
            return
        end
        
        local cid = response_data.Root.Cid["/"]
        local filename = ngx.var.arg_filename or "carfile.car"
        local uri = ngx.var.uri
        
        -- Create the file info with initial data
        local file_info = {
            Name = filename,
            Hash = cid,
            Size = "0"  -- Will be updated
        }
        
        -- Set up response data in shared memory
        local key = "dag_import:" .. cid
        local shared = ngx.shared.stats or ngx.shared.DICT  -- Use whichever shared dict is available
        if not shared then
            ngx.log(ngx.ERR, "No shared dict available - falling back to immediate response")
            ngx.arg[1] = json.encode({
                success = true,
                cid = cid,
                message = "CAR file import complete. Size unknown.",
                file = file_info
            })
            ngx.arg[2] = true
            
            -- Start background task for record creation anyway
            local function create_record_bg(premature, uri, file_info_json, publicKey)
                if premature then return end
                
                local utils = require "utils"
                local ok, err = utils.create_record_normal(nil, uri, file_info_json, publicKey, false)
                if not ok then
                    ngx.log(ngx.ERR, "Failed to create record for CAR file with CID " .. cid .. ": " .. (err or "unknown error"))
                end
            end
            
            ngx.timer.at(0, create_record_bg, uri, json.encode(file_info), publicKey)
            return
        end
        
        -- Function to fetch dag stats and update record
        local function fetch_stats_and_signal(premature, cid, uri, publicKey, key)
            if premature then return end
            
            -- Need to re-require these modules in the timer context
            local http = require "resty.http"
            local json = require "cjson.safe"
            local shared = ngx.shared.stats or ngx.shared.DICT
            
            -- Initial data in case of error
            local result = {
                success = true,
                cid = cid,
                message = "CAR file import complete. Error getting size.",
                file = {
                    Name = filename,
                    Hash = cid,
                    Size = "0"
                }
            }
            
            -- Fetch DAG stats to get the size
            local httpc = http.new()
            local stat_res, stat_err = httpc:request_uri("http://127.0.0.1:5001/api/v0/dag/stat?arg=" .. cid, {
                method = "POST",
                timeout = 60000  -- 1 minute timeout in milliseconds
            })
            
            local size = "0"
            if stat_res and stat_res.status == 200 then
                -- Parse the stat response
                local stat_data
                for obj in stat_res.body:gmatch("(%b{})") do
                    stat_data = json.decode(obj)
                    if stat_data then break end
                end
                
                if stat_data then
                    size = tostring(stat_data.TotalSize or stat_data.Size or 0)
                    
                    -- Update result with actual size
                    result.file.Size = size
                    result.message = "CAR file import complete"
                    
                    ngx.log(ngx.INFO, "Processing CAR file complete. CID: " .. cid .. ", Size: " .. size)
                else
                    ngx.log(ngx.ERR, "Failed to decode stat_data for CAR file with CID " .. cid .. ": " .. (stat_res.body or "empty body"))
                end
            else
                ngx.log(ngx.ERR, "Failed to fetch dag stat for CAR file with CID " .. cid .. ": " .. (stat_err or (stat_res and stat_res.body) or "unknown"))
            end
            
            -- Create record
            local file_info = {
                Name = filename,
                Hash = cid,
                Size = size
            }
            
            local utils = require "utils"
            local ok, err = utils.create_record_normal(nil, uri, json.encode(file_info), publicKey, false)
            if not ok then
                ngx.log(ngx.ERR, "Failed to create record for CAR file with CID " .. cid .. ": " .. (err or "unknown error"))
            else
                ngx.log(ngx.INFO, "Successfully created record for CAR file. CID: " .. cid .. ", PublicKey: " .. publicKey)
            end
            
            -- Store the result in shared memory and signal completion
            shared:set(key, json.encode(result))
            shared:set(key .. ":done", "1")
        end
        
        -- Start background task
        local ok, err = ngx.timer.at(0, fetch_stats_and_signal, cid, uri, publicKey, key)
        if not ok then
            ngx.log(ngx.ERR, "Failed to create timer for stat fetching: " .. (err or "unknown error"))
            -- Fall back to immediate response
            ngx.arg[1] = json.encode({
                success = true,
                cid = cid,
                message = "CAR file import complete. Size calculation failed to start.",
                file = file_info
            })
            ngx.arg[2] = true
            return
        end
        
        -- Set a timeout for the background task
        local timeout = 10  -- seconds
        local sleep_interval = 0.1  -- seconds
        local elapsed = 0
        
        -- Wait for the background task to complete or timeout
        while elapsed < timeout do
            ngx.sleep(sleep_interval)
            elapsed = elapsed + sleep_interval
            
            local done = shared:get(key .. ":done")
            if done then
                local result = shared:get(key)
                if result then
                    ngx.arg[1] = result
                    ngx.arg[2] = true
                    
                    -- Clean up
                    shared:delete(key)
                    shared:delete(key .. ":done")
                    return
                end
            end
        end
        
        -- If we've reached here, we timed out waiting for the background task
        ngx.log(ngx.WARN, "Timed out waiting for DAG stats. Sending response without size for CID: " .. cid)
        ngx.arg[1] = json.encode({
            success = true,
            cid = cid,
            message = "CAR file import complete. Size calculation in progress.",
            file = file_info
        })
        ngx.arg[2] = true
    end
end

-- Maintain the original function for backward compatibility
function _M.handle_dag_import()
    ngx.log(ngx.WARN, "handle_dag_import() called directly, but this is now handled by process_dag_import_response()")
    -- This function should no longer be used since we're using proxy_pass and body_filter
    -- Return a 204 No Content to allow the proxy_pass to handle it
    ngx.exit(ngx.HTTP_NO_CONTENT)
end

return _M 