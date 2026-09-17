# Nexus — Modular Multi-App SaaS Ecosystem & Coordination Platform

> **Architectural Documentation & Technical Blueprint**  
> *Unified Platform Architecture (AS-01 Task Engine + AS-02 Signal Conversation Extraction)*

---

## 1. Executive Summary & Core Principle

**Nexus** is an enterprise-grade, multi-tenant modular SaaS platform built to coordinate complex multi-stakeholder projects (e.g., commercial construction, interior architecture, engineering, and logistics). 

### Core Principle: Modular SaaS Ecosystem
The platform is designed around a single fundamental principle: **A customer (organization) can license just Nexus Core, just Nexus Signal, or both.**

```
                           ┌────────────────────────────────────────┐
                           │          SHARED PLATFORM LAYER         │
                           │  - Unified Identity (JWT / Auth)       │
                           │  - Multi-Tenant Isolation (Orgs)       │
                           │  - Entitlements & RBAC Middleware      │
                           │  - Cross-App Domain Event Bus          │
                           └──────────────────┬─────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│              NEXUS CORE               │   │             NEXUS SIGNAL              │
│       (Task & Dependency Graph)       │   │        (AI Conversation Extraction)    │
│  - Directed Acyclic Graph (DAG)       │   │  - Multi-Pass LLM Pipeline (Gemini/   │
│  - Blast Radius Impact Analysis       │   │    Groq)                              │
│  - Automated Approval Gate Reopening  │   │  - Actionable Item & Memory Extraction│
│  - Critical Path & Bottleneck Engine  │   │  - Fuzzy Entity Matching (Task Sync)  │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
```

Both products run on one shared platform infrastructure. Access control is managed strictly at the **entitlements layer** (`requireAppEntitlement`), eliminating scattered conditional checks and allowing tenant administrators to dynamically toggle features on or off in real time without downtime or code deployment.

---

## 2. Shared Platform Infrastructure

### 2.1 Multi-Tenant Organization Architecture
Organizations are isolated at the database level. Every user, project, task, and conversation belongs to an `organization_id`.
- **Whitfield Interiors** (Demo Tenant A): Full multi-app entitlement (`nexus` + `nexus_signal`).
- **Studio Solo** (Demo Tenant B): Modular tenant with only `nexus` core enabled.

### 2.2 Entitlements Middleware
Access control is enforced at the route group mount point via middleware arrays:

```javascript
// Mounted in server/src/index.js
const nexusEntitlement = [authenticate, requireAppEntitlement('nexus')];
const signalEntitlement = [authenticate, requireAppEntitlement('nexus_signal')];

// Gated routes
app.use(['/api/projects/:id/tasks', '/projects/:id/tasks'], nexusEntitlement, taskRoutes);
app.use(['/api/conversations', '/conversations'], signalEntitlement, signalConversationsRoutes);
```

When an administrator toggles an app in **Organization Settings**, the `organization_apps` table updates immediately, instantly granting or revoking access across all active user sessions.

### 2.3 Cross-App Domain Event Bus
When an event occurs in one app (e.g., confirming a Signal extracted item), a structured event is published to the shared `domain_events` table:

```json
{
  "event_type": "CONVERSATION_ITEM_CONFIRMED",
  "source_app": "nexus_signal",
  "organization_id": "a0000000-0000-0000-0000-000000000001",
  "payload": {
    "item_type": "decision",
    "description": "Subcontractor requested 5-day delay on HVAC ductwork installation",
    "resolved_task_id": "t-101",
    "blast_radius_score": 14,
    "blast_radius_level": "high"
  }
}
```

Nexus Core subscribes to these domain events and automatically triggers the **Impact Cascade Analysis Engine**, recalculating downstream project delays and reopening necessary approval gates.

---

## 3. Product Modules

### 3.1 Nexus Core: Task & Impact Cascade Engine (AS-01)
- **Graph Traversal Algorithm**: Represents tasks as nodes and dependencies as directed edges in a Directed Acyclic Graph (DAG).
- **Blast Radius Calculation**: When a change order or delay is proposed, the engine performs depth-first graph traversal:
  $$\text{Blast Radius Score} = \sum_{i \in \text{Affected Tasks}} \text{Weight}(i) + \sum_{j \in \text{Reopened Gates}} 5$$
- **Approval Gate Reopening**: Downstream tasks that are marked as "Approved" or "Complete" are automatically reopened into "Pending Approval" if an upstream task delay breaches their schedule boundaries.

