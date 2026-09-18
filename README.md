# ScholarConnect Nigeria (ResearchConnect NG) 🎓🇳🇬

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

**ScholarConnect Nigeria** is an AI-powered academic survey and research recruitment platform tailored specifically for tertiary institutions across Nigeria. It connects student and faculty researchers with verified campus respondents, featuring intelligent conversational surveying, institutional identity verification, dual incentive models (Naira escrow & peer karma credits), and automated research paper synthesis powered by Google Gemini AI.

---

## 🌟 Key Features

### 1. 🤖 Conversational AI Surveyor ("Ada")
- **Dynamic Adaptive Interviewing**: Participants can complete surveys through a natural, chat-driven interface with "Ada", an AI interviewer powered by Google Gemini.
- **Smart Follow-Ups & Clarification**: Probes vague or superficial answers in real time to capture deeper qualitative reflections without rigid static forms.
- **AI Quality Audit & Anti-Spam**: Automatically reviews responses for relevance, depth, and authenticity before unlocking participant incentives.

### 2. 🏛️ Nigerian University Identity & Institution Verification
- **Broad Institution Support**: Pre-configured verification for federal, state, and private tertiary institutions across Nigeria (e.g., UNILAG, UI, OAU, ABU, FUTO, LASU, UNN, Covenant, and more).
- **ID & Student Email Verification**: Supports official `.edu.ng` institutional emails and student ID card uploads.
- **Demographic & Campus Eligibility Gating**: Guarantees that only targeted student demographics (university, department, level, gender) can view and participate in specialized studies.

### 3. 📝 AI Survey Architect & Visual Form Builder
- **Natural Language Survey Generation**: Describe a research topic or methodology, and the Gemini AI Survey Architect drafts comprehensive questions, answer options, and estimated completion times.
- **Flexible Question Types**: Multiple choice, checkboxes, short answer, open-ended essay, dropdowns, Likert scales, and document uploads.
- **One-Click Publishing**: Instant distribution across student networks with demographic targeting rules.

### 4. 💰 Dual Funding Economy: Cash Escrow & Peer Karma Exchange
- **Cash Escrow (₦ Naira)**: Researchers can fund a cash incentive pool (e.g., ₦500 – ₦2,500 per respondent) held in escrow and distributed immediately upon submission validation.
- **Peer Karma Credits (Free Tier)**: Students without research budgets can participate in peers' surveys to earn research credits, which can then be redeemed to recruit respondents for their own final year projects or dissertations.

### 5. 📊 Real-Time Analytics & Academic Synthesis Hub
- **Executive Survey Insights**: Instant breakdown of key qualitative themes, sentiment analysis, and demographic distributions with interactive Recharts charts.
- **Automated Academic Paper Drafting**: Generates publication-ready research sections (Abstract, Methodology, Key Findings, Discussion, Limitations, and Policy Recommendations).
- **Audio Overview Generation**: Synthesizes podcast-style discussion scripts and conversational audio summaries of research findings.
- **Multi-Format Export**: Export raw survey responses, synthesized reports, and data visualizations to PDF, Word, and CSV.

### 6. 🔐 Student Security & Password Strength Protection
- **Real-Time Password Strength Meter**: Interactive visual scoring (length, casing, numbers, symbols) on signup to ensure student and researcher account security.
- **Privacy & Anonymity**: Encrypted response data prevents unauthorized intrusion and protects respondent anonymity.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React Icons](https://lucide.dev/)
- **State Management & Querying**: [TanStack React Query](https://tanstack.com/query/latest)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Artificial Intelligence**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai) (Gemini 2.5 / Flash models)
- **Backend & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth) with resilient offline demo fallbacks

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Overwatch886/research-connect-ng.git
   cd research-connect-ng
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Google Gemini AI Key (supports VITE_GEMINI_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here

   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

   > **Note on Gemini API Keys**: You can also set `GEMINI_API_KEY` as a system environment variable or enter it directly via the interactive Gemini AI Key modal in the web app UI. Keys are securely stored in your local browser session.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📁 Project Structure

```
research-connect-ng/
├── src/
│   ├── components/            # Reusable UI components & modals
│   │   ├── ui/                # shadcn/ui components (Buttons, Dialogs, Cards, etc.)
│   │   ├── AiInsightsModal.tsx           # Academic paper, executive summary & audio export
│   │   ├── AiSurveyArchitectModal.tsx    # Natural-language survey generator
│   │   ├── ConversationalSurveyor.tsx    # "Ada" interactive AI interviewer
│   │   ├── GeminiKeyModal.tsx            # API key status badge & configuration modal
│   │   ├── Navbar.tsx                    # Global navigation with role switching
│   │   └── ProtectedRoute.tsx            # Authentication route guards
│   ├── hooks/                 # Custom React hooks (useAuth, useToast, etc.)
│   ├── integrations/          # Supabase client & auto-generated schemas
│   ├── lib/                   # Utility helpers & Gemini AI SDK client
│   │   ├── gemini.ts          # AI survey architect, conversational interviewer & papers
│   │   └── utils.ts           # Classnames, formatting, date helpers
│   ├── pages/                 # Top-level view routes
│   │   ├── Index.tsx          # Landing page with hero, features & pricing
│   │   ├── Dashboard.tsx      # Researcher management dashboard & escrow tracker
│   │   ├── CreateSurvey.tsx   # Visual survey builder & escrow authorization
│   │   ├── TakeSurvey.tsx     # Student survey completion (Standard or Conversational)
│   │   ├── ParticipantDashboard.tsx # Student opportunities, karma balance & payouts
│   │   ├── VerifyStudent.tsx  # Nigerian tertiary institution & ID verification
│   │   ├── Pricing.tsx        # Escrow fees & peer credit economy breakdown
│   │   └── Signup.tsx / Login.tsx # Auth with real-time password strength meter
│   ├── App.tsx                # App root with query client, router & toast providers
│   └── main.tsx               # Application entry point
├── public/                    # Static assets & icons
├── vite.config.ts             # Vite build configuration with envPrefix & definitions
└── package.json               # Dependencies and build scripts
```

---

## 🧪 Available Scripts

- `npm run dev`: Starts the local Vite development server with HMR.
- `npm run build`: Type-checks and bundles the application for production.
- `npm run preview`: Locally previews the production build output.
- `npm run lint`: Runs ESLint to check for code quality and syntax issues.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
