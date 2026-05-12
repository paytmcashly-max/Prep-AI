const sections = [
  {
    title: "Refund Eligibility",
    body: "Refunds are available for duplicate payments, failed transactions where premium access was not granted, or accidental payments reported within 7 days."
  },
  {
    title: "Non-Refundable Usage",
    body: "Once premium access is activated and used, payments are generally non-refundable unless required by applicable law or approved after review."
  },
  {
    title: "Processing Timeline",
    body: "Approved refunds are processed to the original payment method as per payment provider and bank timelines, typically within 5-7 business days after approval."
  },
  {
    title: "Cancellation",
    body: "Cancellation stops future access or renewal where applicable. It may not automatically refund previous charges."
  },
  {
    title: "Contact",
    body: "For refund or cancellation help, contact kishan@kishan.codes."
  }
];

export default function RefundPage() {
  return (
    <main className="legal-shell">
      <div className="legal-container">
        <a className="legal-back" href="/">
          Back to IntervueAI
        </a>
        <header className="legal-header">
          <p>IntervueAI</p>
          <h1>Refund & Cancellation Policy</h1>
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
