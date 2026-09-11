package middleware

import (
	"compress/gzip"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// alreadyCompressed reports whether a media type carries its own compression.
//
// Running deflate over a PNG, a JPEG or a zip spends CPU to make the response
// slightly larger. That alone would only be waste; the reason it is checked
// here is correctness, because a handler that streams a stored object also
// knows its exact size and says so, and a body that is re-encoded underneath
// such a handler no longer matches the length it declared.
func alreadyCompressed(contentType string) bool {
	mediaType := strings.ToLower(strings.TrimSpace(strings.SplitN(contentType, ";", 2)[0]))
	if mediaType == "" {
		return false
	}
	switch {
	case strings.HasPrefix(mediaType, "image/"):
		// SVG is XML and compresses well; everything else in image/ does not.
		return mediaType != "image/svg+xml"
	case strings.HasPrefix(mediaType, "video/"), strings.HasPrefix(mediaType, "audio/"):
		return true
	}
	switch mediaType {
	case "application/zip", "application/gzip", "application/x-gzip",
		"application/x-7z-compressed", "application/x-rar-compressed",
		"application/pdf", "font/woff", "font/woff2":
		return true
	}
	return false
}

// gzipWriter compresses a response body, but only once it knows what the body
// is.
//
// The decision is deferred to the first write because Content-Type is set by
// the handler, which runs after the middleware. Deciding up front is what made
// this wrong: every response was compressed, including images served with an
// explicit Content-Length, and the result was a body that did not match its own
// headers.
type gzipWriter struct {
	gin.ResponseWriter
	writer *gzip.Writer
	// decided is set once the response's Content-Type has been inspected.
	decided bool
	// compressing records the outcome, and whether the gzip writer was used at
	// all - closing an unused one would emit a gzip header into a response that
	// is not gzip.
	compressing bool
}

func (g *gzipWriter) decide() {
	if g.decided {
		return
	}
	g.decided = true

	if alreadyCompressed(g.Header().Get("Content-Type")) {
		// Pass the bytes through untouched, and take back the promise made
		// before the handler ran.
		g.Header().Del("Content-Encoding")
		return
	}

	g.compressing = true
	// The compressed body is a different length, and its length is not known
	// until it has been written. Leaving a stale Content-Length behind produces
	// a response a client reads as truncated - which, for an image, is a
	// picture that does not render.
	g.Header().Del("Content-Length")
}

func (g *gzipWriter) WriteHeader(status int) {
	g.decide()
	g.ResponseWriter.WriteHeader(status)
}

func (g *gzipWriter) Write(data []byte) (int, error) {
	g.decide()
	if !g.compressing {
		return g.ResponseWriter.Write(data)
	}
	return g.writer.Write(data)
}

func (g *gzipWriter) WriteString(s string) (int, error) {
	return g.Write([]byte(s))
}

// finish flushes the compressor, and only when it was actually used.
func (g *gzipWriter) finish() {
	if g.compressing {
		_ = g.writer.Close()
	}
}

func GzipCompressionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
			c.Next()
			return
		}
		// A range request is served in pieces whose offsets refer to the stored
		// bytes. Re-encoding the body makes those offsets meaningless.
		if c.GetHeader("Range") != "" {
			c.Next()
			return
		}

		gz, err := gzip.NewWriterLevel(c.Writer, gzip.DefaultCompression)
		if err != nil {
			c.Next()
			return
		}

		// Announced up front and withdrawn in decide() for a body that is
		// already compressed. Gin buffers headers until the response is
		// written, so the withdrawal reaches the client rather than the promise.
		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")

		writer := &gzipWriter{ResponseWriter: c.Writer, writer: gz}
		c.Writer = writer
		defer writer.finish()

		c.Next()
	}
}

// Helper interface checks.
var (
	_ io.Writer          = (*gzipWriter)(nil)
	_ http.Flusher       = (*gzipWriter)(nil)
	_ gin.ResponseWriter = (*gzipWriter)(nil)
)
