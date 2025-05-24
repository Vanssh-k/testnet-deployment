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

local function create_record_encrypted(premature, url, data, publicKey)
    if premature then return end
    
    local httpc = http.new()
    httpc:set_timeout(10000) 
    
    local success, decoded_data = pcall(json.decode, data)
    if not success or not decoded_data then
        ngx.log(ngx.ERR, "Failed to decode record data: " .. tostring(data))
        return
    end

    local records = type(decoded_data) == "table" and decoded_data[1] and decoded_data or {decoded_data}
    local lambda_url = config.lambda_url
    local auth_token = config.auth_token

    for _, record in ipairs(records) do
        local payload = {
            name = record.Name,
            cid = record.Hash,
            size = record.Size,
            encryption = true,
            mimeType = record.Name and get_mime_type(record.Name) or "application/octet-stream",
            publicKey = publicKey
        }

        local res, err = httpc:request_uri(lambda_url, {
            method = "POST",
            body = json.encode(payload),
            headers = {
                ["Content-Type"] = "application/json",
                ["Authorization"] = "Bearer " .. auth_token
            },
            ssl_verify = false,
            socket_opts = {ipv6 = false}
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

local function create_record_normal(premature, url, data, publicKey)
    if premature then return end
    
    local httpc = http.new()
    httpc:set_timeout(60000)
    ngx.log(ngx.ERR, "Decoding record data: " .. tostring(data))
    local success, decoded_data = pcall(json.decode, data)
    if not success or not decoded_data then
        ngx.log(ngx.ERR, "Failed to decode record data: " .. tostring(data))
        return
    end

    local lambda_url = config.lambda_url
    local auth_token = config.auth_token
    local payload = {
        name = decoded_data.Name,
        cid = decoded_data.Hash,
        size = decoded_data.Size,
        encryption = false,
        mimeType = decoded_data.Name and get_mime_type(decoded_data.Name) or "application/octet-stream",
        publicKey = publicKey
    }
    ngx.log(ngx.ERR, "lambda_url: " .. lambda_url)
    ngx.log(ngx.ERR, "payload: " .. json.encode(payload))
    ngx.log(ngx.ERR, "auth_token: " .. auth_token)
    local res, err = httpc:request_uri(lambda_url, {
        method = "POST",
        body = json.encode(payload),
        headers = {
            ["Content-Type"] = "application/json",
            ["Authorization"] = "Bearer " .. auth_token
        },
        ssl_verify = false,
        socket_opts = {ipv6 = false}
    })
    
    if not res then
        ngx.log(ngx.ERR, "Failed to send record to logging endpoint: " .. (err or "unknown error"))
    elseif res.status ~= 200 then
        ngx.log(ngx.ERR, "Unexpected response from logging endpoint. Status: " .. res.status .. ", Body: " .. (res.body or "nil"))
    else
        ngx.log(ngx.INFO, "Successfully sent record to logging endpoint for CID: " .. (decoded_data.Hash or "nil"))
    end
end

return {
    create_record_encrypted = create_record_encrypted,
    create_record_normal = create_record_normal
}
