local http = require "resty.http"
local cjson = require "cjson.safe"
local kong = kong

local GuardHandler = {
    PRIORITY = 1000,
    VERSION = "0.0.2",
}

local function send_error_response(message, status)
    local response_body = {
        error = {
            code = tostring(status), 
            message = message
        }
    }

    kong.log.err("Sending error response: ", message, " with status: ", status)
    kong.response.set_header("Content-Type", "application/json")
    return kong.response.exit(status, cjson.encode(response_body))
end

local function validate_token(token, conf)
    kong.log.info("Initiating token validation with external server")
    local httpc = http.new()

    local res, err = httpc:request_uri(conf.validation_endpoint, {
        method = "GET",
        headers = {
            ["Content-Type"] = "application/json",
            ["Authorization"] = token
        },
        keepalive_timeout = conf.timeout or 60000,
        keepalive_pool = 10,
    })

    if not res then
        kong.log.err("Failed to validate token. Error: ", err)
        return nil, err
    end

    kong.log.info("Received response from validation endpoint with status: ", res.status)
    return res.status, res.body
end

function GuardHandler:access(conf)
    kong.log.info("Access handler invoked for token validation")

    local token = kong.request.get_header(conf.token_header)

    if not token then
        kong.log.warn("No token found in request headers")
        return send_error_response("Authentication token missing or invalid. Access denied.", 401)
    end

    kong.log.info("Token found in header: ", conf.token_header)

    local status, body = validate_token(token, conf)

    if status ~= 200 then
        kong.log.warn("Token validation failed with status: ", status)
        return send_error_response("Token validation failed. Please verify your credentials.", 401)
    end

    local user_data, err = cjson.decode(body)
    if err then
        kong.log.err("Failed to decode validation response: ", err)
        return send_error_response("Error decoding authentication server response.", 500)
    end

    kong.log.info("Successfully decoded validation response")

    if not user_data or not user_data.publicKey then
        kong.log.err("No publicKey found in the validation response")
        return send_error_response("Failed to validate permissions for your credentials.", 500)
    end

    kong.service.request.clear_header(conf.token_header)
    kong.log.info("Token header cleared from request")

    kong.response.set_header(conf.user_header_value, user_data.publicKey)
    kong.log.info("Public key set in response headers: ", user_data.publicKey)
end

return GuardHandler
