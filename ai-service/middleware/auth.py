"""
Service-to-service authentication for the AI microservice (M-8).

The Node backend includes the shared secret `AI_SERVICE_AUTH_TOKEN` in the
`X-Bookify-Auth` header on every request. We verify it here and reject
anything that doesn't match. Requests from the browser never reach this
service, so we don't need JWT or session handling.

In `development`, if no token is configured we log a warning and let
requests through (so local `uvicorn` reload + browser testing still
works). In any other environment we refuse to start without a token.
"""
import os
import hmac
import logging
from fastapi import Header, HTTPException, status

log = logging.getLogger(__name__)

EXPECTED_TOKEN = os.getenv("AI_SERVICE_AUTH_TOKEN", "").strip()
ENVIRONMENT   = os.getenv("ENVIRONMENT", "development").lower().strip()

if not EXPECTED_TOKEN and ENVIRONMENT != "development":
    # Fail closed in non-dev environments.
    raise RuntimeError(
        "AI_SERVICE_AUTH_TOKEN is required when ENVIRONMENT != 'development'. "
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\" "
        "and set the same value in backend/.env (AI_SERVICE_AUTH_TOKEN)."
    )

if not EXPECTED_TOKEN and ENVIRONMENT == "development":
    log.warning(
        "[AI] AI_SERVICE_AUTH_TOKEN is not set. The service will accept "
        "unauthenticated requests because ENVIRONMENT=development. Set the "
        "token in ai-service/.env before deploying."
    )


def require_service_auth(x_bookify_auth: str = Header(default="")) -> None:
    """
    FastAPI dependency. Raise 401 if the request is missing the
    X-Bookify-Auth header or the value doesn't match the shared secret.
    Uses `hmac.compare_digest` for constant-time comparison to defeat
    timing-attack fingerprinting of the secret byte-by-byte.
    """
    if not EXPECTED_TOKEN:
        # No token configured + dev environment — let it through.
        return

    if not x_bookify_auth or not hmac.compare_digest(x_bookify_auth, EXPECTED_TOKEN):
        # Do not echo the expected value back. The client only learns
        # that the request was rejected.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Service authentication failed",
            headers={"WWW-Authenticate": "X-Bookify-Auth"},
        )
