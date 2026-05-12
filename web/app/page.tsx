import {
  BarChart3,
  Bot,
  BrainCircuit,
  Check,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp
} from "lucide-react";

const features = [
  {
    title: "AI mock interview practice",
    description:
      "Practice realistic interviews with prompts built for HR, technical, behavioral, and company-specific rounds.",
    icon: MessageSquareText
  },
  {
    title: "AI answer feedback",
    description:
      "Review scores, strengths, improvements, and suggested answer framing after each response.",
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
    description:
      "Track sessions, average score, streaks, and improvement trends as your preparation grows.",
    icon: BarChart3
  },
  {
    title: "Focused practice paths",
    description: "Choose the interview type you need and practice in shorter, repeatable sessions.",
    icon: Target
  },
  {
    title: "Secure premium access",
    description:
      "Premium access is activated only after backend payment verification, never from the mobile client.",
    icon: ShieldCheck
  }
];

const plans = [
  {
    name: "Monthly Premium",
    price: "₹99",
    cadence: "/month",
    description: "A focused option for short interview preparation cycles.",
    features: [
      "Unlimited practice",
      "More resume scans",
      "Longer interviews",
      "Priority AI feedback"
    ]
  },
  {
    name: "Yearly Premium",
    price: "₹799",
    cadence: "/year",
    description: "Best value for long-term interview readiness.",
    features: [
      "Everything in Monthly",
      "Lower yearly cost",
      "Consistent progress tracking",
      "Premium practice flow"
    ],
    featured: true
  }
];

const policies = [
  {
    id: "refund",
    title: "Refund/Cancellation Policy",
    body: "Refunds are available for duplicate payments, failed transactions where premium access was not granted, or accidental payments reported within 7 days. Once premium access is activated and used, payments are generally non-refundable. Approved refunds are processed to the original payment method as per Razorpay/bank timelines."
  },
  {
    id: "terms",
    title: "Terms",
    body: "Users can use IntervueAI for interview practice, resume analysis, and progress tracking. Premium access is granted only after successful payment verification. Users must not misuse the service or upload illegal or harmful content."
  },
  {
    id: "privacy",
    title: "Privacy",
    body: "IntervueAI uses account, interview, resume analysis, and payment-related information only to provide app features and improve the service. Payment processing is handled by Razorpay."
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
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#policies">Policies</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="button" href="#pricing">
            View plans
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
              IntervueAI is an AI-powered interview preparation app that helps users practice mock
              interviews, improve answers with AI feedback, analyze resumes for ATS readiness, and
              track interview progress.
            </p>

            <div className="hero-actions">
              <a className="button" href="#pricing">
                See pricing
              </a>
              <a className="button secondary" href="#features">
                Explore features
              </a>
            </div>

            <div className="proof-row" aria-label="Product highlights">
              <div className="proof-card">
                <strong>4</strong>
                <span>Interview modes for common hiring rounds.</span>
              </div>
              <div className="proof-card">
                <strong>ATS</strong>
                <span>Resume analysis for job readiness.</span>
              </div>
              <div className="proof-card">
                <strong>AI</strong>
                <span>Structured feedback after each answer.</span>
              </div>
            </div>
          </div>

          <div className="panel" aria-label="Interview feedback preview">
            <div className="interview-card">
              <div className="interview-top">
                <span>HR round · Question 2 of 5</span>
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

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-heading center">
            <h2>Simple pricing for serious preparation.</h2>
            <p>
              Premium plans unlock more practice while free limits remain available for beta users.
            </p>
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
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="policies">
        <div className="container">
          <div className="section-heading center">
            <h2>Clear policies for Razorpay onboarding.</h2>
            <p>
              These sections are included so users and payment reviewers can understand pricing,
              refunds, terms, and privacy.
            </p>
          </div>

          <div className="grid policy-grid">
            {policies.map((policy) => (
              <article className="policy-card" id={policy.id} key={policy.id}>
                <h3>{policy.title}</h3>
                <p>{policy.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container">
          <div className="contact-card">
            <div>
              <span className="eyebrow">
                <ClipboardCheck size={16} />
                Contact
              </span>
              <h2>Need help with IntervueAI?</h2>
              <p>
                We are preparing the final support inbox before public launch. Until then, the app
                and website avoid showing a dummy email address.
              </p>
            </div>
            <div className="support-status">Support email coming soon.</div>
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
            <p>
              IntervueAI - Practice smarter. Interview better. Payment processing is handled by
              Razorpay.
            </p>
          </div>

          <div className="footer-links">
            <a href="#pricing">Pricing</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#refund">Refund Policy</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
