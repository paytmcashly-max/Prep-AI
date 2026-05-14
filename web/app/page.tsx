import {
  BarChart3,
  BrainCircuit,
  Check,
  CreditCard,
  Download,
  FileText,
  Mail,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TimerReset
} from "lucide-react";

const APK_DOWNLOAD_URL = "/downloads/intervueai-public-beta-v1.0.0-arm64.apk";

const features = [
  {
    title: "AI mock interview practice",
    description:
      "Practice realistic interviews for HR, technical, behavioral, and company-specific rounds.",
    icon: MessageSquareText
  },
  {
    title: "AI answer feedback",
    description:
      "Review scores, strengths, improvement areas, and suggested answer framing after each response.",
    icon: BrainCircuit
  },
  {
    title: "Resume ATS analysis",
    description:
      "Analyze resume readiness, missing keywords, rewrite suggestions, and section-level improvements.",
    icon: FileText
  },
  {
    title: "Progress tracking",
    description: "Track sessions, average score, streaks, and improvement trends over time.",
    icon: BarChart3
  },
  {
    title: "Focused practice paths",
    description: "Choose the interview type you need and practice in shorter, repeatable sessions.",
    icon: Target
  },
  {
    title: "Verified premium access",
    description:
      "Premium access is activated only after backend payment verification, never directly by the mobile client.",
    icon: ShieldCheck
  }
];

const plans = [
  {
    name: "Monthly Premium",
    price: "INR 99",
    cadence: "/month",
    description: "A focused option for short interview preparation cycles. Billed monthly.",
    features: [
      "Unlimited mock interview practice",
      "More resume ATS scans",
      "Longer interview sessions",
      "Priority AI feedback"
    ]
  },
  {
    name: "Yearly Premium",
    price: "INR 799",
    cadence: "/year",
    description: "Best value for long-term interview readiness. Billed yearly.",
    features: [
      "Everything in Monthly Premium",
      "Lower annual cost",
      "Consistent progress tracking",
      "Premium practice flow"
    ],
    featured: true
  }
];

const useCases = [
  {
    title: "First interview preparation",
    description:
      "Use guided mock rounds to get comfortable speaking clearly, structuring answers, and handling common HR questions.",
    icon: Rocket
  },
  {
    title: "Resume-to-interview improvement",
    description:
      "Review ATS gaps, rewrite sections, then practice the exact stories and outcomes your resume needs to support.",
    icon: FileText
  },
  {
    title: "Consistent weekly practice",
    description:
      "Track progress, keep your streak alive, and focus each day on one weak area instead of preparing randomly.",
    icon: Target
  }
];

