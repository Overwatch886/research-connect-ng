import { 
  FileEdit, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  Users, 
  BarChart3,
  GraduationCap,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: FileEdit,
    title: "Drag & Drop Form Builder",
    description: "Create professional surveys in minutes with our intuitive form builder. Multiple question types, logic jumps, and beautiful themes.",
    color: "primary"
  },
  {
    icon: ShieldCheck,
    title: "Student Verification",
    description: "Verify participants using university emails or student ID matching. Support for 150+ Nigerian tertiary institutions.",
    color: "success"
  },
  {
    icon: CreditCard,
    title: "Built-in Payments",
    description: "Pay participants directly through the platform. Fair compensation ensures quality responses.",
    color: "secondary"
  },
  {
    icon: Lock,
    title: "Military-Grade Security",
    description: "End-to-end encryption for all research data. GDPR compliant with anonymous response options.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Targeted Sampling",
    description: "Filter participants by university, department, level, or demographics. Get the exact sample you need.",
    color: "success"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Watch responses come in live. Export to Excel, SPSS, or get AI-powered insights.",
    color: "secondary"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background" id="features">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for <span className="gradient-text">Quality Research</span>
          </h2>
          <p className="text-muted-foreground">
            From survey creation to participant payments - we've built every tool you need.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group p-8 rounded-2xl border border-border bg-card hover:shadow-large transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                feature.color === 'primary' ? 'bg-primary/10' :
                feature.color === 'secondary' ? 'bg-secondary/10' : 'bg-success/10'
              }`}>
                <feature.icon className={`w-7 h-7 ${
                  feature.color === 'primary' ? 'text-primary' :
                  feature.color === 'secondary' ? 'text-secondary' : 'text-success'
                }`} />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
