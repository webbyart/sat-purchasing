-- ============================================================================
-- SUMINO AAPICO (Thailand) Company Limited - Electronic Procurement Schema
-- Designed for Supabase / PostgreSQL (All-in-one SQL Schema script)
-- Copy, paste, and execute this in the Supabase SQL Editor.
-- ============================================================================

-- Drop tables if exists to start fresh (Optional - comment out if you want to retain existing data)
-- DROP TABLE IF EXISTS users, departments, vendors, workflow_rules, purchase_requisitions, purchase_orders, comparison_sheets, capex_requisitions, notifications, audit_logs, running_numbers, surveys, deliveries, deposits, cash_purchases, credit_purchases, returns, adjustments, landed_costs;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  name text NOT NULL,
  thai_name text,
  email text NOT NULL,
  role text NOT NULL,
  department_id text,
  title text,
  is_active boolean DEFAULT true,
  branch text,
  company text,
  signature_url text
);

-- 2. Table: departments
CREATE TABLE IF NOT EXISTS departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  budget numeric DEFAULT 0,
  spent numeric DEFAULT 0,
  remaining numeric DEFAULT 0
);

-- 3. Table: vendors
CREATE TABLE IF NOT EXISTS vendors (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text,
  address text,
  phone text,
  fax text,
  tax_id text,
  contact_person text,
  credit_term text
);

-- 4. Table: workflow_rules
CREATE TABLE IF NOT EXISTS workflow_rules (
  id text PRIMARY KEY,
  department_id text NOT NULL,
  amount_limit numeric DEFAULT 100000,
  require_executive_approval boolean DEFAULT true,
  parallel_approval boolean DEFAULT false,
  delegate_active boolean DEFAULT false
);

-- 5. Table: purchase_requisitions (PR)
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id text PRIMARY KEY,
  pr_number text UNIQUE,
  date text,
  requestor_id text,
  requestor_name text,
  requestor_email text,
  department_id text,
  department_name text,
  suggested_vendor_id text,
  vendor_name text,
  vendor_address text,
  vendor_phone text,
  vendor_fax text,
  vendor_tax_id text,
  items jsonb DEFAULT '[]'::jsonb,
  purchase_objective text,
  subtotal numeric DEFAULT 0,
  vat numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  status text,
  attachments jsonb DEFAULT '[]'::jsonb,
  workflow_logs jsonb DEFAULT '[]'::jsonb,
  current_step_index integer DEFAULT 0,
  company_name text,
  branch_name text
);

-- 6. Table: purchase_orders (PO)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id text PRIMARY KEY,
  po_number text UNIQUE,
  refer_pr_id text,
  refer_pr_number text,
  date text,
  vendor_id text,
  vendor_name text,
  vendor_address text,
  vendor_phone text,
  vendor_fax text,
  vendor_tax_id text,
  shipping_address text,
  department_id text,
  department_name text,
  credit_term text,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  vat numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  status text,
  notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  workflow_logs jsonb DEFAULT '[]'::jsonb,
  current_step_index integer DEFAULT 0,
  company_name text,
  branch_name text,
  delivery_url text,
  deposit_url text
);

-- 7. Table: comparison_sheets (CS)
CREATE TABLE IF NOT EXISTS comparison_sheets (
  id text PRIMARY KEY,
  cs_number text UNIQUE,
  refer_pr_id text,
  refer_pr_number text,
  date text,
  requestor_id text,
  requestor_name text,
  department_id text,
  department_name text,
  items jsonb DEFAULT '[]'::jsonb,
  status text,
  workflow_logs jsonb DEFAULT '[]'::jsonb,
  current_step_index integer DEFAULT 0
);

-- 8. Table: capex_requisitions (CAPEX)
CREATE TABLE IF NOT EXISTS capex_requisitions (
  id text PRIMARY KEY,
  capex_number text UNIQUE,
  date text,
  project_name text,
  asset_group text,
  budget_status text,
  payback_period numeric,
  total_investment numeric DEFAULT 0,
  cost_savings_per_year numeric DEFAULT 0,
  npv_irr text,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  vat numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  status text,
  requestor_id text,
  requestor_name text,
  department_id text,
  department_name text,
  workflow_logs jsonb DEFAULT '[]'::jsonb,
  current_step_index integer DEFAULT 0
);

-- 9. Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  recipient_email text,
  recipient_name text,
  title text,
  message text,
  channel text,
  timestamp text,
  is_read boolean DEFAULT false,
  status text
);

-- 10. Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  timestamp text,
  user_id text,
  user_name text,
  user_role text,
  action text,
  module text,
  details text,
  ip_address text,
  user_agent text
);

-- 11. Table: running_numbers
CREATE TABLE IF NOT EXISTS running_numbers (
  id text PRIMARY KEY,
  year integer,
  pr_counter integer DEFAULT 0,
  po_counter integer DEFAULT 0,
  cs_counter integer DEFAULT 0,
  capex_counter integer DEFAULT 0
);

-- 12. Generic Auxiliary Tables
CREATE TABLE IF NOT EXISTS surveys (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS deliveries (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS deposits (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS cash_purchases (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS credit_purchases (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS returns (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS adjustments (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);
CREATE TABLE IF NOT EXISTS landed_costs (id text PRIMARY KEY, data jsonb DEFAULT '{}'::jsonb);

-- 13. Table: chat_rooms (Employee Chat Rooms / Private & Group Chat History)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id text PRIMARY KEY,
  name text,
  type text NOT NULL DEFAULT 'PRIVATE',
  participant_ids jsonb DEFAULT '[]'::jsonb,
  last_message text,
  last_message_at text,
  created_at text,
  unread_counts jsonb DEFAULT '{}'::jsonb
);

-- 14. Table: chat_messages (Employee Chat Messages / Chat History Log)
CREATE TABLE IF NOT EXISTS chat_messages (
  id text PRIMARY KEY,
  room_id text NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  text text NOT NULL,
  created_at text NOT NULL,
  read_by jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- Disable Row Level Security (RLS) to allow direct anonymous REST access 
-- (Perfect for quick and painless client-side integration via the anon key)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_sheets DISABLE ROW LEVEL SECURITY;
ALTER TABLE capex_requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE running_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE landed_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
