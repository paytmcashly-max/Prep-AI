import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileSearch,
  Mail,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Video
} from "lucide-react";

const APK_DOWNLOAD_URL =
  "https://github.com/paytmcashly-max/Prep-AI/releases/download/v1.0.0-public-beta/intervueai-public-beta-v1.0.0-google-auth-fixed.apk";

const valuePillars = [
  {
    title: "Interview practice",
    description:
      "Run focused HR, technical, and behavioral sessions without switching between notes, prompts, and trackers.",
    icon: BrainCircuit
  },
  {
    title: "Resume ATS review",
    description:
      "Spot missing keywords, weak sections, and role-fit gaps before your resume gets screened out.",
    icon: FileSearch
  },
  {
    title: "Progress visibility",
    description:
      "Keep recent scores, saved checks, and practice momentum in one mobile-first workflow.",
    icon: BarChart3
  }
];

const workflowSteps = [
  {
    title: "Practice targeted rounds",
    description: "Pick the interview type you want to sharpen and answer with structure instead of guesswork.",
    icon: Target
  },
  {
    title: "Review what needs work",
    description: "Get answer-level feedback, ATS notes, and clear next steps after each session.",
    icon: Sparkles
  },
  {
    title: "Unlock premium only after verification",
    description: "Payments are verified by the backend before premium access becomes active on the account.",
    icon: ShieldCheck
  }
];

const betaChecklist = [
  "Text interview practice with AI feedback",
  "Resume ATS analysis with saved result history",
  "Email auth, Google auth, and premium verification flow",
  "Android APK for real-device beta testing"
];

const premiumPlans = [
  {
    name: "Monthly Premium",
    price: "INR 99",
    cadence: "/month",
    label: "Flexible",
    description: "For shorter interview-prep cycles and active job searches.",
    features: ["Unlimited mock practice", "More resume scans", "Longer prep sessions", "Priority premium access"]
  },
  {
    name: "Yearly Premium",
    price: "INR 799",
    cadence: "/year",
    label: "Best value",
    description: "For longer preparation windows and steady improvement over time.",
    features: [
      "Everything in Monthly Premium",
      "Lower long-term cost",
      "More consistent progress history",
      "Better value for repeat practice"
    ],
    featured: true
  }
];

const roadmapCards = [
  {
    title: "Voice Mock Interview",
    tag: "Planned for v1.2",
    description:
      "Practice by speaking naturally, review the transcript, and get AI feedback after transcription. Currently in private testing.",
    icon: Mic
  },
  {
    title: "AI Interviewer Readout",
    tag: "Planned for v1.2+",
    description:
      "Hear interview questions spoken aloud for a more realistic flow once voice-answer testing is stable.",
    icon: Sparkles
  },
  {
    title: "Video Interview Mode",
    tag: "Future roadmap",
    description:
      "A richer session format with stronger communication coaching after device quality and reliability checks are complete.",
    icon: Video
  }
];

