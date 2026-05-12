const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using the IntervueAI website or app, you acknowledge and agree to comply with these Terms and Conditions. If you do not agree, please do not use the website or app."
  },
  {
    title: "2. User Responsibilities",
    body: "You agree not to engage in any action that may disrupt, damage, or interfere with the smooth functioning of the website, app, backend, or related services. You must not misuse the service, upload illegal or harmful content, attempt to bypass usage limits, or interfere with other users."
  },
  {
    title: "3. Service Description",
    body: "IntervueAI is an AI-powered interview preparation app that helps users practice mock interviews, receive answer feedback, analyze resumes for ATS readiness, and track progress. AI-generated content is provided for preparation support and should be reviewed by the user before relying on it."
  },
  {
    title: "4. Premium Access and Payments",
    body: "Premium access is granted only after successful payment verification by the backend. Payment confirmation, billing, and refunds may be handled by the relevant payment provider. Users must not attempt to bypass payment controls or obtain premium access without authorization."
  },
  {
    title: "5. Intellectual Property Rights",
    body: "All website content, app design, graphics, branding, software, documentation, and materials featured on IntervueAI are the property of IntervueAI or its respective owners and are protected under applicable intellectual property laws."
  },
  {
    title: "6. Limitation of Liability",
    body: "IntervueAI will not be held responsible for any indirect, incidental, special, or consequential damages arising from your use of or access to the website, app, AI feedback, resume suggestions, or interview preparation content. IntervueAI does not guarantee job offers, interviews, hiring outcomes, salary increases, or acceptance by any company."
  },
  {
    title: "7. Indemnification",
    body: "By using the website or app, you agree to indemnify and hold IntervueAI harmless against any claims, damages, liabilities, costs, or expenses arising from your misuse of the service, violation of these Terms, unlawful uploads, or interference with the website, app, backend, or related services."
  },
  {
    title: "8. Governing Law",
    body: "These Terms and Conditions shall be governed and interpreted in accordance with the laws of India."
  },
  {
    title: "9. Contact",
    body: "For questions about these Terms and Conditions, contact kishan@kishan.codes."
  }
];

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <div className="legal-container">
        <a className="legal-back" href="/">
          Back to IntervueAI
        </a>
        <header className="legal-header">
          <p>IntervueAI</p>
          <h1>Terms & Conditions</h1>
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
