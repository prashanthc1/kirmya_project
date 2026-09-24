package storage

import (
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"
)

// AWS's published examples for S3 SigV4, from
// https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
// and .../sigv4-query-string-auth.html. If these match, the signer computes
// what AWS computes.

var awsExampleCreds = sigV4Credentials{
	AccessKeyID:     "AKIAIOSFODNN7EXAMPLE",
	SecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
	Region:          "us-east-1",
}

var awsExampleTime = time.Date(2013, 5, 24, 0, 0, 0, 0, time.UTC)

func TestSigV4MatchesAWSGetObjectExample(t *testing.T) {
	req, _ := http.NewRequest(http.MethodGet, "https://examplebucket.s3.amazonaws.com/test.txt", nil)
	req.Header.Set("Range", "bytes=0-9")
	signRequest(req, awsExampleCreds, emptyPayloadHash, awsExampleTime)

	want := "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, " +
		"SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, " +
		"Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41"
	if got := req.Header.Get("Authorization"); got != want {
		t.Fatalf("Authorization =\n  %s\nwant\n  %s", got, want)
	}
}

func TestSigV4MatchesAWSPresignedURLExample(t *testing.T) {
	u, _ := url.Parse("https://examplebucket.s3.amazonaws.com/test.txt")
	signed, err := url.Parse(presignGet(u, awsExampleCreds, 24*time.Hour, awsExampleTime))
	if err != nil {
		t.Fatal(err)
	}
	q := signed.Query()
	if got := q.Get("X-Amz-Signature"); got != "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404" {
		t.Fatalf("signature = %s", got)
	}
	if q.Get("X-Amz-Expires") != "86400" || q.Get("X-Amz-Credential") != "AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request" {
		t.Fatalf("query = %v", q)
	}
}

func TestPresignExpiryIsBounded(t *testing.T) {
	u, _ := url.Parse("https://examplebucket.s3.amazonaws.com/test.txt")
	long, _ := url.Parse(presignGet(u, awsExampleCreds, 30*24*time.Hour, awsExampleTime))
	if got := long.Query().Get("X-Amz-Expires"); got != "604800" {
		t.Fatalf("a month-long URL: X-Amz-Expires = %s, want the 7-day maximum", got)
	}
}

func TestURIEncodeFollowsSigV4(t *testing.T) {
	for in, want := range map[string]string{
		"a b":              "a%20b",
		"résumé.pdf":       "r%C3%A9sum%C3%A9.pdf",
		"x+y=z":            "x%2By%3Dz",
		"Unreserved-_.~09": "Unreserved-_.~09",
	} {
		if got := uriEncode(in); got != want {
			t.Errorf("uriEncode(%q) = %q, want %q", in, got, want)
		}
	}
	u, _ := url.Parse("https://b.example/a%20dir/file%2Bname.txt")
	if got := canonicalPath(u); !strings.HasPrefix(got, "/a%20dir/") || got != "/a%20dir/file%2Bname.txt" {
		t.Errorf("canonicalPath = %s", got)
	}
}
