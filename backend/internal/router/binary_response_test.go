package router

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gin-gonic/gin"

	"kirmya/internal/shared/middleware"
)

// pngPayload is real PNG bytes: already-compressed binary, which is what the
// compression middleware has to leave alone.
var pngPayload = []byte{
	0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
	0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
	0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
	0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
	0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
}

// streamingRouter mirrors what the media module's file view handler does: set
// the stored object's content type and exact length, then write the bytes.
func streamingRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(middleware.GzipCompressionMiddleware())

	engine.GET("/image", func(c *gin.Context) {
		c.Header("Content-Type", "image/png")
		c.Header("Content-Length", strconv.Itoa(len(pngPayload)))
		c.Status(http.StatusOK)
		_, _ = c.Writer.Write(pngPayload)
	})
	engine.GET("/json", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"repeated": string(bytes.Repeat([]byte("compress me "), 200))})
	})
	engine.GET("/svg", func(c *gin.Context) {
		c.Header("Content-Type", "image/svg+xml")
		c.String(http.StatusOK, "<svg>%s</svg>", string(bytes.Repeat([]byte("<rect/>"), 200)))
	})
	return engine
}

func get(t *testing.T, engine *gin.Engine, path string, acceptGzip bool) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if acceptGzip {
		req.Header.Set("Accept-Encoding", "gzip")
	}
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

// TestBinaryResponsesSurviveAGzipAcceptingClient is the regression test for the
// missing profile avatar.
//
// Every browser sends "Accept-Encoding: gzip". The compression middleware used
// to wrap every response on that basis, deciding before the handler ran and so
// before the content type was known. A handler streaming a stored image sets an
// exact Content-Length; the body was then re-encoded underneath it and the
// length was left behind, so the response declared 67 bytes and carried a
// 10-byte gzip stream. Measured against the real server, curl read 10 bytes and
// Go's client read none at all - a profile picture that silently would not
// render, for every user, on every browser.
//
// The assertion is what a client actually receives, not which branch was taken.
func TestBinaryResponsesSurviveAGzipAcceptingClient(t *testing.T) {
	rec := get(t, streamingRouter(), "/image", true)

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200", rec.Code)
	}
	if encoding := rec.Header().Get("Content-Encoding"); encoding != "" {
		t.Errorf("an already-compressed image was served with Content-Encoding %q", encoding)
	}
	body := rec.Body.Bytes()
	if !bytes.Equal(body, pngPayload) {
		t.Errorf("received %d bytes, sent %d; the image was altered in transit", len(body), len(pngPayload))
	}
	// The declared length has to describe the bytes that were actually sent.
	if declared := rec.Header().Get("Content-Length"); declared != "" {
		want := strconv.Itoa(len(body))
		if declared != want {
			t.Errorf("Content-Length says %s, body is %s bytes", declared, want)
		}
	}
}

// Without the header nothing is encoded either, and the bytes are unchanged.
func TestBinaryResponsesAreIntactWithoutGzip(t *testing.T) {
	rec := get(t, streamingRouter(), "/image", false)
	if !bytes.Equal(rec.Body.Bytes(), pngPayload) {
		t.Errorf("received %d bytes, sent %d", rec.Body.Len(), len(pngPayload))
	}
}

// The fix must not stop compressing the things worth compressing. A response
// body that is text still arrives gzipped and still decodes.
func TestTextResponsesAreStillCompressed(t *testing.T) {
	for _, path := range []string{"/json", "/svg"} {
		t.Run(path, func(t *testing.T) {
			rec := get(t, streamingRouter(), path, true)

			if rec.Header().Get("Content-Encoding") != "gzip" {
				t.Fatalf("%s was not compressed for a client that accepts gzip", path)
			}
			if declared := rec.Header().Get("Content-Length"); declared != "" {
				// A stale length on a compressed body is the same defect in the
				// other direction.
				if declared != strconv.Itoa(rec.Body.Len()) {
					t.Errorf("Content-Length %s does not describe the %d compressed bytes",
						declared, rec.Body.Len())
				}
			}

			reader, err := gzip.NewReader(bytes.NewReader(rec.Body.Bytes()))
			if err != nil {
				t.Fatalf("the response claims gzip but does not decode: %v", err)
			}
			defer reader.Close()
			decoded, err := io.ReadAll(reader)
			if err != nil {
				t.Fatalf("decompressing: %v", err)
			}
			if len(decoded) <= rec.Body.Len() {
				t.Errorf("compression made the body larger: %d compressed, %d original",
					rec.Body.Len(), len(decoded))
			}
		})
	}
}

// Vary must be set whenever the response depends on Accept-Encoding, or a
// shared cache will serve a compressed body to a client that cannot read one.
func TestCompressionVariesOnAcceptEncoding(t *testing.T) {
	for _, path := range []string{"/image", "/json"} {
		rec := get(t, streamingRouter(), path, true)
		if rec.Header().Get("Vary") != "Accept-Encoding" {
			t.Errorf("%s: Vary = %q, want Accept-Encoding", path, rec.Header().Get("Vary"))
		}
	}
}

// A range request refers to offsets in the stored bytes, so the body must not
// be re-encoded underneath it.
func TestRangeRequestsAreNotCompressed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/image", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	req.Header.Set("Range", "bytes=0-9")
	rec := httptest.NewRecorder()
	streamingRouter().ServeHTTP(rec, req)

	if encoding := rec.Header().Get("Content-Encoding"); encoding != "" {
		t.Errorf("a range request was served with Content-Encoding %q", encoding)
	}
}
