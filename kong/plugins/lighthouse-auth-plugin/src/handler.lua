local http = require "resty.http"
local cjson = require "cjson.safe"
local kong = kong

local GuardHandler = {
    PRIORITY = 1000,
    VERSION = "0.0.2",
}

-- Utility function to send error response
local function send_error_response(message, status)
    local response_body = {
        data = {},
        error = {
            code = tostring(status), 
            message = message
        }
    }

    kong.response.set_header("Content-Type", "application/json")
    return kong.response.exit(status, cjson.encode(response_body))
end

-- Function to validate the token via an external authentication server
local function validate_token(token, conf)
    local httpc = http.new()
    local res, err = httpc:request_uri(conf.validation_endpoint, {
        method = "POST",
        headers = {
            ["Content-Type"] = "application/json",
            ["Authorization"] = token
        },
        keepalive_timeout = conf.timeout,
        keepalive_pool = 10,
    })

    if not res then
        return nil, err
    end

    return res.status, res.body
end

function GuardHandler:access(conf)
    local token = kong.request.get_header(conf.token_header)

    if not token then
        return send_error_response("Authentication token missing or invalid. Access denied.", 401)
    end

    local status, body = validate_token(token, conf)

    if status ~= 200 then
        return send_error_response("Token validation failed. Please verify your credentials.", 401)
    end

    -- Parse the user data from the token validation response body
    local user_data = cjson.decode(body)

    if not user_data or not user_data.publicKey then
        return send_error_response("Failed to validate permissions for your credentials.", 500)
    end

    kong.service.request.clear_header(conf.token_header)
    kong.response.set_header(conf.user_header_value, user_data.publicKey)

end


return GuardHandler

