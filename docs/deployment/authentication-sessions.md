# Authentication sessions: configuration and deployment

How Kirmya keeps a signed-in user signed in, and what each environment has to be
configured with for that to work.

Production target: web client at `https://kirmya.com`, API at `https://api.kirmya.com`.

## The mechanism

```
Sign in
  → POST /api/v1/auth/login
  → access token in the response body, held in the browser tab's memory
  → refresh token in an HttpOnly cookie the browser stores and script cannot read

Reload (the tab's memory is gone; only the cookie survives)
  → POST /api/v1/auth/refresh   sends the cookie, rotates it, returns a new access token
  → GET  /api/v1/auth/me        with that token, restores the user
  → still signed in
```

Two rules hold this together, and breaking either one produces the same symptom —
"login works, but refreshing logs me out":

1. **No token is ever written to `localStorage` or `sessionStorage`.** Anything
   readable from JavaScript is readable by any script that gets into the page.
   Losing the access token on reload is the intended trade; the cookie restores it.
2. **The browser must actually store the refresh cookie.** A cookie the browser
   silently refuses looks exactly like a working sign-in, because the access
   token still comes back in the response body and works for the rest of that
   page's life. The session only vanishes on reload.

## Environment settings

| Variable | Development | Production | Notes |
|---|---|---|---|
| `APP_ENV` | `development` | `production` | Drives every default below |
| `AUTH_COOKIE_NAME` | `refresh_token` | `refresh_token` | Same value everywhere |
| `AUTH_COOKIE_PATH` | `/api/v1/auth` | `/api/v1/auth` | Cookie is only sent to the auth endpoints |
| `AUTH_COOKIE_SECURE` | `false` | `true` (forced) | See below |
| `AUTH_COOKIE_SAME_SITE` | `lax` | `lax` | `none` only when genuinely cross-site |
| `AUTH_COOKIE_DOMAIN` | unset | unset | Host-only; see below |
| `ACCESS_TOKEN_TTL` | `15m` | `15m` | Go duration string |
| `REFRESH_TOKEN_TTL` | `168h` | `168h` | 7 days — normal sign-in |
| `REMEMBER_ME_REFRESH_TOKEN_TTL` | `720h` | `720h` | 30 days — "Remember me" |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `https://kirmya.com` | Exact origins, comma-separated |
| `AUTH_RATE_LIMIT_REQUESTS` / `_BURST` | `5` / `5` | `5` / `5` | Credential endpoints |
| `AUTH_SESSION_RATE_LIMIT_REQUESTS` / `_BURST` | `120` / `60` | `120` / `60` | Session endpoints |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | `https://api.kirmya.com/api/v1` | Include the version prefix |

The API logs the resolved policy once at startup (`refresh cookie policy
resolved`). Read that line first when a session problem is reported — it shows
the attributes the browser is actually being sent.

### `AUTH_COOKIE_SECURE`

Must be `false` in development. The API is served over plain HTTP there, and
WebKit refuses to store a `Secure` cookie on an insecure origin. Chromium and
Firefox make a localhost exception, which is why this failure typically shows up
first in Safari or on a device pointed at a LAN address, long after it looked
fine on the developer's machine.

Production forces it to `true` regardless of what is configured, and logs that it
did so.

### `AUTH_COOKIE_SAME_SITE`

`lax` is correct for the production target. `kirmya.com` and `api.kirmya.com`
share the registrable domain `kirmya.com`, so requests between them are already
same-site and the cookie is sent.

Do not use `strict`. It buys nothing over `lax` for this pair and breaks the
moment the web client is served from anywhere else — a preview deployment, a
staging host, a partner domain.

Use `none` only when the web client is genuinely served from a different site
than the API. `none` requires `Secure`; the API forces `Secure` on if you ask for
`none` without it.

### `AUTH_COOKIE_DOMAIN`

Leave it unset. The cookie is then host-only: scoped to `api.kirmya.com` and sent
nowhere else. Setting `.kirmya.com` would share the refresh token with every
subdomain, including any later pointed at a third-party service.

### Rate limits

Two separate per-IP buckets:

- **Credential endpoints** (`/auth/register`, `/auth/login`, `/auth/verify-email`,
  `/auth/resend-verification`) — deliberately tight. These are what get sprayed.
- **Session endpoints** (`/auth/refresh`, `/auth/me`, `/auth/session`,
  `/auth/logout`) — far more generous, because every page load costs two of them.

They must stay separate. Sharing one bucket is what made reloading a page a few
times sign the user out, and behind a single office or carrier NAT it did so for
everyone on that address at once. These endpoints cannot be used to guess a
credential: refresh requires an unguessable single-use token, `/auth/me` requires
a signed access token.

## Railway

