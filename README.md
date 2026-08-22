
# TradeGuard AI 🛡️

> **An AI-native financial intelligence, behavioral risk, and compliance automation platform — purpose-built for GIFT City IBUs and cross-border trade finance.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-AWS%20EC2-orange)](http://13.201.85.22/)
[![AWS Bedrock](https://img.shields.io/badge/AI-AWS%20Bedrock%20Claude%203.7%20Sonnet-blue)](https://aws.amazon.com/bedrock/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20%2B%20EC2-green)](https://docker.com/)
[![Hackathon](https://img.shields.io/badge/GIFT%20IFIH-Young%20Builders%20Program-purple)](https://github.com/its-vikash-Kushwaha/TradeGaurdAi)

---

## 🚀 Live Demo

**Deployed on AWS EC2 — Mumbai (ap-south-1)**

🔗 **[http://13.201.85.22/](http://13.201.85.22/)**

| Page | URL | Status |
|------|-----|--------|
| Command Center | http://13.201.85.22/ | ✅ Live |
| Compliance Agent | http://13.201.85.22/compliance | ✅ Live — verified end-to-end (LOW/MEDIUM/HIGH, HITL approve) |
| Multi-Agent Orchestrator | http://13.201.85.22/orchestrator | ✅ Live — verified end-to-end |
| Trading Journal + Behavioral | http://13.201.85.22/journal | ✅ Live |
| Research Terminal | http://13.201.85.22/research | ⚠️ Page loads; underlying ticker-data API currently returns 401 pending an app-process restart on the server (auth bypass flag was set but hasn't taken effect yet — verified via a live-timestamp check) |

*Status reflects a real, timestamped test pass against the live URL — not an assumption. `/research`'s gap will flip to ✅ once the EC2 process is confirmed restarted.*

---

## 🎯 What Is TradeGuard AI?

TradeGuard AI is a compliance decision-support platform for GIFT City International Banking Unit (IBU) trade-finance officers.

Today, verifying a Letter of Credit case — cross-checking a Bill of Lading, the LC itself, and the commercial invoice — is a manual, multi-hour process per case, with no structured audit trail of what was checked and by whom.

**TradeGuard AI runs that first-pass check in seconds**: four deterministic compliance checks, a weighted risk score, an AI-generated analyst narrative (Amazon Bedrock, with an honest rule-based fallback when unavailable), and a mandatory human sign-off above a risk threshold — every action logged to an audit trail.

> We are not selling automation. We are selling augmentation. The AI flags. The officer decides.

### The Three Pillars

```
┌────────────────────┬────────────────────┬────────────────────┐
│  MARKET             │  BEHAVIORAL         │  COMPLIANCE          │
│  INTELLIGENCE        │  INTELLIGENCE        │  OPERATIONS           │
├────────────────────┼────────────────────┼────────────────────┤
│  Ticker research     │  Trading journal      │  LC / trade-doc        │
│  (US, NSE, crypto,   │  Overtrading,          │  verification           │
│  forex, commodities) │  revenge-trading,      │  IFSCA-style rule       │
│  Live price + chart  │  position-size          │  checks                 │
│  Technical read       │  detection              │  Weighted risk engine   │
│                      │  Emotional risk score  │  HITL approval          │
│                      │                        │  Immutable audit trail  │
└────────────────────┴────────────────────┴────────────────────┘
```

---

## 🏗️ Architecture

```
                     USER INPUT (LC case: caseId, symbol, documents)
                                     │
                                     ▼
                     MULTI-AGENT ORCHESTRATOR
                     POST /api/orchestrator
                                     │
              ┌──────────────┬──────────────┬──────────────┐
              ▼              ▼              ▼              ▼
        ResearchAgent  ComplianceAgent   RiskEngine   BehavioralAgent
        (Bedrock, or   (4 deterministic  (weighted    (real trade
         honest         checks + Bedrock  0-100 score  history pattern
         synthetic       narrative)        over the     detection —
         fallback)                         same checks) skipped if no
                                                          user session)
              └──────────────┴──────────────┴──────────────┘
                                     │
                                     ▼
                        SYNTHESIS (combine findings,
                          take the more cautious tier)
                                     │
                  ┌──────────────────┴──────────────────┐
                  ▼                                      ▼
         requires_human_review = false          requires_human_review = true
         verdict shown directly                  HITL panel: Approve /
         (PASS / REVIEW)                          Escalate / Reject
                  │                                      │
                  └──────────────────┬──────────────────┘
                                     ▼
                    IMMUTABLE AUDIT TRAIL
                    DynamoDB (ap-south-1), in-memory
                    fallback when AWS is unreachable
```

### Agent Responsibilities

| Agent | Role | Real / Fallback |
|---|---|---|
| **ResearchAgent** | Gathers case-level findings (regulatory checklist, key points, confidence) for the LC case | Amazon Bedrock (Claude 3.7 Sonnet); falls back to a clearly-labeled `synthetic-demo` checklist when Bedrock is unreachable |
| **ComplianceAgent** | Runs 4 deterministic checks: document completeness, invoice/LC amount consistency, consignee match, basic IFSCA-style regulatory flag | Rule-based checks (always real) + Bedrock-written narrative summary, with a `rule-based-fallback` narrative when Bedrock is unreachable |
| **RiskEngine** | Computes a weighted 0–100 score over the same 4 checks | Deterministic weighted-sum — not a model estimate |
| **BehavioralAgent** | Detects overtrading, revenge-trading, and position-size patterns from the officer's real trade history | Real trade-data analysis; only runs when a user session exists |
| **Synthesis** | Combines all agent outputs into one verdict and decides whether HITL is required | Deterministic — `requires_human_review` fires if *either* RiskEngine or ComplianceAgent flags elevated risk |

**On the "6 agents" framing:** earlier drafts of this README described 6 agents including a "Market Agent." That agent was never built — a decision made deliberately, since adding an unauthenticated market-data endpoint alongside the existing (auth-gated) ticker research feature would have duplicated functionality without fixing anything. This README reflects the 4 agents + synthesis step that actually exist and are tested.

---

## 📐 Risk Scoring Formula

`lib/ai/riskEngine.ts` computes a weighted score from the same 4 compliance checks:

| Category | Weight | Source check |
|---|---|---|
| Document Completeness | 25% | `document_completeness` |
| Counterparty Risk | 30% | `party_verification` |
| Regulatory Compliance | 25% | `regulatory_compliance` |
| Transaction Patterns | 20% | `amount_consistency` |

A failed check contributes its full category weight (as a 0–100 sub-score) to the overall score.

| Score | Tier | Action |
|---|---|---|
| 0–30 | **LOW** | Standard processing |
| 31–60 | **MEDIUM** | Flag for review — officer sign-off required |
| 61–80 | **HIGH** | Route to human officer, mandatory review |
| 81–100 | **CRITICAL** | Block and escalate |

**Known, documented quirk:** RiskEngine's weighted score and ComplianceAgent's simpler failed-check-count verdict (`0 failed → LOW`, `1 → MEDIUM`, `2+ → HIGH`) can land on different tiers for the same evidence — they're different methodologies by design. `requires_human_review` is the OR of both, so the safety-critical behavior never depends on which one "wins."

---

## ✨ Features

### 1. Multi-Agent Orchestrator (`/orchestrator`)
Runs Research → Compliance → Risk → Behavioral → Synthesis against any of 3 built-in demo cases (LOW/MEDIUM/HIGH), with an animated step-by-step progress UI. Auto-triggers HITL and logs to the audit trail.

### 2. Compliance Agent (`/compliance`)
Takes an LC case (Bill of Lading, Letter of Credit, Invoice), runs the 4 deterministic checks, produces a verdict (PASS/REVIEW/FAIL), risk tier, confidence score, and an AI-written analyst summary.

### 3. Risk Engine
Weighted 0–100 gauge with a per-category breakdown, shown on both the Compliance and Orchestrator pages, computed from the same check data (not a separate, potentially-diverging judgment).

### 4. Human-in-the-Loop (HITL)
Auto-appears when `requires_human_review` is true. Approve / Escalate / Reject with an officer-notes field, logged with a unique event ID.

### 5. Research Agent (LC case research)
`lib/ai/researchAgent.ts` — produces a structured checklist/finding set for a trade-finance case via Bedrock, with an honestly-labeled synthetic fallback. Distinct from the ticker Research Terminal below.

### 6. Research Terminal (`/research`)
Multi-market ticker search (US stocks, India NSE, crypto, forex, commodities, global) with real Yahoo Finance price data, a price chart, and a technical-indicator read. Gated behind a per-user session (see Live Demo status above for current live-deployment state).

### 7. Trading Journal + Behavioral Intelligence (`/journal`)
Full journal CRUD with AI reflection (Bedrock, with an honest "reflection unavailable — entry saved" fallback that never discards the entry). Behavioral panel runs on real trade history: overtrading detection (>5 trades/7-day window), revenge-trading detection (3+ consecutive losses), position-size breach detection (50%+ above average), win/loss ratio, best/worst day, and an emotional risk score — falls back to a clearly-labeled synthetic 30-day pattern only when a user has zero real trades.

### 8. AI Compliance Copilot
Context-aware sidebar for live trading positions — 6 perspective agents (Technical, Institutional, Dark Pool, Social, Fundamental, Behavioral) plus a consensus verdict. Every fallback is visibly badged `SYNTHETIC` rather than showing a bare "unavailable," and is grounded in the position's real P&L. The behavioral fallback specifically never claims a `TILT` psych state, so a placeholder can't trigger the real emergency-intervention modal on fake data.

### 9. Immutable Audit Trail
Every agent action and every human decision is logged with a unique event ID — DynamoDB when AWS is configured, an in-memory fallback (confirmed tested) when it isn't.

---

## 🔌 API Reference

### `GET /api/status`
```bash
curl http://13.201.85.22/api/status
```
Returns:
```json
{
  "bedrock": false,
  "dynamodb": true,
  "auditMode": "dynamodb",
  "region": "ap-south-1",
  "timestamp": "2026-08-22T02:13:52.776Z",
  "features": { "sequentialAgents": true, "hitlApproval": true, "complianceCheck": true, "auditTrail": true, "regimeDetection": true, "behavioralIntelligence": true }
}
```
`features` is a static capability flag block describing what this build implements — it is **not** a live health check of each item. Only `bedrock` and `dynamodb` above are actually probed.

### `POST /api/compliance`
```bash
curl -X POST http://13.201.85.22/api/compliance \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case_highrisk_001",
    "symbol": "TATASTEEL",
    "documents": {
      "billOfLading": { "consignee": "Meridian Exports Ltd", "portOfLoading": "Chennai", "portOfDischarge": "Singapore" },
      "letterOfCredit": { "consignee": "Meridian Exports Ltd", "amount": 100000, "currency": "USD" },
      "invoice": { "amount": 150000, "currency": "USD" }
    }
  }'
```
Each of `billOfLading` / `letterOfCredit` / `invoice` is an **object**, not a reference-number string — the checks read sub-fields like `.amount` and `.consignee` directly.

Returns `{ caseId, symbol, verdict, riskLevel, confidence, checks, aiAnalysis, model, timestamp, requiresHumanReview }`.

### `POST /api/compliance/{caseId}/approve`
```bash
curl -X POST http://13.201.85.22/api/compliance/case_highrisk_001/approve \
  -H "Content-Type: application/json" \
  -d '{ "decision": "ESCALATED", "notes": "Manually verified", "userId": "demo_officer" }'
```
Body: `{ decision, notes?, userId? }` — `userId` defaults to `"demo_officer"` if omitted. Returns `{ caseId, eventId, decision, logged }`.

### `POST /api/orchestrator`
```bash
curl -X POST http://13.201.85.22/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case_highrisk_001",
    "symbol": "TATASTEEL",
    "documents": { "billOfLading": {...}, "letterOfCredit": {...}, "invoice": {...} }
  }'
```
`documents` is optional but required for a meaningful compliance result — omitting it makes `document_completeness` fail for real (all 3 missing), which is correct behavior, not a bug.

Returns `{ case_id, agents_invoked, total_processing_time, overall_risk, compliance_status, key_findings, recommendation, requires_human_review, confidence, audit_entry_id, research, compliance, risk, behavioral }`. `behavioral` is `null` when no user session exists (e.g. a bare `curl` request) — the step is honestly skipped, not faked.

### `POST /api/research` (LC case research agent)
```bash
curl -X POST http://13.201.85.22/api/research \
  -H "Content-Type: application/json" \
  -d '{ "query": "LC compliance check GIFT City", "context": "MT700 Letter of Credit", "documentType": "LC" }'
```
Returns `{ success, agent, findings: { key_points, risk_level, confidence, regulatory_flags, recommendation }, model, source, timestamp, processing_time_ms }`. `source` is `"bedrock"` or `"synthetic-demo"`.

---

## 🖥️ Setup Instructions (Local Dev)

```bash
git clone https://github.com/its-vikash-Kushwaha/TradeGaurdAi.git
cd TradeGaurdAi
pnpm install

# Local Postgres via the included docker-compose (db service only)
docker compose up -d db

# Point Prisma at it (or copy from .env.local.example and edit)
echo 'DATABASE_URL=postgresql://postgres:password123@localhost:5432/tradeguard?sslmode=disable' >> .env.local
echo 'DIRECT_URL=postgresql://postgres:password123@localhost:5432/tradeguard?sslmode=disable' >> .env.local
echo 'ALLOW_PROTOTYPE_USER=true' >> .env.local   # bypasses Clerk auth for local/demo use

npx prisma db push
npx tsx prisma/seed.ts   # seeds a demo user + sample trades/journals/watchlist

pnpm dev   # http://localhost:3000
```

Regime microservice (separate, optional — Gaussian HMM market-regime detection, unrelated to the compliance pipeline):
```bash
cd regime-service
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
REGIME_API_KEY=dev .venv/bin/uvicorn main:app --port 8000
```

---

## 🐳 Docker Deployment

`docker-compose.yml` defines 3 services: `db` (Postgres 16), `regime-service` (the Python HMM microservice), and `web` (the Next.js app).

```bash
docker compose up -d --build
```

The live EC2 instance runs this stack behind nginx. **Note:** environment variable changes on that server require an actual process restart to take effect — editing a `.env` file alone does nothing until the process (`pm2`/`docker compose restart web`) reloads it. `GET /api/status`'s `timestamp` field (computed fresh on every request) is a reliable way to confirm a restart actually happened: call it twice a few seconds apart — if the timestamp doesn't change, the process didn't restart.

---

## 📁 Project Structure

```
app/
  (dashboard)/
    compliance/page.tsx
    orchestrator/page.tsx
    journal/page.tsx
    research/page.tsx
    trades/, watchlist/, settings/, feed/, mind/, copilot/
  api/
    compliance/route.ts
    compliance/[caseId]/route.ts
    compliance/[caseId]/approve/route.ts
    compliance/demo/route.ts
    orchestrator/route.ts
    research/route.ts              ← LC case research agent
    research/[symbol]/route.ts     ← ticker research (ticker Research Terminal)
    journal/route.ts
    status/route.ts
    positions/, watchlist/, ...
components/
  AgentOrchestrator.tsx
  RiskEngine.tsx
  compliance/
    VerdictPanel.tsx
    AuditTrail.tsx
    AnalysisLoader.tsx
  copilot/
    CopilotPanel.tsx
    NewPositionModal.tsx
    TiltInterventionModal.tsx
  journal/
    BehavioralPanel.tsx
  layout/
    Sidebar.tsx
    TopBar.tsx
    BottomNav.tsx
    DashboardLayout.tsx
lib/
  ai/
    bedrock.ts
    complianceAgent.ts
    researchAgent.ts
    riskEngine.ts
    behavioral.ts
    router.ts               ← multi-provider AI routing (Azure/GitHub Models/Claude/Grok/Perplexity)
  aws/
    audit.ts                ← DynamoDB client + in-memory fallback
  services/
    complianceChecks.ts     ← the 4 deterministic checks, shared by /api/compliance and /api/orchestrator
    copilot.service.ts
  data/
    synthetic.ts
prisma/
  schema.prisma
regime-service/               ← separate Python FastAPI + hmmlearn microservice
```

---

## 🧪 Synthetic Data Disclosure

| Synthetic / Mocked | Real / Production-grade |
|---|---|
| The 3 demo LC cases (documents, amounts, parties) | The 4-check compliance verification logic |
| The Copilot panel's per-agent fallback text (visibly badged `SYNTHETIC`, never presented as real) | Amazon Bedrock integration (real SDK calls, real fallback logic) |
| ResearchAgent's fallback checklist when Bedrock is unreachable | The weighted Risk Engine calculation |
| IFSCA/RBI rule check (2 conditions — a placeholder, not a validated regulatory rule engine) | AWS DynamoDB audit trail (real SDK calls) |
| | HITL approval workflow, including the audit log entry it produces |
| | Behavioral pattern detection (runs on real trade history when it exists) |

No SWIFT, no core-banking integration, no OCR/document parser exists — a real LC PDF is not understood by this system, only hand-built JSON matching the expected shape.

---

## 🚧 Production Gaps (Honest)

- **Real document parsing** — OCR/SWIFT MT700 parser. This is the actual bottleneck to a real pilot, more than any agent logic.
- **Hosted Postgres** — currently a local/EC2-local Docker container, not a managed service (AWS RDS or equivalent).
- **Multi-tenant auth** — the demo bypass (`ALLOW_PROTOTYPE_USER`) shares one identity across all requests; Clerk is integrated but not exercised with real per-officer accounts in this deployment.
- **Live market data feed for the ticker Research Terminal** — currently gated behind the same auth flow as everything else; see Live Demo status above for the current state of the live deployment specifically.
- **Full IFSCA regulatory rule database** — the current check is a 2-condition placeholder, not a validated rule engine.
- **Bedrock model access** — the AWS SDK integration is real and tested; live Bedrock model access has not yet been granted in the account backing this deployment (`bedrock: false` in `/api/status`), so AI narratives currently run on the honest rule-based fallback.

---

## 🗺️ Roadmap

**Sprint 1 (next):** find one GIFT City IBU officer as a design partner; run 20 real LC cases by hand alongside TradeGuard; score the verdicts against the officer's actual judgment.

**Sprint 2:** real document parser (OCR + structured extraction) to replace hand-built JSON input; apply to the IFSCA regulatory sandbox.

**Sprint 3:** validated IFSCA/RBI/FEMA rule set (beyond the current placeholder), multi-tenant officer accounts, hosted Postgres.

**Year 1:** expand from LC verification to the broader ~50-IBU GIFT City cluster; per-case or per-desk pricing model validated against real usage.

---

## ⚖️ Regulatory Pathway

- Sold B2B, to entities IFSCA already regulates — not to retail.
- TradeGuard produces a recommendation; the licensed officer decides. No verdict clears a case on its own — `requires_human_review` fires by construction above a risk threshold.
- Every AI verdict and human decision is logged with a timestamp.
- Path to market runs through the IFSCA regulatory sandbox — decision-support software sold to a regulated bank doesn't itself require a new license.
- Relevant regulators: IFSCA, RBI, FIU-IND.

---

## 💼 Business Model

| Item | Figure |
|---|---|
| Target customer | Head of Trade Finance Operations, GIFT City IBU |
| Manual process today | 2–4 hours per LC case |
| Addressable market | ~50 IBUs in the GIFT City cluster |
| Revenue model | Per-case processing fee, or an annual license per trade-finance desk |

> The specific per-check cost, savings, and ROI figures ($180/check, $12/check, $500/month, 72x ROI, $50B+ market size, 40% YoY growth) that appeared in earlier drafts of this document are not figures I've independently verified or sourced during this build — they read as illustrative rather than benchmarked. If you have a real citation for them (a GIFT City fee schedule, a market report), they belong here with that source; otherwise I'd recommend keeping the business case to the numbers above, which are things I can actually stand behind.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| AI | Amazon Bedrock (Claude 3.7 Sonnet) |
| Database | PostgreSQL + Prisma ORM |
| Audit trail | Amazon DynamoDB (with in-memory fallback) |
| Auth | Clerk (`@clerk/nextjs`), with a `ALLOW_PROTOTYPE_USER` local/demo bypass |
| Real-time | Pusher (optional; polling fallback when not configured) |
| Deploy | Docker + AWS EC2 (ap-south-1), nginx |
| Regime detection | Separate Python FastAPI + hmmlearn (Gaussian HMM) microservice |

---

## 👥 Team

- Pranshu Rastogi
- Satyam Mishra
- Vikash Kushwaha

---

## 🏆 Hackathon

Built for the **GIFT IFIH Young Builders Program**
Track 1 — Agentic AI in Financial Services
Focus: Cross-Border Trade Finance & LC Compliance

---

## 🔗 Links

| Resource | URL |
|---|---|
| Live Demo | http://13.201.85.22/ |
| GitHub | https://github.com/its-vikash-Kushwaha/TradeGaurdAi |