export default function Home() {
  return (
    <main className="page-shell">
      <nav className="nav" aria-label="Primary navigation">
        <div className="container nav-inner">
          <a className="brand" href="#top" aria-label="IntervueAI home">
            <span className="brand-mark">IA</span>
            <span>IntervueAI</span>
          </a>

          <div className="nav-links" aria-label="Page sections">
            <a href="#product">Product</a>
            <a href="#workflow">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#beta">Beta</a>
            <a href="#roadmap">Roadmap</a>
          </div>

          <a className="button" href={APK_DOWNLOAD_URL}>
            <Download size={18} />
            Download APK
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-orb hero-orb-a" aria-hidden="true" />
        <div className="hero-orb hero-orb-b" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-stack">
            <span className="eyebrow">
              <Sparkles size={16} />
              Android public beta
            </span>

            <h1>IntervueAI</h1>

            <p className="hero-copy hero-copy-strong">
              Structured interview practice, resume review, and verified premium access in one focused mobile workflow.
            </p>

            <p className="hero-copy">
              Built for job seekers who want repeatable prep, clearer feedback, and a cleaner path from resume improvements to interview confidence.
            </p>

            <div className="hero-actions">
              <a className="button" href={APK_DOWNLOAD_URL}>
                <Download size={18} />
                Download Android APK
              </a>
              <a className="button secondary" href="#product">
                Explore product
              </a>
            </div>

            <div className="trust-row" aria-label="Beta highlights">
              <span className="trust-pill">
                <CheckCircle2 size={15} />
                Voice stays private-testing only
              </span>
              <span className="trust-pill">
                <ShieldCheck size={15} />
                Premium unlocks after backend verification
              </span>
            </div>

            <div className="proof-row" aria-label="Product highlights">
              <div className="proof-card">
                <strong>Practice</strong>
                <span>Run repeatable sessions that feel more deliberate than generic prep notes.</span>
              </div>
              <div className="proof-card">
                <strong>Improve</strong>
                <span>See what to fix next instead of guessing why an answer felt weak.</span>
              </div>
              <div className="proof-card">
                <strong>Convert</strong>
                <span>Use resume review and mock practice together before the real interview happens.</span>
              </div>
            </div>
          </div>

          <div className="hero-stage" aria-label="IntervueAI workspace preview">
            <div className="hero-badge hero-badge-top">
              <CheckCircle2 size={16} />
              Beta build ready
            </div>

            <div className="hero-panel">
              <div className="workspace-header">
                <div>
                  <p className="workspace-label">Candidate workspace</p>
                  <h3>Interview prep in one app</h3>
                </div>
                <span className="timer-pill">
                  <ShieldCheck size={14} />
                  Verified flow
                </span>
              </div>

              <div className="signal-grid">
                <div className="signal-card signal-card-primary">
                  <span>Latest interview score</span>
                  <strong>82/100</strong>
                  <p>Clear structure. Better closing needed.</p>
                </div>
                <div className="signal-card">
                  <span>Resume readiness</span>
                  <strong>ATS review saved</strong>
                  <p>Missing keywords and section edits highlighted.</p>
                </div>
              </div>

              <div className="workspace-list">
                {valuePillars.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div className="workspace-item" key={item.title}>
                      <div className="icon-bubble compact">
                        <Icon size={18} />
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="workspace-footer">
                <div className="workspace-pill">
                  <Download size={16} />
                  <span>APK attached to public beta</span>
                </div>
                <div className="workspace-pill">
                  <CreditCard size={16} />
                  <span>Razorpay + backend verification</span>
                </div>
              </div>
            </div>

            <div className="hero-badge hero-badge-bottom">
              <BarChart3 size={16} />
              Progress, auth, and payment flows included
            </div>
          </div>
        </div>
      </section>

      <section className="section compact" id="product">
        <div className="container">
          <div className="section-heading center">
            <h2>A tighter product flow for interview preparation.</h2>
            <p>
              IntervueAI keeps the prep loop simple: practice, review, improve, and come back with better answers and a stronger resume.
            </p>
          </div>

          <div className="grid features-grid">
            {valuePillars.map((item) => {
              const Icon = item.icon;

              return (
                <article className="card card-hover" key={item.title}>
                  <div className="icon-bubble">
                    <Icon size={22} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section compact" id="workflow">
        <div className="container">
          <div className="section-heading center">
            <h2>How the workflow fits together.</h2>
            <p>
              The app is designed to feel operational, not noisy: focused sessions, clearer review, and verified premium access when needed.
            </p>
          </div>

          <div className="grid process-grid">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article className="card card-hover process-card" key={step.title}>
                  <div className="process-index">0{index + 1}</div>
                  <div className="icon-bubble">
                    <Icon size={22} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section compact" id="pricing">
        <div className="container">
          <div className="section-heading center">
            <h2>Simple premium pricing.</h2>
            <p>
              Premium is for users who want more sessions and more resume analysis. The product promise stays clear: no hidden unlocks, no client-side payment shortcuts.
            </p>
          </div>

          <div className="grid pricing-grid">
            {premiumPlans.map((plan) => (
              <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
                <span className="tag">{plan.label}</span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="price">
                  {plan.price}
                  <span>{plan.cadence}</span>
                </div>
                <ul className="check-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="billing-note">
                  Payment runs through Razorpay. Premium access becomes active only after backend verification succeeds.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section compact" id="beta">
        <div className="container">
          <div className="beta-strip">
            <div className="beta-copy">
              <span className="eyebrow">
                <Download size={16} />
                Current beta scope
              </span>
              <h2>Install the latest Android beta build.</h2>
              <p>
                This release is meant for real-device testing of the core product: interview practice, resume analysis, authentication, and premium verification.
              </p>

              <ul className="check-list compact">
                {betaChecklist.map((item) => (
                  <li key={item}>
                    <Check size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="beta-actions">
              <div className="beta-panel-glow" aria-hidden="true" />
              <a className="button button-wide" href={APK_DOWNLOAD_URL}>
                <Download size={18} />
                Download Beta APK
              </a>
              <div className="meta-stack">
                <p className="beta-meta">
                  Android package
                  <strong>com.prepai.prepai</strong>
                </p>
                <p className="beta-meta">
                  Distribution
                  <strong>GitHub Release asset</strong>
                </p>
              </div>
              <a className="inline-link" href="#roadmap">
                See what is coming next
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section compact" id="roadmap">
        <div className="container">
          <div className="section-heading center">
            <h2>Upcoming features.</h2>
            <p>
              These are staged deliberately. They are not part of the current public beta until device quality, reliability, and cost checks are complete.
            </p>
          </div>

          <div className="grid use-case-grid">
            {roadmapCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="card card-hover" key={feature.title}>
                  <div className="icon-bubble">
                    <Icon size={22} />
                  </div>
                  <div className="roadmap-tag">{feature.tag}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container">
          <div className="contact-card">
            <div>
              <span className="eyebrow">
                <Mail size={16} />
                Contact
              </span>
              <h2>Need help with beta access, payment, or account issues?</h2>
              <p>
                Reach out for support with installation, verification links, premium payments, or account access. We use this inbox for active user support.
              </p>
            </div>
            <a className="support-status" href="mailto:kishan@kishan.codes">
              <Mail size={20} />
              kishan@kishan.codes
            </a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <a className="brand" href="#top">
              <span className="brand-mark">IA</span>
              <span>IntervueAI</span>
            </a>
            <p>Practice smarter. Interview better.</p>
          </div>

          <div className="footer-links">
            <a href="#product">Product</a>
            <a href="#workflow">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refund">Refund Policy</a>
            <a href="/delivery">Digital Delivery</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
