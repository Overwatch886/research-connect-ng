import { Check, Sparkles, ArrowRight, Coins, HeartHandshake, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free Community Exchange",
    tagline: "Peer Research Karma",
    description: "Take peer surveys to earn free verified student responses for your own research.",
    price: "₦0",
    period: "Cash Required",
    badgeIcon: HeartHandshake,
    features: [
      "5 Free Welcome Credits on signup",
      "1 Credit per verified peer survey taken",
      "Gemini anti-fraud semantic check",
      "Conversational voice interview (Ada)",
      "1-Click APA paper draft"
    ],
    cta: "Start Free with Karma",
    href: "/signup?role=researcher",
    variant: "outline" as const,
    popular: false
  },
  {
    name: "Direct Escrow Funding",
    tagline: "Pay Per Participant",
    description: "Guaranteed student responses held in secure escrow with a transparent 10% platform fee.",
    price: "₦Reward",
    period: "+ 10% Platform Fee",
    badgeIcon: Coins,
    features: [
      "Under 24–48 hours turnaround",
      "Verified students across 150+ universities",
      "Real-time Gemini gibberish rejection",
      "1-Click Grounded APA Academic Paper",
      "Google NotebookLM Dossier Export",
      "Instant refund for unspent quota"
    ],
    cta: "Fund & Launch Survey",
    href: "/create-survey",
    variant: "default" as const,
    popular: true
  },
  {
    name: "Institutional & Grants",
    tagline: "Faculties & Research Teams",
    description: "For university faculties, NGOs, policy think-tanks, and funded grant cohorts.",
    price: "Custom",
    period: "Volume Discounts",
    badgeIcon: Building2,
    features: [
      "Volume platform fee discounts (<8%)",
      "University invoicing & bank transfers",
      "Demographic stratification (State/Fed/Private)",
      "SPSS, Stata & CSV raw dataset exports",
      "Dedicated methodologist support"
    ],
    cta: "Explore Pricing & Calculator",
    href: "/pricing",
    variant: "outline" as const,
    popular: false
  }
];

const PricingPreview = () => {
  return (
    <section className="py-24 bg-muted/30" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Coins className="w-3.5 h-3.5" />
            Transparent & Fair Economics
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent <span className="gradient-text">Research Pricing</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Pay strictly per verified Nigerian student response + 10% platform fee, or post for free with Peer Research Karma.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-glow scale-105 z-10"
                  : "bg-card border border-border hover:shadow-large"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-6">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    plan.popular ? "text-primary-foreground/80" : "text-primary"
                  }`}>
                    {plan.tagline}
                  </span>
                  <h3 className={`font-display text-xl font-bold mt-1 mb-2 ${
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={`font-display text-4xl font-extrabold ${
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  }`}>
                    {plan.price}
                  </span>
                  <span className={`text-xs sm:text-sm ml-1.5 ${
                    plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-secondary" : "text-emerald-600"
                      }`} />
                      <span className={plan.popular ? "text-primary-foreground/90" : "text-foreground"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full font-semibold"
                variant={plan.popular ? "gold" : plan.variant}
                size="lg"
                asChild
              >
                <Link to={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link to="/pricing">
              Open Interactive Escrow Budget Calculator
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
