local _M = {}

-- Authentication configuration
_M.auth_url = os.getenv("AUTH_URL") or "http://auth-service:8080/api/"
_M.auth_token = os.getenv("AUTH_TOKEN") or "your_auth_token_here"

-- Records service configuration
_M.records_url = os.getenv("LAMBDA_URL") or "http://records-service:8080/api/store"

return _M 