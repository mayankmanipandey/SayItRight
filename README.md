<div align="center">

# ✨ Say It Right — AI Communication Coach

**"Help people say hard things in the right way."**

An AI-powered communication coach built with Next.js, React 19, TypeScript, Groq, and Prisma. Unlike generic text rewriters that blindly paste words, **Say It Right** teaches you *why* communication works, evaluates key interpersonal metrics, flags subtle passive-aggressive phrasing, and crafts multiple distinct tone alternatives.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Groq](https://img.shields.io/badge/AI_Engine-Groq_Cloud-orange?style=for-the-badge)](https://groq.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma_SQLite-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

</div>

---

## 🌟 Key Features

### 🌌 1. Cinematic Celestial Gateway
* **Interactive Celestial Welcome:** Multi-layered accretion disk rings, rotating starfield, and dynamic taglines upon login.
* **Instant Demo Profiles:** 1-click test accounts for **Alex (Student Demo)** and **Sarah (Workplace Demo)**, plus **Guest Mode** for frictionless access.

### 🧠 2. Deep Interpersonal Communication Coaching
* **6-Dimensional Metric Scoring:** Scores your draft across *Respect*, *Clarity*, *Professionalism*, *Warmth*, *Confidence*, and *Accountability* (0–100 scale).
* **Specific Issue Diagnosis:** Flags problematic phrases (e.g. passive-aggressive remarks, blame-shifting, or dismissive words) with clear explanations of *why it matters* and *how to fix it*.
* **Reusable Communication Lessons:** Every analysis distills a lifelong communication principle you can apply to future conversations.
* **4 Distinct Tone Alternatives:** Generates tailored variations including *Professional / Formal*, *Warm & Friendly*, *Confident & Direct*, and *Diplomatic & Softened*.

### 🎨 3. 6 Stunning Themes
* ☀️ **Clean Light:** Crisp executive white surface with slate and indigo accents.
* 🌙 **Obsidian Dark:** Deep slate and obsidian (`#0B0F19`) with soft indigo glows.
* 🌌 **Cosmic Galaxy:** Deep space purple nebula (`#070414`) with starlight accents.
* ⚡ **Cyberpunk Neon:** High-contrast carbon dark (`#040810`) with electric cyan (`#06B6D4`).
* 🌅 **Sunset Dusk:** Dusk twilight (`#130B14`) with coral (`#F43F5E`) and warm amber.
* 💖 **Velvet Rose (Love Mode):** Romantic blush velvet (`#14070F`) with rose and pink warmth.
* *Preferences are saved in `localStorage` and adapt seamlessly with zero contrast issues.*

### 💖 4. "Love Mode" for Relationships
* Special tone mode tuned for interpersonal vulnerability, romantic partners, and spouses.
* Replaces accusatory phrasing with emotionally vulnerable, constructive relationship building.

### ⚡ 5. Dual Output Choice Bar
* **✨ Full AI Coaching:** Complete breakdown with metric bars, flagged issues, strengths, and takeaways.
* **⚡ Quick Improved Only:** Streamlined view with 1-click copy buttons and instant tone tabs for immediate communication needs.

---

## 🏗 Architecture

```
Browser Client (React 19 / Next.js App Router)
   │
   ▼
Server Route (POST /api/analyze)
   │
   ├─► Server-Side Groq SDK (Llama / GPT-OSS Ultra-Fast Inference)
   ├─► (Optional Fallbacks) Google Gemini API / Google Cloud Vertex AI
   └─► Zod Structured Output Validation & Safety Checks
   │
   ▼
Client-Side Reactive UI (Zero API Keys Exposed to Browser)
```

---

## 🚀 Quick Start (Local Setup)

### 1. Clone Repository
```bash
git clone https://github.com/your-username/say-it-right.git
cd say-it-right
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Add your free Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys):
```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL="file:./dev.db"
```

### 4. Initialize Database
```bash
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Production Deployment

### Option A: Vercel (Recommended)
1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the environment variables:
   * `GROQ_API_KEY` = your Groq API key (`gsk_...`)
   * `AI_PROVIDER` = `groq`
   * `GROQ_MODEL` = `openai/gpt-oss-120b`
4. Click **Deploy**.

### Option B: Docker Container
The repository includes a production-ready, multi-stage [`Dockerfile`](./Dockerfile):
```bash
# Build Docker image
docker build -t say-it-right .

# Run container on port 8080
docker run -p 8080:8080 -e GROQ_API_KEY="your-groq-key" say-it-right
```

---

## 🔒 Security Best Practices

* **No Client Keys:** All AI API calls happen exclusively in Next.js Server Components / Route Handlers.
* **No `NEXT_PUBLIC_` Exposure:** Secret keys are never bundled into client JavaScript.
* **Strict Schema Validation:** All user inputs and AI outputs are validated using Zod schemas.
* **Protected Git Tracking:** Environment files, service accounts, and local databases are strictly excluded via `.gitignore`.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router & Turbopack)
* **Frontend:** React 19, Vanilla CSS Custom Properties (Theme Engine)
* **AI Provider:** Groq SDK (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`)
* **Validation:** Zod
* **Database & ORM:** SQLite with Prisma
* **Typography:** Inter & JetBrains Mono (Google Fonts)

---

## 📄 License

This project is licensed under the MIT License. Feel free to use and adapt it.
