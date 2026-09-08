package middleware

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

// OriginGuard refuses state-changing browser requests from origins that are not
// configured.
//
// This is the half of CSRF protection that CORS does not provide. The CORS
// middleware withholds Access-Control-Allow-Origin from an unknown origin, which
// stops the attacker's page from *reading* the response — but for a simple
// request the browser has already sent it, and the handler has already run. A
// forged POST could therefore still take effect; only its result was hidden.
//
// SameSite=Lax on the refresh cookie is the primary defence, since a cross-site
// POST does not carry the cookie at all. This is the belt to that pair of
// braces, and it also covers the access-token path, where a browser extension or
// a mis-scoped subdomain could otherwise reach a state-changing endpoint.
//
// Requests with no Origin and no Referer pass through: a browser always sends
// Origin on a cross-origin request and on any POST, so their absence means the
// caller is not a browser — a mobile client, a server-to-server integration or
// curl — and those carry no ambient cookie to forge with.
func OriginGuard(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		if normalized := normalizeOrigin(origin); normalized != "" {
			allowed[normalized] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			// Safe methods by definition, and preflights are answered by CORS.
			c.Next()
			return
		}

		// Origin is authoritative when the header is present at all. Referer is
		// the fallback for the few browser paths that omit Origin; it is only
		// consulted when Origin is absent, never to override it.
		//
		// The presence of the header decides, not whether it parsed. A
		// sandboxed iframe and a file:// page both send "Origin: null", and
		// treating that as "no origin" would wave through exactly the contexts
		// the browser is flagging as opaque.
		rawOrigin := strings.TrimSpace(c.GetHeader("Origin"))
		var claimed string
		if rawOrigin != "" {
			claimed = normalizeOrigin(rawOrigin)
			if claimed == "" {
				// Present but opaque ("null"). Nothing can match it.
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "Request origin is not allowed",
				})
				return
			}
		} else {
			claimed = originOfURL(c.GetHeader("Referer"))
		}

		if claimed == "" {
			// Neither header: not a browser, and so no ambient cookie to forge.
			c.Next()
			return
		}

		if _, ok := allowed[claimed]; !ok {
			// Same-origin requests are always allowed even when the origin is
			// not in the configured list, so a deployment that forgot to list
			// its own address does not lock itself out of its own API.
			if !sameOriginRequest(c, claimed) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "Request origin is not allowed",
				})
				return
			}
		}

		c.Next()
	}
}

// sameOriginRequest reports whether the claimed origin is the host this request
// was addressed to.
func sameOriginRequest(c *gin.Context, claimed string) bool {
	host := c.Request.Host
	if host == "" {
		return false
	}
	scheme := "http"
	if c.Request.TLS != nil || strings.EqualFold(c.GetHeader("X-Forwarded-Proto"), "https") {
		scheme = "https"
	}
	return claimed == normalizeOrigin(scheme+"://"+host)
}

// normalizeOrigin lowercases an origin and drops a trailing slash so two
// spellings of the same origin compare equal.
func normalizeOrigin(origin string) string {
	origin = strings.ToLower(strings.TrimSpace(origin))
	origin = strings.TrimSuffix(origin, "/")
	if origin == "" || origin == "null" {
		// "null" is what a sandboxed iframe or a file:// page sends. It is never
		// a configured origin and must not match one.
		return ""
	}
	return origin
}

// originOfURL reduces a Referer to its origin.
func originOfURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}
	return normalizeOrigin(parsed.Scheme + "://" + parsed.Host)
}