Set the variables above on each service. Nothing here hardcodes a Railway URL —
`CORS_ALLOWED_ORIGINS`, `APP_BASE_URL` and `NEXT_PUBLIC_API_URL` are the only
places a hostname appears, and all three are configuration.

**API service:**

```
APP_ENV=production
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_PATH=/api/v1/auth
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=168h
REMEMBER_ME_REFRESH_TOKEN_TTL=720h
CORS_ALLOWED_ORIGINS=https://kirmya.com
APP_BASE_URL=https://kirmya.com
JWT_SECRET=<a real secret, never the placeholder>
```

Leave `AUTH_COOKIE_DOMAIN` unset.

**Web service:**

```
NEXT_PUBLIC_API_URL=https://api.kirmya.com/api/v1
```

`NEXT_PUBLIC_*` values are inlined at build time, so changing this requires a
rebuild, not just a restart.

**Trusted proxies.** Railway terminates TLS at a floating edge address, so
`TRUSTED_PROXIES` must be set (`*` to trust all hops) for the rate limiter to see
real client addresses. Left unset, every request appears to come from the proxy
and the whole user base shares one bucket — the same symptom as the shared-bucket
bug, arriving by a different route.

## Cloudflare

Point both hostnames at their Railway services with proxying on.

- **SSL/TLS mode must be Full (strict).** In Flexible mode Cloudflare talks to
  the origin over plain HTTP, so the API sees an insecure connection and a
  `Secure` cookie will not survive the round trip.
- **Do not cache the API.** Add a cache rule bypassing cache for
  `api.kirmya.com/*`. A cached `Set-Cookie` would hand one user's refresh token
  to another — the most serious failure available here.
- **`X-Forwarded-Proto`.** Cloudflare sets it; the origin guard uses it to
  recognise same-origin requests. It must not be stripped.
- **Rocket Loader / script rewriting** off for the app. It reorders script
  execution and can run the bootstrap before the access token module initialises.

## CSRF

Three layers, in order of what actually stops an attack:

1. **`SameSite=Lax`** — a cross-site POST does not carry the refresh cookie at all.
2. **`OriginGuard`** (`backend/internal/shared/middleware/origin_guard.go`) —
   state-changing requests from an unconfigured origin are refused with 403.
   CORS alone does not do this: it withholds the response from the attacker's
   page, but the request has already reached the handler and taken effect.
3. **Exact-origin CORS with credentials** — never a wildcard, which browsers
   reject alongside `Access-Control-Allow-Credentials` anyway.

## Refresh-token storage

Refresh tokens are stored in `sessions.refresh_token` as a SHA-256 hash. The
bearer value exists only in the cookie and the browser holding it, so read access
to the database does not yield a usable session.

Rotation is one transaction: the presented session is revoked and its replacement
written together, conditional on the old row still being active. The conditional
update is what makes concurrent refreshes safe — the database decides which
request wins, and the loser gets a 409 telling it to retry rather than being
treated as a token thief.

A session's absolute expiry is fixed when it is created and carried across every
rotation. Refreshing does not extend a session: a "Remember me" sign-in keeps its
own 30-day clock, and an ordinary session still ends after 7 days no matter how
often the user reloads.

### Deploying migration 0094

`0094_harden_auth_session_persistence` adds `remember_me` and `rotated_from`, and
**revokes every session still holding a plaintext refresh token**. A raw token
cannot be converted into its own hash, and leaving those rows active would mean
they can never be matched again while still counting as live sessions.

Everyone signed in at deploy time signs in again once. That is the intended cost
of removing plaintext tokens from the database; schedule it accordingly.

## Known gap

Access tokens are not revocable before they expire. Ending a session stops the
refresh cookie immediately, but an access token already issued stays valid for
the remainder of its `ACCESS_TOKEN_TTL` (15 minutes by default). This is the R02
residual recorded in the Phase 1 security report and is unchanged by this work;
`ACCESS_TOKEN_TTL` is the size of that window and is now configurable.

## Diagnosing "refreshing logs me out"

In order:

1. **Read the startup log line.** `refresh cookie policy resolved` shows
   `secure`, `same_site`, `domain` and the TTLs the API is actually using.
2. **Look at the cookie in the browser's devtools**, on the API's origin. If it
   is absent after a successful login, the browser refused it — almost always
   `Secure` over plain HTTP, or a `Domain` that does not match.
3. **Watch the network tab across a reload.** `POST /api/v1/auth/refresh` should
   answer 200. A 401 means the cookie was not sent or the session is gone; a 429
   means a rate limit is being hit; a 404 means `NEXT_PUBLIC_API_URL` is missing
   the `/api/v1` prefix.
4. **Check `CORS_ALLOWED_ORIGINS`** contains the web origin exactly, including
   scheme and port.
