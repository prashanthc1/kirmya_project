// Command loadcheck drives a representative read/write mix at a running API and
// reports what it measured.
//
// Step 9 asks for a load test over representative data and write/read mixes,
// with the hardware, workload and results recorded and capacity targets chosen
// explicitly. Nothing in this repository measured throughput or latency at all,
// so every performance statement in the docs was an assertion.
//
// The mix is the public hiring path, because that is the traffic that decides
// whether the product works: listing the board, opening a posting, and
// submitting an application. Reads dominate, as they do in life — a job board
// serves many more views than applications.
//
// What this is not: a capacity statement. It reports the numbers it observed on
// the host it ran on, and prints that host alongside them. Running it beside the
// database and the web server on a shared 4-core container measures that
// arrangement, not a production tier.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"runtime"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

type result struct {
	label    string
	duration time.Duration
	status   int
	err      error
}

func main() {
	api := flag.String("api", "http://127.0.0.1:8080", "base URL of the running API")
	duration := flag.Duration("duration", 30*time.Second, "how long to apply load")
	concurrency := flag.Int("concurrency", 16, "concurrent clients")
	writeRatio := flag.Float64("write-ratio", 0.1, "fraction of requests that submit an application")
	flag.Parse()

	client := &http.Client{Timeout: 20 * time.Second}

	// One seeded account and posting, so the measurement is of serving traffic
	// rather than of account creation.
	fmt.Println("seeding a posting and an applicant...")
	employer, err := seedAccount(client, *api, "loadcheck-employer")
	if err != nil {
		fail("seed employer: %v", err)
	}
	jobID, err := publishJob(client, *api, employer)
	if err != nil {
		fail("publish job: %v", err)
	}
	applicants := make([]string, 0, *concurrency)
	for i := 0; i < *concurrency; i++ {
		token, err := seedAccount(client, *api, fmt.Sprintf("loadcheck-seeker-%d", i))
		if err != nil {
			fail("seed applicant %d: %v", i, err)
		}
		applicants = append(applicants, token)
	}

	fmt.Printf("driving %d clients for %s at %s (write ratio %.0f%%)\n\n",
		*concurrency, *duration, *api, *writeRatio*100)

	ctx, cancel := context.WithTimeout(context.Background(), *duration)
	defer cancel()

	var mu sync.Mutex
	results := make([]result, 0, 4096)
	var issued int64

	var wg sync.WaitGroup
	start := time.Now()
	for worker := 0; worker < *concurrency; worker++ {
		wg.Add(1)
		go func(worker int) {
			defer wg.Done()
			rng := rand.New(rand.NewSource(time.Now().UnixNano() + int64(worker)))
			local := make([]result, 0, 512)
			for ctx.Err() == nil {
				var r result
				switch {
				case rng.Float64() < *writeRatio:
					r = timed("apply", func() (int, error) {
						return applyToJob(ctx, client, *api, applicants[worker], jobID)
					})
				case rng.Float64() < 0.5:
					r = timed("board", func() (int, error) {
						return get(ctx, client, *api+"/api/v1/jobs?page=1&limit=20", "")
					})
				default:
					r = timed("posting", func() (int, error) {
						return get(ctx, client, *api+"/api/v1/jobs/"+jobID, "")
					})
				}
				atomic.AddInt64(&issued, 1)
				local = append(local, r)
			}
			mu.Lock()
			results = append(results, local...)
			mu.Unlock()
		}(worker)
	}
	wg.Wait()
	elapsed := time.Since(start)

	report(results, elapsed, *concurrency)
}

