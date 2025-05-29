local _M = {}
local http = require "resty.http"
local json = require "cjson.safe"
local config = require "config"
local utils = require "utils"

function _M.authenticate()
    local token = ngx.req.get_headers()["Authorization"]
    if not token or not token:match("^Bearer%s+(.+)$") then
        ngx.log(ngx.ERR, "Auth Failed: Missing or invalid token")
        return utils.send_error(ngx.HTTP_UNAUTHORIZED, "Authentication failed", "Missing or invalid authentication token")
    end
    token = token:match("^Bearer%s+(.+)$")
    local httpc = http.new()
    local auth_url = config.auth_url
    auth_url = token:len() >= 204 and auth_url .. "verify_access_token" or auth_url .. "verify_api_key"
    local auth_res, auth_err = httpc:request_uri(auth_url, {
        method = "GET",
        headers = { Authorization = "Bearer " .. token},
        ssl_verify = false
    })
    if not auth_res then
        ngx.log(ngx.ERR, "Auth Failed: No response from API - " .. (auth_err or "unknown error"))
        return utils.send_error(ngx.HTTP_UNAUTHORIZED, "Authentication failed", 
            "Unable to reach authentication service: " .. (auth_err or "unknown error"))
    elseif auth_res.status ~= 200 then
        ngx.log(ngx.ERR, "Auth Failed: API returned " .. auth_res.status .. " - Response: " .. auth_res.body)
        return utils.send_error(ngx.HTTP_UNAUTHORIZED, "Authentication failed", 
            "Authentication service returned error " .. auth_res.status)
    end
    local auth_data = json.decode(auth_res.body)
    if not auth_data or not auth_data.publicKey then
        ngx.log(ngx.ERR, "Auth Failed: Invalid API response - " .. auth_res.body)
        return utils.send_error(ngx.HTTP_UNAUTHORIZED, "Authentication failed", 
            "Invalid response from authentication service")
    end
    ngx.req.set_header("publicKey", auth_data.publicKey)
    if tonumber(auth_data.dataLimit) - tonumber(auth_data.dataUsed) <= 0 then
        ngx.log(ngx.ERR, "Auth Failed: Data limit exceeded for user " .. auth_data.publicKey)
        return utils.send_error(ngx.HTTP_FORBIDDEN, "Data limit exceeded", 
            "Your account has reached its storage limit")
    end
    
    -- Check for plan expiration
    if auth_data.createdAt then
        local fifteen_days_in_ms = 1296000000 -- 15 days in milliseconds
        local created_at_timestamp = tonumber(auth_data.createdAt)
        local current_time = ngx.time() * 1000 -- Convert to milliseconds to match JS
        
        if (current_time - created_at_timestamp > fifteen_days_in_ms) and (tonumber(auth_data.dataLimit) <= 5368709120) then
            ngx.log(ngx.ERR, "Auth Failed: Trial expired for user " .. auth_data.publicKey)
            return utils.send_error(ngx.HTTP_FORBIDDEN, "Trial expired", 
                "Your trial period has expired. Please upgrade to a paid plan")
        end
    end
end

return _M 