-- Migration 0056 Down: Drop Billing & Entitlement System Tables
DROP TABLE IF EXISTS billing_audit_logs CASCADE;
DROP TABLE IF EXISTS billing_webhook_events CASCADE;
DROP TABLE IF EXISTS billing_usage CASCADE;
DROP TABLE IF EXISTS billing_coupons CASCADE;
DROP TABLE IF EXISTS billing_refunds CASCADE;
DROP TABLE IF EXISTS billing_invoice_items CASCADE;
DROP TABLE IF EXISTS billing_invoices CASCADE;
DROP TABLE IF EXISTS billing_payments CASCADE;
DROP TABLE IF EXISTS billing_payment_methods CASCADE;
DROP TABLE IF EXISTS billing_subscription_items CASCADE;
DROP TABLE IF EXISTS billing_subscriptions CASCADE;
DROP TABLE IF EXISTS billing_customers CASCADE;
DROP TABLE IF EXISTS billing_plan_entitlements CASCADE;
DROP TABLE IF EXISTS billing_entitlements CASCADE;
DROP TABLE IF EXISTS billing_plans CASCADE;
