-- AS-06: Multi-App SaaS Platform — Organizations, Entitlements, Domain Events
-- This migration is ADDITIVE — it does not drop or modify existing columns.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Apps (entitlement source of truth)
CREATE TABLE IF NOT EXISTS organization_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_name VARCHAR(30) NOT NULL CHECK (app_name IN ('nexus', 'nexus_signal')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  UNIQUE(organization_id, app_name)
);

-- 3. Domain Events (cross-app event log)
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  source_app VARCHAR(30) NOT NULL CHECK (source_app IN ('nexus', 'nexus_signal', 'platform')),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_domain_events_org_created ON domain_events(organization_id, created_at DESC);

-- 4. Add organization_id to users and projects
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