const upcomingFeatures = [
  {
    title: "Voice Mock Interview - Planned for v1.2",
    description:
      "Practice interview answers by speaking naturally. Prep-AI will transcribe your response, let you review the transcript, and then provide AI-powered feedback. This feature is currently in private testing and is not included in the public beta.",
    icon: MessageSquareText
  },
  {
    title: "AI Interviewer Readout - Planned for v1.2+",
    description:
      "Hear interview questions spoken aloud for a more realistic mock interview experience. This will be introduced after voice answer testing is stable.",
    icon: Smartphone
  },
  {
    title: "Real-time Voice Interview - Future Roadmap",
    description:
      "A future conversational interview mode with live follow-up questions and full session feedback. This is experimental and will only be released after reliability, quality, and cost checks are complete.",
    icon: Rocket
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
            <a href="#about">About</a>
            <a href="#use-cases">Use cases</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="button" href={APK_DOWNLOAD_URL}>
            <Download size={18} />
            Download APK
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">
              <Sparkles size={16} />
              AI-powered interview preparation
            </span>

            <h1>
              Practice smarter.
              <br />
              Interview better.
            </h1>

            <p className="hero-copy">
              IntervueAI is an AI-powered interview preparation app that helps job seekers practice
              mock interviews, improve answers with AI feedback, analyze resumes for ATS readiness,
              and track interview progress.
            </p>

            <div className="hero-actions">
              <a className="button" href={APK_DOWNLOAD_URL}>
                <Download size={18} />
                Download Android APK
              </a>
              <a className="button secondary" href="#pricing">
                View plans
              </a>
            </div>

            <div className="download-note">
              <Smartphone size={16} />
              <span>
                Public beta APK for most modern Android phones. Current public beta focuses on
                text interview practice, while voice features remain in private testing.
              </span>
            </div>

            <div className="proof-row" aria-label="Product highlights">
              <div className="proof-card">
                <strong>Practice</strong>
                <span>Build confidence before HR, technical, and behavioral rounds.</span>
              </div>
              <div className="proof-card">
                <strong>Improve</strong>
                <span>Get score-based feedback and focused next steps after each mock.</span>
              </div>
              <div className="proof-card">
                <strong>Convert</strong>
                <span>
                  Use resume analysis and practice together to get interview-ready faster.
                </span>
              </div>
            </div>
          </div>

          <div className="panel" aria-label="Interview feedback preview">
            <div className="interview-card">
              <div className="interview-top">
                <span>HR round - Question 2 of 5</span>
                <span className="timer-pill">
                  <TimerReset size={14} /> 01:42
                </span>
              </div>

              <p className="question">
                Tell me about a time you handled pressure during an important project.
              </p>

              <div className="answer-box">
                Your answer is reviewed for clarity, structure, relevance, and confidence so you
                know what to improve before the real interview.
              </div>

              <div className="feedback-grid">
                <div className="score">
                  <div>
                    <strong>82</strong>
                    <p>Coach score</p>
                  </div>
                </div>
                <div className="feedback-note">
                  <strong>What worked</strong>
                  <p>
                    Clear situation and result. Add one measurable outcome and a tighter closing
                    sentence for a stronger finish.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section compact" id="about">
        <div className="container">
          <div className="about-card">
            <div>
              <span className="eyebrow">
                <Smartphone size={16} />
                Mobile app for interview readiness
              </span>
              <h2>About IntervueAI</h2>
              <p>
                IntervueAI helps job seekers prepare for interviews with guided mock practice,
                AI-powered answer feedback, resume ATS analysis, and progress tracking. The product
                is delivered through the IntervueAI mobile app.
              </p>
            </div>
            <div className="reviewer-list" aria-label="Review details">
              <div>
                <strong>Product type</strong>
                <span>Digital interview-preparation subscription</span>
              </div>
              <div>
                <strong>Payment processing</strong>
                <span>Handled through a secure payment provider and verified by the backend</span>
              </div>
              <div>
                <strong>Premium access</strong>
                <span>Activated only after successful server-side payment verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section compact" id="use-cases">
        <div className="container">
          <div className="section-heading center">
            <h2>Built for real interview preparation use cases.</h2>
            <p>
              IntervueAI is most helpful when you need practice that feels structured, measurable,
              and easy to repeat from your phone.
            </p>
          </div>

          <div className="grid use-case-grid">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;

              return (
                <article className="card" key={useCase.title}>
                  <div className="icon-bubble">
                    <Icon size={22} />
                  </div>
                  <h3>{useCase.title}</h3>
                  <p>{useCase.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-heading center">
            <h2>Everything needed for sharper interview preparation.</h2>
            <p>
              IntervueAI brings practice, feedback, resume readiness, and progress tracking into one
              focused mobile experience.
            </p>
          </div>

          <div className="grid features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="card" key={feature.title}>
                  <div className="icon-bubble">
                    <Icon size={22} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section compact" id="upcoming-features">
        <div className="container">
          <div className="section-heading center">
            <h2>Upcoming Features</h2>
            <p>
              Voice capabilities are actively being tested behind feature flags. They are planned
              for a future release and are not included in the current public beta.
            </p>
          </div>

          <div className="grid use-case-grid">
            {upcomingFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="card" key={feature.title}>
                  <div className="icon-bubble">
                    <Icon size={22} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-heading center">
            <h2>Simple pricing for serious preparation.</h2>
            <p>
              Premium plans unlock more practice while free limits remain available for beta users.
              Prices are listed in Indian Rupees. Voice features are not part of the current public
              beta offering.
            </p>
          </div>

          <div className="apk-banner">
            <div>
              <strong>Want to try the app before choosing a plan?</strong>
              <p>Download the latest Android preview APK and explore the full mobile experience.</p>
            </div>
            <a className="button" href={APK_DOWNLOAD_URL}>
              <Download size={18} />
              Download APK
            </a>
          </div>

          <div className="grid pricing-grid">
            {plans.map((plan) => (
              <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
                {plan.featured ? (
                  <span className="tag">Best value</span>
                ) : (
                  <span className="tag">Flexible</span>
                )}
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
                  Premium access is enabled in the mobile app after successful backend payment
                  verification.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section compact" id="payment-flow">
        <div className="container">
          <div className="section-heading center">
            <h2>How payments and access work.</h2>
            <p>
              The website explains the product and pricing. The mobile app starts the payment flow,
              and the backend verifies payment before enabling premium.
            </p>
          </div>

          <div className="grid process-grid">
            <article className="card">
              <div className="icon-bubble">
                <CreditCard size={22} />
              </div>
              <h3>1. Choose a plan</h3>
              <p>Users select Monthly Premium or Yearly Premium in the IntervueAI mobile app.</p>
            </article>
            <article className="card">
              <div className="icon-bubble">
                <ShieldCheck size={22} />
              </div>
              <h3>2. Pay securely</h3>
              <p>
                Payment is processed by a secure payment provider. Secrets are never exposed in the
                app.
              </p>
            </article>
            <article className="card">
              <div className="icon-bubble">
                <Check size={22} />
              </div>
              <h3>3. Access is activated</h3>
              <p>
                The backend verifies payment and then enables premium access for the user account.
              </p>
            </article>
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
              <h2>Need help with IntervueAI?</h2>
              <p>
                For payment, account, refund, or app support, contact the IntervueAI support team.
                We use this inbox for user help and payment-related queries.
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
            <p>IntervueAI - Practice smarter. Interview better.</p>
          </div>

          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#pricing">Pricing</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refund">Refund Policy</a>
            <a href="/delivery">Digital Delivery</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
