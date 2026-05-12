const sections = [
  {
    title: "Digital Product",
    body: "IntervueAI is a digital mobile app subscription for interview practice, resume analysis, and progress tracking."
  },
  {
    title: "No Physical Shipping",
    body: "No physical product is shipped. There are no shipping charges, courier timelines, or delivery addresses for premium access."
  },
  {
    title: "Access Delivery",
    body: "Premium access is delivered inside the IntervueAI app after successful backend payment verification. If access is delayed, users can refresh premium status in the app or contact support."
  },
  {
    title: "Contact",
    body: "For access or delivery-related support, contact kishan@kishan.codes."
  }
];

export default function DeliveryPage() {
  return (
    <main className="legal-shell">
      <div className="legal-container">
        <a className="legal-back" href="/">
          Back to IntervueAI
        </a>
        <header className="legal-header">
          <p>IntervueAI</p>
          <h1>Digital Delivery / No Shipping</h1>
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
