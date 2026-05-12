const sections = [
  {
    title: "1. Information We Collect",
    body: "When you create an account, use IntervueAI, purchase premium access, or contact support, we may collect details such as your name, email address, contact information if provided, profile preferences, interview answers, resume-analysis data, app usage information, and payment-verification information. We do not store sensitive payment credentials in the mobile app."
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to provide mock interview practice, answer feedback, resume ATS analysis, progress tracking, subscription access, payment verification, user support, safety controls, and service improvement for IntervueAI."
  },
  {
    title: "3. Cookies",
    body: "The IntervueAI website may use cookies or similar technologies to support basic website functionality, understand traffic, and improve browsing experience. You can manage or disable cookies through your browser settings."
  },
  {
    title: "4. Data Security",
    body: "We take reasonable security measures to protect personal data against unauthorized access, misuse, or disclosure, both online and offline. Privileged AI and payment verification operations are handled through backend systems, not directly from the mobile client."
  },
  {
    title: "5. Third-Party Services",
    body: "IntervueAI may use trusted third-party services for authentication, database/storage, AI processing through backend routes, payment processing, hosting, analytics, and crash reporting. These services receive only the information needed to perform their specific function."
  },
  {
    title: "6. Resume and Interview Data",
    body: "Resume text, uploaded resume files, interview answers, and AI feedback can contain personal information. Users should avoid uploading highly sensitive information unless necessary for the feature they are using."
  },
  {
    title: "7. Updates to This Policy",
    body: "IntervueAI may update this Privacy Policy from time to time. Any changes will be posted on this page, and users are encouraged to review it periodically."
  },
  {
    title: "8. Contact",
    body: "For privacy questions, support requests, or data deletion requests, contact kishan@kishan.codes."
  }
];

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <div className="legal-container">
        <a className="legal-back" href="/">
          Back to IntervueAI
        </a>
        <header className="legal-header">
          <p>IntervueAI</p>
          <h1>Privacy Policy</h1>
          <span>Last updated: May 12, 2026</span>
        </header>
        <div className="legal-content">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
