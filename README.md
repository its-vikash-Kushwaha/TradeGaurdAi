
# TradeGuard AI 🛡️

> **An AI-native financial intelligence, behavioral risk, and compliance automation platform — purpose-built for GIFT City IBUs and cross-border trade finance.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-AWS%20EC2-orange)](http://13.201.85.22/)
[![AWS Bedrock](https://img.shields.io/badge/AI-AWS%20Bedrock%20Claude%203-blue)](https://aws.amazon.com/bedrock/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20%2B%20EC2-green)](https://docker.com/)

---

## 🚀 Live Demo

**✅ Deployed on AWS EC2 — Mumbai (ap-south-1)**

🔗 **[http://13.201.85.22/](http://13.201.85.22/)**

| Page | URL | Status |
|------|-----|--------|
| Dashboard | http://13.201.85.22/ | ✅ Live |
| Compliance Agent | http://13.201.85.22/compliance | ✅ Live |
| Multi-Agent Orchestrator | http://13.201.85.22/orchestrator | ✅ Live |
| Trading Journal | http://13.201.85.22/journal | ✅ Live |
| Market Intelligence | http://13.201.85.22/research | ✅ Live |

---

## 🎯 What Is TradeGuard AI?

TradeGuard AI solves a critical pain point at **GIFT City International Banking Units (IBUs)**:

> Manual LC compliance verification takes **4-6 hours per document**, costs **$180 per check**, and has a **12% error rate** on regulatory flags.

**TradeGuard AI reduces this to 4 minutes at $12 per check** using 6 specialized AI agents, human-in-the-loop oversight, and an immutable audit trail.

### The Three Pillars

┌──────────────────┬──────────────────┬──────────────────┐ │ MARKET │ BEHAVIORAL │ FINANCIAL │ │ INTELLIGENCE │ INTELLIGENCE │ OPERATIONS │ │ │ │ │ │ Multi-asset │ Trading journal │ LC/MT700 │ │ screening │ Pattern detect │ verification │ │ US/India/Crypto │ Emotional risk │ IFSCA/RBI rules │ │ Forex/Commodity │ Overtrading │ HITL approval │ │ Regulatory scan │ Behavioral score │ Audit trail │ └──────────────────┴──────────────────┴──────────────────┘

---

## 🏗️ Architecture

USER INPUT (Trade Document / Query) │ ▼ MULTI-AGENT ORCHESTRATOR POST /api/orchestrator │ ┌─────────┼─────────┐ ▼ ▼ ▼ Research Compliance Risk Agent Agent Engine │ │ │ ▼ ▼ ▼ Market Behavioral Synthesis Agent Agent Agent └─────────┼─────────┘ ▼ EVIDENCE + CONFIDENCE SCORE │ ┌─────────┴─────────┐ ▼ ▼ SCORE < 60 SCORE > 60 AUTO-APPROVE HITL TRIGGER │ │ │ Human Reviews │ Approve/Reject └─────────┬─────────┘ ▼ IMMUTABLE AUDIT TRAIL (DynamoDB ap-south-1)

### Agent Responsibilities

| Agent | Role | Output |
|-------|------|--------|
| **Research Agent** | Regulatory intelligence gathering | Key findings, risk factors, IFSCA context |
| **Compliance Agent** | IFSCA/RBI/FEMA rule checking | Verdict, risk level, compliance flags |
| **Risk Engine** | Weighted scoring (0-100) | Risk score, tier, HITL recommendation |
| **Behavioral Agent** | Officer pattern analysis | Approval bias, behavioral flags |
| **Market Agent** | Asset screening | Regulatory status, market regime |
| **Synthesis Agent** | Combined output | Final recommendation + evidence |

### Risk Scoring Formula

Risk Score (0-100) = Documentation Score × 25%

Counterparty Score × 30%
Regulatory Score × 25%
Transaction Score × 20%
Tiers: 0-30: CRITICAL → Block + escalate 31-60: HIGH → HITL required 61-80: MEDIUM → Flag for review 81-100: LOW → Auto-approve

---

## ✅ Features Built & Live

### 🤖 Multi-Agent Orchestrator
- 6 specialized agents firing in sequence
- Live progress UI (animated agent steps)
- 3 demo cases: LOW / MEDIUM / HIGH risk
- Final synthesis card with evidence
- HITL auto-triggers on HIGH risk

### ⚖️ Compliance Agent
- LC document intake (MT700 + BoL + Invoice)
- IFSCA/RBI/FEMA rule checking
- AML screening + sanctions check
- Risk verdict with confidence %
- Detailed findings list

### 📊 Risk Engine
- Weighted 0-100 scoring (4 factors)
- Visual risk gauge
- Factor breakdown cards
- Color-coded risk tiers
- HITL trigger logic

### 👤 Human-in-the-Loop (HITL)
- Auto-triggers on score > 60
- Approve / Reject / Escalate UI
- Reviewer notes field
- Decision logged to DynamoDB
- Immutable audit trail

### 🔬 Research Agent
- Financial intelligence gathering
- Regulatory context (IFSCA/RBI/FEMA)
- Evidence-backed findings
- Confidence scoring
- Smart fallback (never shows "unavailable")

### 📈 Market Intelligence Terminal
- Multi-market screening:
    - 🇺🇸 US Stocks (AAPL, NVDA, TSLA, META)
    - 🇮🇳 India NSE (RELIANCE, TCS, INFY, HDFCBANK)
    - ₿ Crypto (BTC, ETH, SOL, BNB)
    - 💱 Forex (EURUSD, GBPUSD, USDINR)
    - 🪙 Commodities (XAUUSD, XAGUSD, CL)
    - 🌏 Global (VOD.L, SAP.DE, ASML.AS)
- AI regulatory analysis per symbol
- Market regime detection
- Sanctions screening

### 📔 Trading Journal + Behavioral Analysis
- Full CRUD journal entries
- Pattern detection:
    - Overtrading (>5 trades/7 days)
    - Revenge trading (3+ consecutive losses)
    - Position size breaches (50%+ above avg)
- Emotional risk score (0-100)
- Win/loss ratio tracking
- Behavioral panel with pattern cards

### 🤝 AI Copilot Panel
- Context-aware AI assistant
- AWS Bedrock powered
- Smart fallback (no broken states)
- Confidence % per insight
- Agent attribution shown

### 🗄️ Audit Trail
- DynamoDB (AWS ap-south-1)
- Every agent invocation logged
- Every human decision recorded
- Immutable + timestamped
- Audit entry ID per case

---

## 🔌 API Reference

### GET /api/status
```bash
curl http://13.201.85.22/api/status
Returns: Bedrock status, DynamoDB status, region, features, timestamp

POST /api/research
curl -X POST http://13.201.85.22/api/research \
-H "Content-Type: application/json" \
-d '{
  "query": "LC compliance GIFT City IBU",
  "context": "MT700 Letter of Credit",
  "documentType": "LC"
}'
Returns: findings, risk_level, confidence, regulatory_flags, recommendation

POST /api/compliance
curl -X POST http://13.201.85.22/api/compliance \
-H "Content-Type: application/json" \
-d '{
  "caseId": "case_highrisk_001",
  "symbol": "LC-GIFT-HIGH-001",
  "documents": {
    "billOfLading": {...},
    "letterOfCredit": {...},
    "invoice": {...}
  }
}'
Returns: verdict, riskLevel, requiresHumanReview, findings

POST /api/compliance/{caseId}/approve
curl -X POST \
http://13.201.85.22/api/compliance/case_highrisk_001/approve \
-H "Content-Type: application/json" \
-d '{
  "decision": "APPROVE",
  "reviewer": "officer_001",
  "notes": "Verified manually"
}'
Returns: decision, audit_entry_id, timestamp

POST /api/orchestrator
curl -X POST http://13.201.85.22/api/orchestrator \
-H "Content-Type: application/json" \
-d '{
  "caseId": "case_highrisk_001",
  "symbol": "LC-GIFT-HIGH-001"
}'
Returns: agents_invoked, overall_risk, compliance_status, key_findings, recommendation, requires_human_review, confidence, audit_entry_id

🚀 Setup Instructions
Prerequisites
Node.js 18+
Docker + Docker Compose
AWS Account (for Bedrock + DynamoDB)
1. Clone Repository
git clone https://github.com/its-vikash-Kushwaha/TradeGaurdAi.git
cd TradeGaurdAi
2. Install Dependencies
npm install
3. Environment Setup
cp .env.local.example .env.local
Edit .env.local:

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tradeguard

# App
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
ALLOW_PROTOTYPE_USER=true
4. Start Database
docker-compose up -d tradeguard-db
5. Run Migrations
npx prisma db push
npx prisma db seed
6. Start Development Server
npm run dev
Open: http://localhost:3000

🐳 Production Deployment (Docker)
# Build and start all services
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Restart
docker-compose restart
📁 Project Structure
TradeGaurdAi/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Homepage
│   │   ├── compliance/           # Compliance dashboard
│   │   ├── orchestrator/         # Multi-agent orchestrator
│   │   ├── journal/              # Trading journal
│   │   └── research/             # Market intelligence
│   └── api/
│       ├── compliance/           # Compliance agent API
│       ├── orchestrator/         # Orchestrator API
│       ├── research/             # Research agent API
│       ├── journal/              # Journal API
│       └── status/               # System status API
├── components/
│   ├── AgentOrchestrator.tsx     # Orchestrator UI
│   ├── RiskEngine.tsx            # Risk gauge UI
│   ├── CopilotPanel.tsx          # AI sidebar
│   ├── journal/
│   │   └── BehavioralPanel.tsx   # Behavioral analysis
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── BottomNav.tsx
├── lib/
│   ├── ai/
│   │   ├── bedrock.ts            # AWS Bedrock client
│   │   ├── behavioral.ts         # Behavioral analysis
│   │   ├── complianceAgent.ts    # Compliance logic
│   │   ├── researchAgent.ts      # Research logic
│   │   └── riskEngine.ts         # Risk scoring
│   ├── data/
│   │   └── synthetic.ts          # Synthetic data
│   └── services/
│       └── complianceChecks.ts   # Compliance rules
├── prisma/
│   └── schema.prisma             # DB schema
├── docker-compose.yml
└── .env.local.example
⚠️ Synthetic Data Disclosure
This prototype uses synthetic data for demonstration purposes.

Component	Status	Production Requirement
Trade documents (BoL, MT700)	🔶 SYNTHETIC	Real SWIFT MT700 parser
SWIFT messages	🔶 SIMULATED	Live SWIFT API integration
IFSCA rules engine	🔶 SIMPLIFIED	Full regulatory database
Market prices	🔶 SYNTHETIC	Live market data feed
Agent logic	✅ REAL	Production-ready
AWS Bedrock AI	✅ REAL	Same in production
Risk scoring	✅ REAL	Production-ready
Audit trail	✅ REAL (DynamoDB)	Same in production
HITL workflow	✅ REAL	Production-ready
🗺️ Roadmap
Sprint 1 (Weeks 1-2)
□ Real SWIFT MT700 parser
□ Hosted PostgreSQL (AWS RDS)
□ Multi-tenant authentication
□ Load testing (100 concurrent)
Sprint 2 (Weeks 3-6)
□ Account Aggregator (AA) integration
□ Live market data feed
□ Verification Agent (cross-doc)
□ AI Memory / context persistence
Sprint 3 (Months 2-3)
□ FX Hedging Agent
□ Treasury workflow module
□ Multi-IBU SaaS platform
□ IFSCA sandbox application
Year 1
□ 10 GIFT City IBU pilots
□ Singapore IBU expansion
□ API licensing to vendors
□ $240k ARR target
🏛️ Regulatory Pathway
Primary Route: IFSCA FinTech Sandbox

Framework: IFSCA Sandbox 2022
Category: FinTech Innovation
Timeline: 3-6 months to sandbox entry
Requirement: 1 IBU pilot partner
Revenue Route: B2B Tool Positioning

Sell TO regulated IBUs (not direct license)
IBU holds IFSCA authorization
TradeGuard = compliance AI layer
Revenue from Day 1
Relevant Regulators:

IFSCA (primary — GIFT City)
RBI (FEMA, cross-border FX)
FIU-IND (AML/KYC)
SEBI (if securities added)
💰 Business Model
Metric	Value
Pricing	$500/month per compliance desk
Customer savings	$36,000/month → $500/month
ROI for customer	72x in month 1
Target Year 1	10 GIFT City IBUs
Target MRR Y1	$20,000
Target ARR Y1	$240,000
🛠️ Tech Stack
Layer	Technology
Frontend	Next.js 14, TypeScript, Tailwind CSS
AI/ML	AWS Bedrock (Claude 3 Sonnet)
Database	PostgreSQL + Prisma ORM
Audit Trail	Amazon DynamoDB
Deployment	Docker + AWS EC2 (ap-south-1)
Auth	NextAuth.js
State	React Hooks
🏆 Built For
GIFT IFIH Young Builders Program Hackathon

Track: Track 1 — Agentic AI in Financial Services
Focus: Cross-Border Trade Finance & LC Compliance
Built in: 22 hours
Deployed: AWS EC2 Mumbai (ap-south-1)
👥 Team
TradeGuard AI

Pranshu Rastogi
Satyam Mishra
Vikash Kushwaha
📄 License
MIT License — You own your IP.

🔗 Links
Resource	URL
🚀 Live Demo	http://13.201.85.22/
📦 GitHub	github.com/its-vikash-Kushwaha/TradeGaurdAi
📊 Compliance	http://13.201.85.22/compliance
🤖 Orchestrator	http://13.201.85.22/orchestrator
📔 Journal	http://13.201.85.22/journal
📈 Research	http://13.201.85.22/research