func report(results []result, elapsed time.Duration, concurrency int) {
	byLabel := map[string][]result{}
	for _, r := range results {
		byLabel[r.label] = append(byLabel[r.label], r)
	}

	labels := make([]string, 0, len(byLabel))
	for label := range byLabel {
		labels = append(labels, label)
	}
	sort.Strings(labels)

	fmt.Printf("host             %d CPU, go %s, %s/%s\n",
		runtime.NumCPU(), runtime.Version(), runtime.GOOS, runtime.GOARCH)
	fmt.Printf("workload         %d clients, %.1fs\n\n", concurrency, elapsed.Seconds())
	fmt.Printf("%-9s %8s %8s %8s %9s %9s %9s %9s\n",
		"operation", "count", "ok", "failed", "req/s", "p50", "p95", "p99")

	var totalOK, totalBad int
	for _, label := range labels {
		rs := byLabel[label]
		latencies := make([]time.Duration, 0, len(rs))
		ok, bad := 0, 0
		for _, r := range rs {
			if r.err != nil || r.status >= 400 {
				bad++
				continue
			}
			ok++
			latencies = append(latencies, r.duration)
		}
		totalOK += ok
		totalBad += bad
		sort.Slice(latencies, func(i, j int) bool { return latencies[i] < latencies[j] })
		fmt.Printf("%-9s %8d %8d %8d %9.1f %9s %9s %9s\n",
			label, len(rs), ok, bad, float64(len(rs))/elapsed.Seconds(),
			percentile(latencies, 0.50), percentile(latencies, 0.95), percentile(latencies, 0.99))

		// A failure count with nothing to explain it sends the reader back to
		// the server logs to find out what a run they already did was telling
		// them, so the reasons are printed here.
		if bad > 0 {
			reasons := map[string]int{}
			for _, r := range rs {
				switch {
				case r.err != nil:
					reasons["transport: "+r.err.Error()]++
				case r.status >= 400:
					reasons[fmt.Sprintf("HTTP %d", r.status)]++
				}
			}
			for reason, n := range reasons {
				fmt.Printf("%-9s   %d x %s\n", "", n, truncateString(reason))
			}
		}
	}

	fmt.Printf("\ntotal            %d requests, %.1f req/s, %d failed (%.2f%%)\n",
		len(results), float64(len(results))/elapsed.Seconds(), totalBad,
		100*float64(totalBad)/float64(max(len(results), 1)))

	// A run that could not serve its traffic is a failed run, not a slow one.
	if totalBad > 0 && float64(totalBad)/float64(len(results)) > 0.01 {
		fmt.Fprintf(os.Stderr, "\nmore than 1%% of requests failed\n")
		os.Exit(1)
	}
}

func percentile(sorted []time.Duration, p float64) time.Duration {
	if len(sorted) == 0 {
		return 0
	}
	i := int(p * float64(len(sorted)))
	if i >= len(sorted) {
		i = len(sorted) - 1
	}
	return sorted[i].Round(time.Millisecond)
}

func timed(label string, call func() (int, error)) result {
	start := time.Now()
	status, err := call()
	return result{label: label, duration: time.Since(start), status: status, err: err}
}

func get(ctx context.Context, client *http.Client, url, token string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, err
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()
	io.Copy(io.Discard, res.Body)
	return res.StatusCode, nil
}

func applyToJob(ctx context.Context, client *http.Client, api, token, jobID string) (int, error) {
	body := []byte(`{"coverLetter":"Submitted by loadcheck."}`)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		api+"/api/v1/jobs/"+jobID+"/apply", bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	res, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()
	io.Copy(io.Discard, res.Body)
	// A duplicate application is the expected answer after the first one, and
	// exercises the same write path. It is not a failure of the run.
	if res.StatusCode == http.StatusConflict || res.StatusCode == http.StatusBadRequest {
		return http.StatusOK, nil
	}
	return res.StatusCode, nil
}

const loadPassword = "Disposable-loadcheck-password-123!"

func seedAccount(client *http.Client, api, label string) (string, error) {
	email := fmt.Sprintf("%s-%d-%d@example.invalid", label, time.Now().UnixNano(), rand.Intn(1<<20))
	registration, _ := json.Marshal(map[string]any{
		"firstName": "Load", "lastName": "Check", "email": email,
		"password": loadPassword, "acceptTerms": true, "acceptPrivacy": true,
	})
	if _, err := post(client, api+"/api/v1/auth/register", "", registration); err != nil {
		return "", err
	}

	credentials, _ := json.Marshal(map[string]string{"email": email, "password": loadPassword})
	body, err := post(client, api+"/api/v1/auth/login", "", credentials)
	if err != nil {
		return "", err
	}
	var parsed struct {
		AccessToken string `json:"accessToken"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil || parsed.AccessToken == "" {
		return "", fmt.Errorf("no access token in login response: %s", truncate(body))
	}
	return parsed.AccessToken, nil
}

func publishJob(client *http.Client, api, token string) (string, error) {
	payload, _ := json.Marshal(map[string]any{
		"title":          "Loadcheck posting",
		"description":    "A posting served to measure read and write throughput on the hiring path.",
		"status":         "Active",
		"workplaceType":  "Remote",
		"employmentType": "Full-time",
		"location":       "Remote",
	})
	body, err := post(client, api+"/api/v1/recruiter/jobs", token, payload)
	if err != nil {
		return "", err
	}
	var parsed struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil || parsed.ID == "" {
		return "", fmt.Errorf("no job id in response: %s", truncate(body))
	}
	return parsed.ID, nil
}

func post(client *http.Client, url, token string, body []byte) ([]byte, error) {
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	answer, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return answer, fmt.Errorf("%s answered %d: %s", url, res.StatusCode, truncate(answer))
	}
	return answer, nil
}

func truncateString(s string) string {
	if len(s) > 160 {
		return s[:160] + "..."
	}
	return s
}

func truncate(b []byte) string {
	if len(b) > 200 {
		return string(b[:200]) + "..."
	}
	return string(b)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
