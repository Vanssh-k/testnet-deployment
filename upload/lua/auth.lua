local _M = {}
local http = require "resty.http"
local json = require "cjson.safe"
local config = require "config"

function _M.authenticate()
    local token = ngx.req.get_headers()["Authorization"]
    if not token or not token:match("^Bearer%s+(.+)$") then
        ngx.log(ngx.ERR, "Auth Failed: Missing or invalid token")
        ngx.status = ngx.HTTP_UNAUTHORIZED
        ngx.say("Authentication token not found")
        ngx.exit(ngx.HTTP_UNAUTHORIZED)
    end
    token = token:match("^Bearer%s+(.+)$")
    local httpc = http.new()
    local auth_url = config.auth_url
    ngx.log(ngx.ERR, "Auth URL from config: " .. tostring(auth_url))
    auth_url = token:len() >= 204 and auth_url .. "verify_access_token" or auth_url .. "verify_api_key"
    local auth_res, auth_err = httpc:request_uri(auth_url, {
        method = "GET",
        headers = { Authorization = "Bearer " .. token},
        ssl_verify = false
    })
    if not auth_res then
        ngx.log(ngx.ERR, "Auth Failed: No response from API - " .. (auth_err or "unknown error"))
        ngx.status = ngx.HTTP_UNAUTHORIZED
        ngx.say("Auth API unreachable")
        ngx.exit(ngx.HTTP_UNAUTHORIZED)
    elseif auth_res.status ~= 200 then
        ngx.log(ngx.ERR, "Auth Failed: API returned " .. auth_res.status .. " - Response: " .. auth_res.body)
        ngx.status = ngx.HTTP_UNAUTHORIZED
        ngx.say("Auth Failed")
        ngx.exit(ngx.HTTP_UNAUTHORIZED)
    end
    local auth_data = json.decode(auth_res.body)
    if not auth_data or not auth_data.publicKey then
        ngx.log(ngx.ERR, "Auth Failed: Invalid API response - " .. auth_res.body)
        ngx.status = ngx.HTTP_UNAUTHORIZED
        ngx.say("Invalid Auth Response")
        ngx.exit(ngx.HTTP_UNAUTHORIZED)
    end
    ngx.req.set_header("publicKey", auth_data.publicKey)
    if tonumber(auth_data.dataLimit) - tonumber(auth_data.dataUsed) <= 0 then
        ngx.log(ngx.ERR, "Auth Failed: Data limit exceeded for user " .. auth_data.publicKey)
        ngx.status = ngx.HTTP_FORBIDDEN
        ngx.say("Data limit exceeded")
        ngx.exit(ngx.HTTP_FORBIDDEN)
    end
end

return _M 