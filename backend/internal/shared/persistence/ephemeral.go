// Package persistence keeps track of which repositories actually persist.
//
// Several modules ship a repository that satisfies its interface entirely from
// process memory: it accepts the pgx pool, never queries it, and returns
// success. Nothing about calling one looks different from calling a real
// repository — the writes are accepted, the reads come back, the tests pass —
// so the gap is invisible until a restart empties the data or a second replica
// answers with a different copy of it. Registering them here makes the list
// explicit, and Audit turns it into a startup decision instead of a discovery
// made in production.
package persistence

import (
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"sync"
)

// Ephemeral describes one repository whose data does not survive the process.
type Ephemeral struct {
	// Module is the internal/<module> package the repository belongs to.
	Module string
	// Data names what is held in memory, in the terms a reader of the audit
	// would use — "issued verification codes", not "the codes map".
	Data string
	// Consequence states what a user observes when the process restarts or a
	// second replica takes the request. Written out because "in-memory" alone
	// does not tell an operator whether this is a cache or a data loss bug.
	Consequence string
}

var (
	mu         sync.Mutex
	registered = map[string]Ephemeral{}
)

// RegisterEphemeral records a repository as memory-only. Constructors call it,
// so the audit reflects what the running binary actually wired up rather than
// what the source tree contains. Repeat registrations of a module overwrite
// rather than duplicate: tests build these repositories many times.
func RegisterEphemeral(e Ephemeral) {
	if e.Module == "" {
		return
	}
	mu.Lock()
	defer mu.Unlock()
	registered[e.Module] = e
}

// Registered returns every ephemeral repository built so far, ordered by module.
func Registered() []Ephemeral {
	mu.Lock()
	defer mu.Unlock()

	out := make([]Ephemeral, 0, len(registered))
	for _, e := range registered {
		out = append(out, e)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Module < out[j].Module })
	return out
}

// Reset clears the registry. For tests only.
func Reset() {
	mu.Lock()
	defer mu.Unlock()
	registered = map[string]Ephemeral{}
}

// Audit reports the ephemeral repositories and decides whether the process may
// serve traffic with them. Outside production they are logged and allowed:
// local development and CI depend on them. In production they are a refusal to
// start unless acknowledged is true, because a deployment that silently drops
// user data on every restart is worse than one that does not come up — the
// second is noticed immediately.
func Audit(appEnv string, acknowledged bool) error {
	entries := Registered()
	if len(entries) == 0 {
		slog.Info("Persistence audit: every wired repository is database backed")
		return nil
	}

	modules := make([]string, 0, len(entries))
	for _, e := range entries {
		modules = append(modules, e.Module)
		slog.Warn("Ephemeral repository wired: data is lost on restart and not shared between replicas",
			slog.String("module", e.Module),
			slog.String("data", e.Data),
			slog.String("consequence", e.Consequence),
		)
	}

	isProduction := strings.EqualFold(appEnv, "production")
	switch {
	case !isProduction:
		slog.Warn("Persistence audit: modules are running on memory-only storage",
			slog.Int("count", len(entries)),
			slog.String("modules", strings.Join(modules, ",")),
		)
		return nil
	case acknowledged:
		slog.Warn("Persistence audit: memory-only storage accepted in production via ALLOW_EPHEMERAL_REPOS",
			slog.Int("count", len(entries)),
			slog.String("modules", strings.Join(modules, ",")),
		)
		return nil
	default:
		return fmt.Errorf(
			"refusing to start in production: %d modules have memory-only repositories that lose their data on restart and disagree between replicas (%s). "+
				"Implement their storage, stop wiring the module, or set ALLOW_EPHEMERAL_REPOS=true to accept the data loss deliberately",
			len(entries), strings.Join(modules, ", "),
		)
	}
}
