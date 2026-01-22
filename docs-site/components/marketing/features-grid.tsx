import { Shield, Zap, Code, Link2, Settings, Eye } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Guardrails',
    description: 'AI can only use components you define in the catalog',
  },
  {
    icon: Zap,
    title: 'Streaming',
    description: 'Progressive rendering as JSON streams from the model',
  },
  {
    icon: Code,
    title: 'Code Export',
    description: 'Export as standalone React code with no runtime dependencies',
  },
  {
    icon: Link2,
    title: 'Data Binding',
    description: 'Two-way binding with JSON Pointer paths',
  },
  {
    icon: Settings,
    title: 'Actions',
    description: 'Named actions handled by your application',
  },
  {
    icon: Eye,
    title: 'Visibility',
    description: 'Conditional show/hide based on data or auth',
  },
];

export function FeaturesGrid() {
  return (
    <section className="container px-4 py-24">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-8 border-2 rounded-xl hover:border-primary/50 transition-all hover:shadow-lg bg-card"
            >
              <Icon className="h-10 w-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
