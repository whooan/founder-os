# founderOS

**Founder & Company Intelligence Platform** — Track companies, founders, funding, and market signals in one place. AI-powered competitive intelligence with automated enrichment pipelines.

## Features

- **Company Profiles** — Add companies and automatically enrich them with web research, social media, and AI analysis
- **Founder Tracking** — Discover and track founders, executives, and key personnel
- **Event Timeline** — Funding rounds, product launches, partnerships, executive changes, and more
- **Competitive Comparison** — Side-by-side comparison with feature matrices, quadrant visualizations, and AI-powered chat
- **Market Intelligence** — Positioning analysis, GTM strategy assessment, and risk signals
- **Ask Intelligence** — Natural language Q&A over your entire intelligence database
- **Smart Suggestions** — AI-generated potential customers, product direction, and CEO briefings
- **Financial Dashboard** — Holded bank integration, burn rate analysis, runway scenarios, P&L charts with 3-year forecasting
- **Cap Table** — Full equity management with share classes, equity events, ownership evolution, and dilution tracking
- **VSOP / Stock Options** — Option pool management, grant tracking, vesting schedules with cliff support
- **Stakeholder CRM** — Manage founders, investors, angels, and employees with contact details
- **Legal Vault** — Store and track company legal documents (articles of incorporation, SHA, board minutes)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy (async), SQLite |
| AI | OpenAI GPT-4o / GPT-4.1 with structured outputs |
| Integrations | Holded (bank aggregation via API) |
| Charts | Recharts (bar charts, treemaps, composed charts) |
| Fonts | Inter (UI), Space Grotesk (logo) |

## Quick Start

### Option A: Docker (recommended)

```bash
git clone <your-repo-url>
cd founderos
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) and configure your OpenAI API key in **Settings**.

### Option B: Manual

#### Prerequisites

- Python 3.10+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [pnpm](https://pnpm.io/) (Node package manager)

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd founderos
```

#### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (or configure it in the Settings page later)

uv sync
PYTHONPATH=src uv run uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local

pnpm install
pnpm dev
```

#### 4. Open the app

Visit [http://localhost:3000](http://localhost:3000). You can configure your OpenAI API key in **Settings** or via the `.env` file.

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | `backend/.env` | OpenAI API key (or set via Settings page) |
| `DATABASE_URL` | `backend/.env` | SQLite URL (default: `sqlite+aiosqlite:///./founderos.db`) |
| `SECRET_KEY` | `backend/.env` | Encryption key for API key storage (auto-generated if empty) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend URL (default: `http://localhost:8000`) |
| `HOLDED_API_KEY` | `backend/.env` | Holded API key for bank sync (or set via Settings page) |

## Architecture

```
founderos/
├── backend/
│   ├── Dockerfile
│   └── src/app/
│       ├── api/            # FastAPI route handlers
│       ├── models/         # SQLAlchemy models
│       ├── schemas/        # Pydantic request/response schemas
│       ├── services/       # Business logic layer
│       ├── intelligence/   # AI pipelines & OpenAI integration
│       ├── config.py       # App configuration
│       ├── database.py     # Async DB engine & session
│       ├── encryption.py   # Fernet encryption for secrets
│       └── scheduler.py    # Daily auto-update scheduler
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/            # Next.js App Router pages
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # API client & utilities
│       └── types/          # TypeScript type definitions
├── docker-compose.yml
├── README.md
└── LICENSE
```

### AI Enrichment Pipelines

1. **Discovery** — Web research to extract company profile, founders, funding, and products
2. **Media Fingerprint** — Analyze public communications tone, channels, and audience
3. **Event Extraction** — Identify and classify business events from web sources
4. **Market Intelligence** — Synthesize positioning, GTM strategy, and competitive dynamics
5. **Cross-Check** — Validate data across all sources for confidence scoring

### Financial Dashboard

The finance module integrates with **Holded** as a bank aggregator to provide real-time financial visibility:

