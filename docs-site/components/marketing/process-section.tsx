export function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Define Your Catalog',
      description: 'Set the guardrails. Define which components, actions, and data bindings AI can use.',
    },
    {
      number: '02',
      title: 'Users Prompt',
      description: 'End users describe what they want. AI generates JSON constrained to your catalog.',
    },
    {
      number: '03',
      title: 'Render Instantly',
      description: 'Stream the response. Your components render progressively as JSON arrives.',
    },
  ];

  return (
    <section className="container px-4 py-24">
      <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col">
            <div className="text-7xl font-bold text-muted-foreground/40 mb-6 font-mono">
              {step.number}
            </div>
            <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
