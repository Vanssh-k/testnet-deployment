local _M = {}
local http = require "resty.http"
local json = require "cjson.safe"
local config = require "config"

local function get_mime_type(filename)
    local ext = filename:match("^.+(%..+)$")
    local mime_types = {
        [".txt"] = "text/plain",
        [".json"] = "application/json",
        [".svg"] = "image/svg+xml",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".pdf"] = "application/pdf",
        [".mp4"] = "video/mp4",
        [".mp3"] = "audio/mpeg",
        [".zip"] = "application/zip",
        [".tar"] = "application/x-tar",
    }
    return mime_types[ext] or "application/octet-stream"
end

function _M.create_record_normal(premature, uri, record_data, public_key)
    if premature then return end
    local success, decoded_data = pcall(json.decode, record_data)
    if not success or not decoded_data then
        ngx.log(ngx.ERR, "Failed to decode record data: " .. tostring(record_data))
        return
    end
    local httpc = http.new()
    local payload = {
        name = decoded_data.Name,
        cid = decoded_data.Hash,
        size = decoded_data.Size,
        encryption = false,
        mimeType = decoded_data.Name and get_mime_type(decoded_data.Name) or "application/octet-stream",
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
    elseif res.status ~= 200 then
        ngx.log(ngx.ERR, "Failed to store record, status: " .. res.status .. ", body: " .. res.body)
    end
end

function _M.create_record_encrypted(premature, uri, record_data, public_key)
    if premature then return end
    
    local httpc = http.new()
    httpc:set_timeout(10000)
    httpc:set_keepalive(60000, 10)
    
    local success, decoded_data = pcall(json.decode, record_data)
    if not success or not decoded_data then
        ngx.log(ngx.ERR, "Failed to decode record data: " .. tostring(data))
        return
    end

    local records = type(decoded_data) == "table" and decoded_data[1] and decoded_data or {decoded_data}

    for _, record in ipairs(records) do
        local payload = {
            name = record.Name,
            cid = record.Hash,
            size = record.Size,
            encryption = true,
            mimeType = record.Name and get_mime_type(record.Name) or "application/octet-stream",
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
        elseif res.status ~= 200 then
            ngx.log(ngx.ERR, "Unexpected response from logging endpoint. Status: " .. res.status .. ", Body: " .. (res.body or "nil"))
        else
            ngx.log(ngx.INFO, "Successfully sent record to logging endpoint for CID: " .. (record.Hash or "nil"))
        end
    end
end

return _M 