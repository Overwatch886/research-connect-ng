import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "Perfect for small research projects",
    price: "₦0",
    period: "forever",
    features: [
      "Up to 50 responses/month",
      "Basic question types",
      "Email verification",
      "Excel export",
      "Community support"
    ],
    cta: "Start Free",
    variant: "outline" as const,
    popular: false
  },
  {
    name: "Researcher",
    description: "For serious academic research",
    price: "₦5,000",
    period: "/month",
    features: [
      "Unlimited responses",
      "All question types",
      "Advanced targeting",
      "SPSS & CSV export",
      "Priority support",
      "Custom branding",
      "Analytics dashboard"
    ],
    cta: "Start Trial",
    variant: "default" as const,
    popular: true
  },
  {
    name: "Institution",
    description: "For universities & organizations",
    price: "Custom",
    period: "",
    features: [
      "Everything in Researcher",
      "Unlimited team members",
      "SSO integration",
      "API access",
      "Dedicated support",
      "Custom verification",
      "Data residency options"
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false
  }
];

const PricingPreview = () => {
  return (
    <section className="py-24 bg-muted/30" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-glow scale-105"
                  : "bg-card border border-border hover:shadow-large"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-display text-xl font-semibold mb-2 ${
                  plan.popular ? "text-primary-foreground" : "text-foreground"
                }`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${
                  plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`font-display text-4xl font-bold ${
                  plan.popular ? "text-primary-foreground" : "text-foreground"
                }`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${
                  plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className={`w-5 h-5 flex-shrink-0 ${
                      plan.popular ? "text-secondary" : "text-primary"
                    }`} />
                    <span className={plan.popular ? "text-primary-foreground/90" : "text-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "gold" : plan.variant}
                asChild
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
