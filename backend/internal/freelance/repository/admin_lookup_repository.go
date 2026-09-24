package repository

import (
	"context"

	"kirmya/internal/freelance/domain"

	"github.com/google/uuid"
)

// Lookups for the administrative screens: the names behind the ids a dispute or
// a payout carries. Each is one query for a whole page of rows, never one per
// row.

// AdminLookupRepository names contracts and people for administrators.
type AdminLookupRepository interface {
	// ContractSummaries describes each contract that exists; a missing id is
	// simply absent from the map.
	ContractSummaries(ctx context.Context, contractIDs []uuid.UUID) (map[uuid.UUID]domain.ContractSummary, error)
	// People names each account that exists.
	People(ctx context.Context, userIDs []uuid.UUID) (map[uuid.UUID]domain.PersonRef, error)
}

func (r *pgxFreelanceRepository) ContractSummaries(ctx context.Context, contractIDs []uuid.UUID) (map[uuid.UUID]domain.ContractSummary, error) {
	out := map[uuid.UUID]domain.ContractSummary{}
	if len(contractIDs) == 0 {
		return out, nil
	}
	if r.pool == nil {
		// No users table in memory: the people carry their ids alone.
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, id := range contractIDs {
			c, ok := r.contracts[id]
			if !ok {
				continue
			}
			summary := domain.ContractSummary{
				ID:         c.ID,
				Client:     domain.PersonRef{ID: c.ClientID},
				Freelancer: domain.PersonRef{ID: c.FreelancerID},
			}
			if p := r.projects[c.ProjectID]; p != nil {
				summary.ProjectTitle = p.Title
			}
			out[id] = summary
		}
		return out, nil
	}

	rows, err := r.pool.Query(ctx,
		`SELECT c.id, COALESCE(p.title, ''),
		        c.client_id, COALESCE(TRIM(cu.first_name || ' ' || cu.last_name), ''), COALESCE(cu.email, ''),
		        c.freelancer_id, COALESCE(TRIM(fu.first_name || ' ' || fu.last_name), ''), COALESCE(fu.email, '')
		   FROM freelance_contracts c
		   LEFT JOIN freelance_projects p ON p.id = c.project_id
		   LEFT JOIN users cu ON cu.id = c.client_id
		   LEFT JOIN users fu ON fu.id = c.freelancer_id
		  WHERE c.id = ANY($1)`, contractIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var s domain.ContractSummary
		if err := rows.Scan(&s.ID, &s.ProjectTitle,
			&s.Client.ID, &s.Client.Name, &s.Client.Email,
			&s.Freelancer.ID, &s.Freelancer.Name, &s.Freelancer.Email); err != nil {
			return nil, err
		}
		out[s.ID] = s
	}
	return out, rows.Err()
}

func (r *pgxFreelanceRepository) People(ctx context.Context, userIDs []uuid.UUID) (map[uuid.UUID]domain.PersonRef, error) {
	out := map[uuid.UUID]domain.PersonRef{}
	if len(userIDs) == 0 || r.pool == nil {
		return out, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT id, TRIM(first_name || ' ' || last_name), email FROM users WHERE id = ANY($1)`, userIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var p domain.PersonRef
		if err := rows.Scan(&p.ID, &p.Name, &p.Email); err != nil {
			return nil, err
		}
		out[p.ID] = p
	}
	return out, rows.Err()
}
