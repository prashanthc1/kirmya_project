-- Migration Down: 0084_create_admin_control_center_and_operations_module.down.sql

DROP TABLE IF EXISTS background_jobs CASCADE;
DROP TABLE IF EXISTS platform_maintenance_mode CASCADE;
DROP TABLE IF EXISTS admin_impersonation_sessions CASCADE;
