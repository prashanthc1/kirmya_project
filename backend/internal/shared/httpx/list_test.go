package httpx

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

type dashboard struct {
	RecentJobs []string         `json:"recentJobs"`
	Counts     map[string]int   `json:"counts"`
	Nested     *dashboard       `json:"nested,omitempty"`
	Labels     map[string][]int `json:"labels"`
}

func render(t *testing.T, payload any) string {
	t.Helper()
	gin.SetMode(gin.TestMode)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	JSONList(c, http.StatusOK, payload)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	return rec.Body.String()
}

func TestNilSliceRendersAsEmptyArray(t *testing.T) {
	var items []string
	if got := render(t, items); got != "[]" {
		t.Errorf("bare nil slice: got %s want []", got)
	}
	if got := render(t, gin.H{"data": items}); got != `{"data":[]}` {
		t.Errorf("nil slice in map: got %s want {\"data\":[]}", got)
	}
}

func TestNilSliceInStructField(t *testing.T) {
	got := render(t, gin.H{"dashboard": dashboard{}})
	var out struct {
		Dashboard struct {
			RecentJobs []string `json:"recentJobs"`
		} `json:"dashboard"`
	}
	if err := json.Unmarshal([]byte(got), &out); err != nil {
		t.Fatal(err)
	}
	if out.Dashboard.RecentJobs == nil {
		t.Errorf("struct field stayed null: %s", got)
	}
}

func TestNestedContainersAndPointers(t *testing.T) {
	got := render(t, &dashboard{Nested: &dashboard{}, Labels: map[string][]int{"a": nil}})
	var out map[string]any
	if err := json.Unmarshal([]byte(got), &out); err != nil {
		t.Fatal(err)
	}
	if out["recentJobs"] == nil {
		t.Errorf("pointer target not normalized: %s", got)
	}
	nested, ok := out["nested"].(map[string]any)
	if !ok || nested["recentJobs"] == nil {
		t.Errorf("nested pointer struct not normalized: %s", got)
	}
	labels, ok := out["labels"].(map[string]any)
	if !ok || labels["a"] == nil {
		t.Errorf("nil slice in map value not normalized: %s", got)
	}
}

func TestExistingDataAndNilMapsAreLeftAlone(t *testing.T) {
	if got := render(t, gin.H{"data": []string{"x"}, "meta": map[string]int(nil), "err": nil}); got != `{"data":["x"],"err":null,"meta":null}` {
		t.Errorf("unexpected normalization: %s", got)
	}
}

func TestNonNil(t *testing.T) {
	var s []int
	if got := NonNil(s); got == nil || len(got) != 0 {
		t.Errorf("NonNil(nil) = %v", got)
	}
	if got := NonNil([]int{1}); len(got) != 1 {
		t.Errorf("NonNil kept data wrong: %v", got)
	}
}
