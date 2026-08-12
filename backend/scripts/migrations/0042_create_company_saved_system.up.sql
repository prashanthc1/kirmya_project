-- up migration: create company saved table

CREATE TABLE IF NOT EXISTS company_saved (
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_saved_user ON company_saved(user_id);
