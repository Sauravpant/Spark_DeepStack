# VyaparAI 🎙️

**"From recording transactions to predicting business outcomes."**

A voice-first AI copilot helping Nepalese kirana (retail) store owners make smarter credit and inventory decisions — instantly, in Nepali, by voice.

Built by **Team DeepStack** for the **Spark_DeepStack** hackathon.

|                  |                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project Name** | VyaparAI                                                                                                                                                                               |
| **Team**         | DeepStack                                                                                                                                                                          |
| **Track**        | AI and Smart Automation |
| **Repository**   | [Spark_DeepStack](https://github.com/Sauravpant/Spark_DeepStack)                                                                                                                       |
| **Department**   | Computer Engineering                                                                                                                                                                   |

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Key Features](#key-features)
- [How It's Different](#how-its-different)
- [System Pipeline](#system-pipeline)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
  - [Option A: Docker (recommended)](#option-a-docker-recommended)
  - [Option B: Manual / local setup](#option-b-manual--local-setup)
- [Third-Party Components](#third-party-components)
- [AI Usage Disclosure](#ai-usage-disclosure)
- [Known Limitations](#known-limitations)
- [MVP Scope](#mvp-scope)
- [Business Model](#business-model)
- [Market Opportunity](#market-opportunity)
- [Roadmap](#roadmap)
- [Team](#team)
- [Sources & References](#sources--references)
- [License](#license)

---

## Problem

Nepal's retail economy runs on trust that nobody measures.

Wholesale and retail trade is Nepal's second-largest GDP-contributing sector, and kirana stores make up nearly 90% of that retail sector. Yet most of these shops still run on paper _bahi khata_ (ledgers) and memory, with no data-driven decision-making behind the two choices that determine whether they stay profitable:

- **Credit blind spot** — Shopkeepers extend _उधार_ (credit) to regular customers as a matter of survival; refusing it means losing the customer next door. But there's no way to know in advance which customers reliably repay and which quietly accumulate debt until they disappear. That blind spot translates into real, unrecovered money every month.
- **Inventory blind spot** — Owners reorder by memory and gut feeling, running short on fast-movers during demand spikes while slow-movers expire unsold on the shelf.
- **Existing tools don't help** — Digital _khata_ apps only digitize the ledger faster; they never answer the two questions that actually cost a shopkeeper money: _who won't pay_, and _what won't sell_.

## Solution

VyaparAI addresses both blind spots with a single voice-first platform — not another tap-and-type ledger app. Shopkeepers speak their transactions in Nepali, receive a spoken daily business summary, and get AI-driven guidance on credit and inventory, bringing the same intelligence large FMCG distributors already use down to the kirana counter.

| Traditional Records                        | VyaparAI Predicts                               |
| ------------------------------------------ | ----------------------------------------------- |
| "What happened?" (reactive digital ledger) | "What will happen next?" (proactive automation) |

AI is core to the solution, not decorative: remove the credit-risk model and the forecasting pipeline, and VyaparAI collapses back into just another digital ledger. Both outputs are things a rule-based app cannot produce.

## Key Features

- 🗣️ **Nepali Voice Transaction Entry** — The shopkeeper speaks a sale (e.g. _"कोक पााँच वटा बेच्यो"_); the system transcribes it, identifies the product and quantity, updates inventory, and confirms back via Nepali text-to-speech.
- 📊 **AI Credit Risk Scoring** — A trained credit-risk pipeline scores customers on repayment likelihood using transaction and payment-history features, flags high-risk accounts, and recommends a credit limit instead of just a running balance.
- 📦 **Demand Forecasting** — A forecasting pipeline predicts shop-level product demand from sales history, seasonality, and Nepal's festival calendar, driving low-stock and reorder alerts.
- 🔊 **AI Daily Voice Business Summary** — An end-of-day spoken recap covering total sales, top and bottom sellers, remaining stock, cash-vs-credit split, and total _उधार_ exposure.

## How It's Different

| Evaluation Criterion | Existing Ledger Apps                     | VyaparAI Decision Engine                         |
| -------------------- | ---------------------------------------- | ------------------------------------------------ |
| Primary Utility      | Static bookkeeping (manual data writing) | Predictive outcomes (calculates future metrics)  |
| Analysis Mode        | Retroactive — "What happened?"           | Proactive forecasts — "What to do?"              |
| Credit Assessment    | Basic transaction listing                | AI credit risk classification                    |
| Language Barrier     | Requires manual typing & text fields     | Conversational Nepali audio parsing              |
| Local Adaptation     | Standard global ledger systems           | Customized for traditional Nepali khata patterns |

## System Pipeline

**From voice input to core intelligence:**

1. **Voice Input** — Shopkeeper speaks a transaction in Nepali
2. **STT Parser** — Real-time Nepali speech-to-ledger conversion
3. **Ledger DB** — Parsed transaction synced to PostgreSQL
4. **ML Models** — Credit-risk classifier + demand forecaster (festival-calendar aware)
5. **Prediction** — Risk scores, credit limits, and reorder alerts generated
6. **Audio Brief** — Daily spoken summary generated via ElevenLabs / Edge-TTS

## Tech Stack

| Layer            | Technology                                                                              |
| ---------------- | --------------------------------------------------------------------------------------- |
| Frontend         | TypeScript, React, Vite, Tailwind CSS                                                    |
| Backend          | FastAPI (Python)                                                                        |
| Database         | PostgreSQL (Neon-hosted)                                                                 |
| Speech-to-Text   | ElevenLabs Speech-to-Text (Nepali)                                                      |
| Text-to-Speech   | Edge-TTS                                                                                |
| AI / LLM Layer   | Gemini API (function-calling assistant), with Groq / OpenRouter as fallback providers   |
| Machine Learning | CatBoost / XGBoost / LightGBM for demand forecasting and credit-risk scoring; SHAP for explainability |
| Containerization | Docker, Docker Compose, nginx                                                            |

---

## Project Structure

```
Spark_DeepStack/
├── docker-compose.yml
├── frontend/                      # React + TypeScript + Vite dashboard
│   ├── Dockerfile
│   ├── nginx.conf                 # SPA routing + /api/v1 reverse proxy
│   ├── .dockerignore
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── pages/                 # Dashboard, Transactions, CreditRisk, DemandForecast, VyaparVoice, ...
│       ├── components/            # ui/, voice/
│       ├── layouts/               # AuthLayout, MainLayout
│       ├── providers/             # AuthProvider
│       ├── routes/                # route definitions
│       ├── services/              # API service clients (auth, ml, voice, transaction, ...)
│       ├── hooks/                 # useAuth, useDashboard, useML, ...
│       ├── lib/                   # api client, query client, utils
│       ├── types/                 # shared TS types
│       ├── constants/, utils/, mocks/, assets/
│
└── backend/                       # FastAPI + ML service
    ├── Dockerfile
    ├── .dockerignore
    ├── requirements.txt
    ├── alembic.ini
    ├── app/
    │   ├── main.py                 # FastAPI entrypoint
    │   ├── seed.py
    │   ├── api/                    # auth, shops, customers, products, categories,
    │   │                           # transactions, dashboard, credit_risk, demand_forecast, voice
    │   ├── core/                   # config, security, dependencies, ml_manager
    │   ├── db/                     # database session/engine
    │   ├── models/                 # SQLAlchemy models (user, shop, customer, product, transaction, ...)
    │   ├── schemas/                 # Pydantic schemas
    │   ├── services/                # business logic per domain
    │   ├── alembic/                 # migrations
    │   └── utils/
    ├── tests/
    └── ml/
        ├── credit_risk/
        │   ├── train.py
        │   ├── src/                 # preprocessing, trainer, predictor, explainability, evaluator
        │   ├── inference/           # predict.py, predict_probability.py, explain_prediction.py
        │   ├── models/               # credit_risk_pipeline.joblib  ← loaded at runtime
        │   ├── artifacts/            # metrics, feature importance, SHAP values (reports)
        │   ├── data/{raw,processed}  # training data (not needed at runtime)
        │   └── notebooks/            # EDA notebooks
        └── demand/
            ├── train.py
            ├── src/                  # feature_engineering, forecasting_engine, trainer, predictor
            ├── inference/            # predict_next_day.py, predict_next_7_days.py, explain_*.py
            ├── models/               # forecasting_pipeline.joblib  ← loaded at runtime
            ├── artifacts/
            ├── data/{raw,processed}
            ├── notebooks/
```

> Only `ml/*/models/*.joblib` are required for the backend to serve predictions at runtime — `data/`, `notebooks/`, and `artifacts/` are training-time/reporting artifacts and are excluded from the Docker image (see `backend/.dockerignore`).

---

## Setup

### Option A: Docker (recommended)

This spins up the frontend (built and served via nginx) and the backend (FastAPI + ML) together. The database is a managed PostgreSQL instance (Neon), so no local DB container is required.

**Prerequisites:** Docker and Docker Compose installed.

1. Clone the repository:

   ```bash
   git clone https://github.com/Sauravpant/Spark_DeepStack.git
   cd Spark_DeepStack
   ```

2. Configure environment variables — create `backend/.env`:

   ```env
   DATABASE_URL=postgresql://user:password@host/dbname
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

   `backend/.env` is read by Docker Compose via `env_file` — it's git-ignored and never baked into the image.

3. Build and start both services:

   ```bash
   docker compose up --build
   ```

4. Access the app:

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000) (proxied from the frontend at `/api/v1`)
   - API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

5. Run database migrations (one-off, inside the running backend container):

   ```bash
   docker compose exec backend alembic upgrade head
   ```

6. Stop everything:

   ```bash
   docker compose down
   ```

To rebuild just one service after code changes: `docker compose up --build backend` or `docker compose up --build frontend`.

### Option B: Manual / local setup

> Useful for active development with hot-reload, without rebuilding containers each time.

**Prerequisites**

- Node.js 18+ and npm
- Python 3.13+
- Access to a PostgreSQL database (local or hosted, e.g. Neon)
- API keys for: Gemini API, ElevenLabs, Groq, OpenRouter (fallback only needs whichever providers you enable)

**1. Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (same variables as in the Docker section above).

Apply migrations and run the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Backend API available at `http://localhost:8000`.

**2. Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Run the dev server:

```bash
npm run dev
```

Frontend available at `http://localhost:5173` (Vite default).

**3. Train / load ML models**

The credit-risk classifier and demand forecaster (under `backend/ml/credit_risk` and `backend/ml/demand`) expect historical transaction data before they produce meaningful scores. Pretrained pipelines are already included as `.joblib` files under each `models/` folder; to retrain, use `train.py` in the respective `ml/<model>/` directory with your own dataset under `data/raw/`.

---

## Third-Party Components

All external APIs, libraries, and services this project depends on, and what they're used for:

| Component                                | Type                             | Provider                                           | Used For                                                                                                                          | Notes                                                                                                            |
| ---------------------------------------- | --------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Gemini API**                           | Proprietary API                  | Google                                             | Core LLM layer — function-calling assistant that orchestrates voice parsing, intent recognition, and the daily summary generation | Requires API key; subject to Google's usage limits/pricing                                                       |
| **Groq API**                             | Proprietary API                  | Groq                                               | Fallback LLM inference provider if Gemini is unavailable or rate-limited                                                          | Optional — only needed if fallback is enabled                                                                    |
| **OpenRouter**                           | Proprietary API (aggregator)     | OpenRouter                                         | Secondary fallback routing layer to alternate LLM providers                                                                       | Optional — only needed if fallback is enabled                                                                    |
| **ElevenLabs Speech-to-Text**            | Proprietary API                  | ElevenLabs                                         | Converts spoken Nepali transactions into text                                                                                     | Requires API key; Nepali language support should be verified against ElevenLabs' current supported-language list |
| **Edge-TTS**                             | Open-source wrapper (unofficial) | Microsoft Edge TTS (via `edge-tts` Python package) | Converts text (daily summaries, confirmations) into spoken Nepali audio                                                           | Free, no official API key, but relies on an undocumented Microsoft endpoint — stability is not guaranteed        |
| **CatBoost / XGBoost / LightGBM**        | Open-source libraries            | Yandex / DMLC / Microsoft                          | Credit-risk classification model and demand-forecasting ensemble                                                                   | Apache 2.0 / MIT licenses                                                                                         |
| **SHAP**                                 | Open-source library              | Scott Lundberg et al.                              | Explainability for the credit-risk and demand models (why a prediction was made)                                                  | MIT license                                                                                                      |
| **FastAPI**                              | Open-source framework            | —                                                  | Backend API framework                                                                                                             | MIT license                                                                                                      |
| **PostgreSQL**                           | Open-source database             | PostgreSQL Global Development Group                | Primary data store for transactions, customers, and inventory                                                                     | PostgreSQL license                                                                                               |
| **React.js / TypeScript / Tailwind CSS** | Open-source libraries            | —                                                  | Frontend web dashboard                                                                                                            | MIT license                                                                                                      |
| **Docker / nginx**                       | Open-source tooling              | Docker Inc. / nginx                                | Containerized build & deployment; nginx serves the built frontend and reverse-proxies API calls                                   | Apache 2.0 / BSD-2-Clause                                                                                        |

**Before submission/deployment:** confirm current pricing tiers, rate limits, and Nepali-language support status for Gemini, ElevenLabs, Groq, and OpenRouter directly on their respective docs, since these can change independently of this README.

---

## AI Usage Disclosure

VyaparAI uses AI in two distinct ways, disclosed separately below:

### 1. AI as a core product feature (user-facing)

AI is not incidental to this project — it is the product. Specifically:

- **Gemini API** (with Groq/OpenRouter as fallback) powers the conversational, function-calling assistant that interprets spoken Nepali transactions and drives the daily voice summary.
- **CatBoost/XGBoost/LightGBM** models generate the credit-risk scores and recommended credit limits shown to shopkeepers.
- The **demand forecasting** pipeline generates the demand forecasts and reorder alerts.
- **SHAP** is used to make model decisions explainable rather than a black box.

All AI-generated outputs (risk scores, forecasts, transcriptions) are **decision-support recommendations**, not final, unreviewable decisions — shopkeepers retain full control over whether to extend credit or reorder stock.

### 2. AI tools used during development (build-time)

_TODO: fill in before submission if applicable._ If any part of this codebase, documentation, or presentation material was drafted or assisted by an AI coding tool (e.g. GitHub Copilot, ChatGPT, Claude, Gemini Code Assist), disclose it here per your hackathon's AI-usage policy, including roughly what was AI-assisted (e.g. "boilerplate FastAPI routes," "README drafting," "Docker setup," "unit test scaffolding") versus written by the team.

---

## Known Limitations

- **Cold-start problem** — Both the credit-risk classifier and demand forecaster need a meaningful history of transactions per shop/customer before predictions are reliable; brand-new shops or customers will initially get low-confidence or default scores.
- **Nepali speech recognition accuracy** — ElevenLabs STT performance on Nepali, especially regional dialects, code-switching (Nepali-English mixing), and noisy in-store environments (multiple speakers, background chatter), has not been rigorously benchmarked for this use case.
- **Pooled model, not personalized** — The ML pipeline currently uses a single pooled model with per-shop features rather than a bespoke model per store; this favors scalability over shop-specific nuance.
- **Third-party API dependency** — Core functionality (voice parsing, TTS, LLM orchestration) depends on external APIs (Gemini, ElevenLabs, Groq, OpenRouter). Downtime, rate limits, latency, or pricing changes on any of these directly affects the app; Edge-TTS in particular relies on an unofficial, undocumented endpoint.
- **Connectivity assumptions** — The current architecture assumes reasonably stable internet access for real-time STT/TTS and LLM calls; there is no offline mode, which may be a constraint in lower-connectivity areas of Nepal.
- **No formal financial/regulatory integration yet** — Credit-risk scores are informational only; there is no integration with formal banking or micro-lending systems in the current MVP (planned for a later roadmap phase).
- **Limited security/privacy hardening** — Transaction and credit-history data is sensitive; encryption at rest/in transit, access control, and data-retention policies have not yet been formally audited for this MVP.
- **Single-language voice support** — Voice input/output currently targets Nepali only; no support yet for other languages spoken in parts of Nepal.
- **No mobile-native app** — The dashboard is currently web-based only; there is no dedicated mobile app for shopkeepers.

---

## MVP Scope

- Real-time Nepali speech-to-ledger conversion pipeline
- Custom credit risk classifier for micro-credit profiling
- Time-series demand forecaster integrated with Nepal's festival dataset
- Web-based control dashboard for inventory management
- Instant daily audio insight briefings
- Dockerized deployment for frontend + backend

## Business Model

**B2B, tiered subscription model** targeting independent kirana shop owners and the small/mid-sized wholesalers who supply them.

| Tier               | Price          | Highlights                                                                                                                                                        |
| ------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Starter Lite**   | Rs. 0          | Free ledger tier forever — basic Nepali voice transactions, standard transaction logs, manual ledger backups                                                      |
| **VyaparAI Pro**   | Rs. 499/month  | The predictive system for growth — AI credit risk scores, festival-aware forecasting, daily smart business audio summaries, automated SMS repayment alerts        |
| **Enterprise Hub** | Custom Pricing | Wholesale distributor integrations — supply/demand heatmaps, optimized delivery route insights, deep margins analytics dashboard, direct credit-risk check access |

- **Scalability:** A pooled ML model with per-shop feature inputs rather than a bespoke model per store, so onboarding new retailers adds data rather than engineering overhead.
- **Sustainability:** Recurring, usage-linked subscription revenue from both sides of the supply chain (retailers and distributors), with the Enterprise tier providing a higher-margin path as adoption grows. Distributor-paid metrics also help subsidize free tiers for retailers, driving grass-roots adoption.

## Market Opportunity

- **90%+** of Nepal's retail sector is made up of traditional kirana outlets _(Source: UNCDF)_
- **450k+** kirana outlets across Nepal serve as the primary retail distribution channel _(Source: National Statistics Office)_
- **#1** — Wholesale/retail trade is Nepal's largest economic SME sector
- **14.1%** contribution to Nepal's GDP in FY 2025/26 _(Source: Nepal Rastra Bank / National Statistics Office)_

> "A massive retail economy exists. The intelligence layer is missing."

## Roadmap

- **Phase 1:** Launch the AI Assistant core app for regional pilot kirana stores
- **Phase 2:** Launch a Distributor Dashboard targeting supply chain logistics
- **Phase 3:** Launch a credit score verification API for regional micro-banks

**Expected impact:** reduced bad debt via real-time credit risk analysis, minimized stockouts via seasonal forecasting, a lower adoption barrier through Nepali voice commands, and unbanked stores transitioning into data-driven, financeable businesses.

## Team

**Team DeepStack** — Department of Computer Engineering

| Name              | Role               |
| ----------------- | ------------------ |
| Saurav Pant       | Backend & AI/ML    |
| Swastika Dhakal   | Frontend & Backend |
| Sushmita Bhandari | UI/UX Design       |

## Sources & References

- Nepal Rastra Bank (NRB) — SME Financial Integration Survey & Policy Guidelines
- UNCDF Report — Digitizing MSMEs: Traditional Kirana Outlets in Nepal
- National Statistics Office (NSO) — Nepal National Economic Census & Enterprise Datasets
- Samriddhi Foundation Studies — Informal Retail Market Regulations & Trade Friction

## License

This project was built for hackathon purposes.