-- 0082_create_trust_safety_content_moderation_module.down.sql

DROP TABLE IF EXISTS moderator_workloads CASCADE;
DROP TABLE IF EXISTS evidence_items CASCADE;
DROP TABLE IF EXISTS user_reputations CASCADE;
DROP TABLE IF EXISTS safety_policies CASCADE;
