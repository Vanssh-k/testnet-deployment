local _M = {}
local http = require "resty.http"
local json = require "cjson.safe"
local config = require "config"

-- Function to send standardized error responses to the user
function _M.send_error(status_code, error_message, details)
    ngx.status = status_code
    ngx.header["Content-Type"] = "application/json"
    ngx.header["Access-Control-Allow-Origin"] = "*"
    ngx.header["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    ngx.header["Access-Control-Allow-Headers"] = "*"
    
    local error_response = {
        success = false,
        error = error_message
    }
    
    if details then
        error_response.details = details
    end
    
    ngx.say(json.encode(error_response))
    return ngx.exit(status_code)
end

function _M.create_record_normal(premature, uri, record_data, public_key)
    if premature then return end
    local success, decoded_data = pcall(json.decode, record_data)
    if not success or not decoded_data then
        ngx.log(ngx.ERR, "Failed to decode record data: " .. tostring(record_data))
        return false, "Failed to decode record data"
    end
    local httpc = http.new()
    local payload = {
        name = decoded_data.Name,
        cid = decoded_data.Hash,
        size = decoded_data.Size,
        encryption = false,
        publicKey = public_key
    }
    
    -- Configure timeout
    httpc:set_timeout(10000)
    httpc:set_keepalive(60000, 10)
    
    -- We'll simulate calling a records service to store the data
    local res, err = httpc:request_uri(config.records_url, {
        method = "POST",
        body = json.encode(payload),
        headers = {
            ["Content-Type"] = "application/json",
            ["Authorization"] = "Bearer " .. config.auth_token
        },
        ssl_verify = false,
        -- Force IPv4 by setting the resolver configuration
        resolver_opts = {
            ipv6 = false,
            nameservers = { "8.8.8.8", "1.1.1.1" }
        }
    })
    
    if not res then
        ngx.log(ngx.ERR, "Failed to store record: " .. (err or "unknown error"))
        return false, "Failed to store record: " .. (err or "unknown error")
    elseif res.status ~= 200 then
        ngx.log(ngx.ERR, "Failed to store record, status: " .. res.status .. ", body: " .. res.body)
        return false, "Failed to store record, status: " .. res.status
    end
    
    return true
end

function _M.create_record_encrypted(premature, uri, record_data, public_key)
    if premature then return end
    
    local httpc = http.new()
    httpc:set_timeout(10000)
    httpc:set_keepalive(60000, 10)
    
    local success, decoded_data = pcall(json.decode, record_data)
    if not success or not decoded_data then
        ngx.log(ngx.ERR, "Failed to decode record data: " .. tostring(record_data))
        return false, "Failed to decode encrypted record data"
    end

    local records = type(decoded_data) == "table" and decoded_data[1] and decoded_data or {decoded_data}
    local errors = {}
    local success_count = 0

    for _, record in ipairs(records) do
        local payload = {
            name = record.Name,
            cid = record.Hash,
            size = record.Size,
            encryption = true,
            publicKey = public_key
        }

        local res, err = httpc:request_uri(config.records_url, {
            method = "POST",
            body = json.encode(payload),
            headers = {
                ["Content-Type"] = "application/json",
                ["Authorization"] = "Bearer " .. config.auth_token
            },
            ssl_verify = false,
            resolver_opts = {
                ipv6 = false,
                nameservers = { "8.8.8.8", "1.1.1.1" }
            }
        })

        if not res then
            ngx.log(ngx.ERR, "Failed to send record to logging endpoint: " .. (err or "unknown error"))
            table.insert(errors, "Failed to send record " .. (record.Hash or "unknown") .. ": " .. (err or "unknown error"))
        elseif res.status ~= 200 then
            ngx.log(ngx.ERR, "Unexpected response from logging endpoint. Status: " .. res.status .. ", Body: " .. (res.body or "nil"))
            table.insert(errors, "Failed to send record " .. (record.Hash or "unknown") .. ": status " .. res.status)
        else
            ngx.log(ngx.INFO, "Successfully sent record to logging endpoint for CID: " .. (record.Hash or "nil"))
            success_count = success_count + 1
        end
    end
    
    if #errors > 0 and success_count == 0 then
        return false, table.concat(errors, "; ")
    elseif #errors > 0 then
        return true, "Partial success: " .. success_count .. " records processed, " .. #errors .. " failed"
    else
        return true
    end
end

return _M 