### 3.2 Nexus Signal: AI Conversation Extraction (AS-02)
- **Multi-Pass LLM Extraction**:
  - **Pass 1 (Gemini 3.1 Flash-Lite)**: Extract candidate action items, decisions, risks, and milestone updates.
  - **Pass 2 (Groq / GPT-OSS-120B Fallback)**: Validate candidate items against schema constraints.
  - **Pass Comparison**: Deterministic merge algorithm resolves discrepancies between model passes.
- **Fuzzy Entity Resolution**: Uses Levenshtein distance and token similarity matching to link extracted items to existing project tasks in the database.

---

## 4. Database Schema Overview

```sql
-- Shared Platform Schema
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization_apps (
    organization_id UUID REFERENCES organizations(id),
    app_name VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    PRIMARY KEY (organization_id, app_name)
);

CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    event_type VARCHAR(100) NOT NULL,
    source_app VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. Cloud Deployment & Serverless Architecture

- **Vercel Serverless Function Wrapper**: `/api/index.js` wraps the Express application in an explicit handler:
  ```javascript
  module.exports = (req, res) => app(req, res);
  ```
- **Dual Route Mounting**: All routes are mounted on both `/api/*` and `/*` to handle Vercel proxy rewrites gracefully.
- **Neon Cloud Database Pooling**: Uses `pg.Pool` with SSL fallback connection strings, maintaining zero-downtime serverless database queries.

---

## 6. Future Expansion & Vision: "What I Would Implement Next"

If granted additional development time, the platform would evolve into a **Universal Enterprise SaaS Intelligence Fabric**, uniting multiple vertical SaaS platforms (Construction, CRM, ERP, Supply Chain, and Procurement) under a single cognitive AI layer.

```
                           ┌────────────────────────────────────────┐
                           │   FUTURE ENTERPRISE SAAS FABRIC        │
                           │  - Global Knowledge Graph               │
                           │  - Multi-Agent Orchestrator            │
                           │  - Predictive Anomaly & Risk Engine    │
                           └──────────────────┬─────────────────────┘
                                              │
    ┌──────────────┬──────────────┬───────────┴──┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼              ▼
┌────────┐    ┌────────┐    ┌────────┐    ┌────────────┐  ┌───────────┐  ┌───────────┐
│ Nexus  │    │ Nexus  │    │ Nexus  │    │   Nexus    │  │   Nexus   │  │   Nexus   │
│ Core   │    │ Signal │    │ CRM    │    │ Supply     │  │ Financial │  │ Auto-    │
│ (Tasks)│    │ (Conversations)│ (Sales) │    │ Chain      │  │ ERP       │  │ Roadmap   │
└────────┘    └────────┘    └────────┘    └────────────┘  └───────────┘  └───────────┘
```

### 6.1 Unifying Additional SaaS Platforms Under One Fabric
- **Nexus CRM Integration**: Auto-create project workspaces directly from won sales deals in Salesforce or Hubspot. Automatically sync client communication logs to project timelines.
- **Nexus Supply Chain & Logistics**: Track raw material lead times (e.g., custom marble, HVAC units) directly from supplier APIs. If a shipping vessel or manufacturer delays shipment, the Impact Engine automatically recalculates on-site construction schedules weeks in advance.
- **Nexus Financial & ERP Sync**: Link change requests and blast radius scores directly to budget impact models in QuickBooks or SAP, predicting cost overruns before purchase orders are issued.

### 6.2 Universal Knowledge Graph & Enterprise Semantic Memory
- **Unified Graph Database (Neo4j / PG-Vector)**: Connect transcripts, CAD blueprints, RFIs, invoices, and Slack threads into a single querying graph.
- **Cross-App Contextual Search**: Ask natural language questions like *"Why was the marble installation delayed in Project Whitfield?"* and receive a synthesized answer referencing the original phone call transcript, the affected task, and the approved change order.

### 6.3 Multi-Modal AI Meeting & Visual Blueprint Intelligence
- **Audio & CAD Visual Analysis**: Extend Signal AI to parse audio/video recordings directly alongside PDF architectural blueprints. The AI will compare site walkthrough videos against floor plans to automatically detect out-of-spec installations.

### 6.4 Autonomous AI Roadmap & GANTT Generation
- **Self-Healing Roadmaps**: Dynamically construct and adjust Critical Path Method (CPM) project roadmaps directly from team Slack threads, WhatsApp messages, and email threads without manual PM data entry.

### 6.5 Proactive AI Risk Suggestions & Anomaly Agents
- **Autonomous Risk Agents**: Background agents continuously analyzing domain events to predict contractor default risk, supply chain bottlenecks, and safety compliance failures before they occur on-site.

---

*Documentation compiled for Nexus AS-06 Platform Architecture.*