- **Bank Sync** — Pulls treasury accounts and bank movements from Holded API with progress tracking
- **KPI Cards** — Cash position, runway (worst/current/best/forecast scenarios), burn rates, monthly income
- **P&L Chart** — Income/expense bars with net line, time filters (3M/6M/12M/YTD/ALL), 3-year forecast projection with projected cash overlay
- **Burn Rate Analysis** — Rolling 3/6/12-month averages based on expenses only (zero income worst case)
- **Runway Scenarios** — Worst (zero income), current (burn minus income), best (12mo net avg), and user-configured forecast
- **AI Auto-Categorization** — OpenAI classifies bank transactions into startup expense categories (Payroll, SaaS, Marketing, Legal, etc.)
- **Expense Treemaps** — Visual treemap breakdown of expenses and income by category
- **Planned Expenses** — Track expected future expenses by quarter for budget planning
- **Forecast Settings** — Configure expected monthly burn and income to project runway and cash position

### Capital Management

Full cap table and equity management for startups:

- **Cap Table** — Share classes, equity events (founding, rounds, secondaries), ownership percentages, dilution tracking
- **Cap Table Evolution** — See how ownership changed across every equity event
- **Stakeholder Management** — CRM for founders, employees, angels, VCs with contact details, entity names, and LinkedIn
- **VSOP / Stock Options** — Option pool creation, individual grant tracking, 4-year vesting with cliff, vested/unvested calculations
- **Legal Document Vault** — Store articles of incorporation, shareholder agreements, board minutes, and other legal docs
- **Company Legal Info** — Registered name, CIF, address, notary details, registration numbers

## Roadmap

founderOS today covers competitive intelligence — but the vision is to become the **operating system for founders**. Every startup CEO navigates three domains: **Market**, **Product**, and **Capital**. The roadmap below extends founderOS into each.

We're actively building toward this. Contributions are very welcome — pick an item, open an issue, or propose your own.

### Market

> Understand your landscape, find customers, outmaneuver competitors.

- [x] Competitive intelligence pipelines (discovery, media fingerprint, events, market intel)
- [x] AI-powered company comparison with quadrant visualizations
- [x] Smart suggestions (potential customers, CEO briefings)
- [ ] **Market Signals & Alerts** — get notified when competitors raise, launch, hire, or pivot
- [ ] **Win/Loss Analysis** — track why deals were won or lost against specific competitors
- [ ] **TAM / SAM / SOM Estimation** — AI-assisted market sizing from industry data and competitor signals
- [ ] **Customer Pipeline** — lightweight CRM to track prospects from suggestion to close

### Product

> Ship better, measure what matters, stay focused.

- [x] Product feature extraction and competitive feature matrices
- [x] Ask Intelligence (natural language Q&A over your data)
- [ ] **Product KPI Tracking** — activation, retention, churn, NPS, and custom metrics over time
- [ ] **OKR & Goal Tracker** — quarterly objectives linked to KPIs with progress tracking
- [ ] **Changelog Generator** — auto-summarize releases into a public changelog
- [ ] **Roadmap Board** — visual roadmap tied to competitive gaps and customer feedback

### Capital

> Manage your money, ownership, and investor relationships.

- [x] **Financial Dashboard** — runway, burn rates, expense breakdown by category, Holded bank integration
- [x] **Cap Table** — share classes, equity events, ownership evolution, dilution tracking
- [x] **Equity & Stock Options** — VSOP pool management, grant schedules, vesting cliffs, vested/unvested tracking
- [x] **Stakeholder Management** — founders, investors, employees CRM with contact details
- [x] **Legal Document Vault** — articles of incorporation, SHA, board minutes, company legal info
- [x] **Expense Forecasting** — planned quarterly expenses, burn/income forecast, 3-year runway projections
- [ ] **Investor Report Generator** — one-click monthly narrative from your KPIs and milestones, PDF export
- [ ] **Headcount & Costs** — FTE tracker, department breakdown, cost per hire, salary bands
- [ ] **Fundraising Pipeline** — track investors, meetings, term sheets, and follow-ups
- [ ] **Scenario Modeling** — what-if analysis for different burn rates, runway projections, and dilution scenarios

---

If any of these resonate, we'd love your help. See [Contributing](#contributing) below.

## Contributing

founderOS is open source and built for founders, by founders. Whether it's a bug fix, a new pipeline, or one of the roadmap items above — contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Not sure where to start? Look for issues labeled `good first issue` or pick a roadmap item and open an issue to discuss your approach.

## License

MIT License — see [LICENSE](LICENSE) for details.
