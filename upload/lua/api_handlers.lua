local _M = {}
local http = require "resty.http"
local json = require "cjson.safe"
local config = require "config"
local auth = require "auth"
local utils = require "utils"

-- Use the authenticate function from the auth module
_M.authenticate = auth.authenticate

function _M.set_cors_headers()
    ngx.header["Access-Control-Allow-Origin"] = "*"
    ngx.header["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    ngx.header["Access-Control-Allow-Headers"] = "*"
    ngx.header["Access-Control-Allow-Credentials"] = "true"
    ngx.header["Content-Type"] = "application/json"
end

function _M.process_response()
    local json = require "cjson.safe"
    local chunk = ngx.arg[1]
    local eof = ngx.arg[2]

    -- Skip processing if the request already has an error status code or auth failed
    if ngx.status >= 400 or ngx.ctx.auth_failed then
        ngx.arg[1] = chunk
        ngx.arg[2] = eof
        return
    end

    -- Initialize context
    if not ngx.ctx.last_json_object then
        ngx.ctx.last_json_object = nil
        ngx.ctx.line_count = 0
        ngx.ctx.max_lines = 100000  -- Safety limit for response lines
        ngx.ctx.all_json_objects = {}  -- Store all JSON objects for encrypted responses
    end

    -- Process response chunks incrementally
    if chunk then
        for line in chunk:gmatch("[^\r\n]+") do
            ngx.ctx.line_count = ngx.ctx.line_count + 1
            if ngx.ctx.line_count > ngx.ctx.max_lines then
                ngx.log(ngx.ERR, "Response too large, exceeded " .. ngx.ctx.max_lines .. " lines")
                ngx.arg[1] = json.encode({
                    success = false,
                    error = "Response too large, exceeded maximum lines limit",
                    details = "Too many files uploaded"
                })
                ngx.arg[2] = true
                ngx.status = ngx.HTTP_REQUEST_ENTITY_TOO_LARGE
                return
            end
            local json_object = line:match("(%b{})")
            if json_object then
                local decoded = json.decode(json_object)
                if decoded then
                    ngx.ctx.last_json_object = json_object
                    table.insert(ngx.ctx.all_json_objects, json_object)
                else
                    ngx.log(ngx.ERR, "Invalid JSON in chunk: " .. line)
                end
            end
        end
    end

    -- Handle end of response
    if eof then
        if not ngx.ctx.last_json_object then
            ngx.log(ngx.ERR, "No valid JSON objects found in response!")
            ngx.arg[1] = json.encode({
                success = false,
                error = "No valid JSON found in response",
                details = "The server received an invalid response format"
            })
            ngx.arg[2] = true
            ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
            return
        end

        local headers = ngx.req.get_headers()
        ngx.ctx.publicKey = headers["publicKey"]
        ngx.ctx.encryption = headers["encryption"] and headers["encryption"]:lower() == "true"
        local utils = require("utils")

        if ngx.ctx.encryption then
            -- Use all collected JSON objects for encrypted responses
            local final_json_array = "[" .. table.concat(ngx.ctx.all_json_objects, ",") .. "]"
            ngx.ctx.record_data = final_json_array
            
            -- Process record creation synchronously
            local success, err = utils.create_record_encrypted(nil, ngx.var.uri, ngx.ctx.record_data, ngx.ctx.publicKey)
            if not success then
                ngx.log(ngx.ERR, "Failed to create encrypted record: " .. (err or "unknown error"))
                ngx.arg[1] = json.encode({
                    success = false,
                    error = "Failed to store record",
                    details = err or "Unknown error during record creation"
                })
                ngx.arg[2] = true
                ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                return
            end
            
            ngx.arg[1] = final_json_array
            ngx.arg[2] = true
        else
            -- Normal unencrypted uploads
            ngx.ctx.record_data = ngx.ctx.last_json_object
            
            -- Process record creation synchronously
            local success, err = utils.create_record_normal(nil, ngx.var.uri, ngx.ctx.record_data, ngx.ctx.publicKey)
            if not success then
                ngx.log(ngx.ERR, "Failed to create record: " .. (err or "unknown error"))
                ngx.arg[1] = json.encode({
                    success = false,
                    error = "Failed to store record",
                    details = err or "Unknown error during record creation"
                })
                ngx.arg[2] = true
                ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                return
            end
            
            ngx.arg[1] = ngx.ctx.last_json_object
            ngx.arg[2] = true
        end
    else
        ngx.arg[1] = nil  -- Clear chunk to prevent sending partial data
    end
end

return _M 