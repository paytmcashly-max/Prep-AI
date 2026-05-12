import {
  BarChart3,
  BrainCircuit,
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  Mail,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TimerReset,
  Truck
} from "lucide-react";

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

const policies = [
  {
    id: "refund",
    title: "Refund/Cancellation Policy",
    icon: RefreshCcw,
    body: "Refunds are available for duplicate payments, failed transactions where premium access was not granted, or accidental payments reported within 7 days. Once premium access is activated and used, payments are generally non-refundable. Approved refunds are processed to the original payment method as per Razorpay and bank timelines, typically within 5-7 business days after approval."
  },
  {
    id: "terms",
    title: "Terms",
    icon: ClipboardCheck,
    body: "Users can use IntervueAI for interview practice, resume analysis, and progress tracking. Premium access is granted only after successful payment verification. Users must not misuse the service, upload illegal or harmful content, attempt to bypass usage limits, or interfere with the app or backend systems."
  },
  {
    id: "privacy",
    title: "Privacy",
    icon: ShieldCheck,
    body: "IntervueAI uses account, interview, resume analysis, and payment-related information only to provide app features, secure access, improve reliability, and support payment verification. Payment processing is handled by Razorpay. Sensitive payment credentials are not stored in the mobile app."
  },
  {
    id: "delivery",
    title: "Digital Delivery / No Shipping",
    icon: Truck,
    body: "IntervueAI is a digital mobile app subscription. No physical product is shipped. Premium access is delivered inside the app after successful payment verification by the backend. If access is delayed, users can refresh premium status in the app."
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
              IntervueAI is an AI-powered interview preparation app that helps job seekers practice
              mock interviews, improve answers with AI feedback, analyze resumes for ATS readiness,
              and track interview progress.
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
                <strong>Payment processor</strong>
                <span>Razorpay, verified through backend payment callbacks</span>
              </div>
              <div>
                <strong>Premium access</strong>
                <span>Activated only after successful server-side payment verification</span>
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
              Prices are listed in Indian Rupees.
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
                <p className="billing-note">
                  Premium access is enabled in the mobile app after successful Razorpay payment
                  verification by the backend.
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
                Payment is processed by Razorpay. Razorpay secrets are never exposed in the app.
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

      <section className="section" id="policies">
        <div className="container">
          <div className="section-heading center">
            <h2>Clear policies for payment review.</h2>
            <p>
              These sections explain pricing, refunds, terms, privacy, and digital delivery for
              users and payment reviewers.
            </p>
          </div>

          <div className="grid policy-grid">
            {policies.map((policy) => {
              const Icon = policy.icon;

              return (
                <article className="policy-card" id={policy.id} key={policy.id}>
                  <div className="icon-bubble compact-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{policy.title}</h3>
                  <p>{policy.body}</p>
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
            <p>
              IntervueAI - Practice smarter. Interview better. Payment processing is handled by
              Razorpay.
            </p>
          </div>

          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#pricing">Pricing</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#refund">Refund Policy</a>
            <a href="#delivery">Digital Delivery</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
