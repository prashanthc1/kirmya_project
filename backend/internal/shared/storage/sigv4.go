package storage

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

// AWS Signature Version 4, the authentication every S3-compatible service
// accepts: AWS S3, Cloudflare R2, MinIO, and the Tigris storage behind Railway
// buckets.
//
// Written out rather than taken from an SDK for the same reason as the Stripe
// client: object storage here needs PUT, GET, HEAD, DELETE and a presigned GET,
// and a small signer that can be read and tested against AWS's published
// examples is easier to trust than a large dependency. The algorithm is the one
// documented at
// https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html.

const (
	sigV4Algorithm = "AWS4-HMAC-SHA256"
	sigV4Service   = "s3"
	// emptyPayloadHash is the SHA-256 of an empty body.
	emptyPayloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	// unsignedPayload is the payload hash a presigned URL signs: the body is not
	// known when the URL is made.
	unsignedPayload = "UNSIGNED-PAYLOAD"
	// maxPresignExpiry is the longest a SigV4 presigned URL may live.
	maxPresignExpiry = 7 * 24 * time.Hour
)

type sigV4Credentials struct {
	AccessKeyID     string
	SecretAccessKey string
	Region          string
}

func (c sigV4Credentials) scope(day string) string {
	return day + "/" + c.Region + "/" + sigV4Service + "/aws4_request"
}

func (c sigV4Credentials) signingKey(day string) []byte {
	key := hmacSHA256([]byte("AWS4"+c.SecretAccessKey), day)
	key = hmacSHA256(key, c.Region)
	key = hmacSHA256(key, sigV4Service)
	return hmacSHA256(key, "aws4_request")
}

// signRequest adds a SigV4 Authorization header to req. payloadHash is the
// hex SHA-256 of the body. Host, Content-Type, Range and every x-amz-* header
// present are signed.
func signRequest(req *http.Request, creds sigV4Credentials, payloadHash string, now time.Time) {
	stamp := now.UTC().Format("20060102T150405Z")
	day := stamp[:8]
	req.Header.Set("X-Amz-Date", stamp)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)

	headers := map[string]string{"host": hostOf(req)}
	for name, values := range req.Header {
		lower := strings.ToLower(name)
		if lower == "content-type" || lower == "range" || strings.HasPrefix(lower, "x-amz-") {
			headers[lower] = strings.TrimSpace(strings.Join(values, ","))
		}
	}
	names := make([]string, 0, len(headers))
	for name := range headers {
		names = append(names, name)
	}
	sort.Strings(names)
	var canonicalHeaders strings.Builder
	for _, name := range names {
		canonicalHeaders.WriteString(name + ":" + headers[name] + "\n")
	}
	signedHeaders := strings.Join(names, ";")

	canonicalRequest := strings.Join([]string{
		req.Method,
		canonicalPath(req.URL),
		canonicalQuery(req.URL.Query()),
		canonicalHeaders.String(),
		signedHeaders,
		payloadHash,
	}, "\n")
	signature := creds.sign(day, stamp, canonicalRequest)
	req.Header.Set("Authorization", fmt.Sprintf("%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		sigV4Algorithm, creds.AccessKeyID, creds.scope(day), signedHeaders, signature))
}

// presignGet returns objectURL with a SigV4 query-string signature allowing a
// GET until now+expiry.
func presignGet(objectURL *url.URL, creds sigV4Credentials, expiry time.Duration, now time.Time) string {
	if expiry > maxPresignExpiry {
		expiry = maxPresignExpiry
	}
	if expiry < time.Second {
		expiry = time.Second
	}
	stamp := now.UTC().Format("20060102T150405Z")
	day := stamp[:8]

	u := *objectURL
	query := u.Query()
	query.Set("X-Amz-Algorithm", sigV4Algorithm)
	query.Set("X-Amz-Credential", creds.AccessKeyID+"/"+creds.scope(day))
	query.Set("X-Amz-Date", stamp)
	query.Set("X-Amz-Expires", fmt.Sprintf("%d", int64(expiry/time.Second)))
	query.Set("X-Amz-SignedHeaders", "host")

	canonicalRequest := strings.Join([]string{
		http.MethodGet,
		canonicalPath(&u),
		canonicalQuery(query),
		"host:" + u.Host + "\n",
		"host",
		unsignedPayload,
	}, "\n")
	query.Set("X-Amz-Signature", creds.sign(day, stamp, canonicalRequest))
	u.RawQuery = canonicalQuery(query)
	return u.String()
}

func (c sigV4Credentials) sign(day, stamp, canonicalRequest string) string {
	stringToSign := strings.Join([]string{
		sigV4Algorithm,
		stamp,
		c.scope(day),
		hexSHA256([]byte(canonicalRequest)),
	}, "\n")
	return hex.EncodeToString(hmacSHA256(c.signingKey(day), stringToSign))
}

func hostOf(req *http.Request) string {
	if req.Host != "" {
		return req.Host
	}
	return req.URL.Host
}

// canonicalPath is the URI-encoded path, each segment encoded once; S3 does
// not normalise it.
func canonicalPath(u *url.URL) string {
	path := u.Path
	if path == "" {
		return "/"
	}
	segments := strings.Split(path, "/")
	for i, segment := range segments {
		segments[i] = uriEncode(segment)
	}
	return strings.Join(segments, "/")
}

// canonicalQuery sorts parameters by name and value, each URI-encoded.
func canonicalQuery(values url.Values) string {
	type pair struct{ key, value string }
	var pairs []pair
	for key, vs := range values {
		for _, v := range vs {
			pairs = append(pairs, pair{uriEncode(key), uriEncode(v)})
		}
	}
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].key != pairs[j].key {
			return pairs[i].key < pairs[j].key
		}
		return pairs[i].value < pairs[j].value
	})
	parts := make([]string, len(pairs))
	for i, p := range pairs {
		parts[i] = p.key + "=" + p.value
	}
	return strings.Join(parts, "&")
}

// uriEncode encodes everything but the unreserved characters, as SigV4 requires
// (url.QueryEscape turns a space into '+', which SigV4 does not accept).
func uriEncode(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') ||
			c == '-' || c == '_' || c == '.' || c == '~' {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

func hmacSHA256(key []byte, data string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(data))
	return mac.Sum(nil)
}

func hexSHA256(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
