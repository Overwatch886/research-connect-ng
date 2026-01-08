import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Sparkles, HelpCircle } from "lucide-react";
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
      "Basic question types (5 types)",
      "Email verification only",
      "Excel export",
      "Community support",
      "Basic analytics"
    ],
    limitations: [
      "No payment to participants",
      "ResearchNaija branding"
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
      "All question types (9+ types)",
      "Advanced targeting filters",
      "SPSS, CSV & JSON export",
      "Priority email support",
      "Custom branding & themes",
      "Real-time analytics dashboard",
      "Participant payments",
      "Logic jumps & branching",
      "Response validation"
    ],
    cta: "Start 14-day Trial",
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
      "SSO/SAML integration",
      "API access",
      "Dedicated account manager",
      "Custom verification rules",
      "Data residency options",
      "SLA & uptime guarantee",
      "Training & onboarding",
      "Custom integrations"
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false
  }
];

const faqs = [
  {
    question: "How does participant payment work?",
    answer: "On paid plans, you can set a reward amount per survey completion. Funds are held in escrow and automatically distributed to verified participants who complete your survey."
  },
  {
    question: "What verification methods are available?",
    answer: "We support university email verification (.edu.ng domains) and matriculation number verification for all 150+ Nigerian tertiary institutions."
  },
  {
    question: "Is my research data secure?",
    answer: "Yes. All data is encrypted at rest and in transit using AES-256 encryption. We're GDPR compliant and data never leaves Nigeria unless you export it."
  },
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Absolutely. You can change your plan at any time. If you upgrade, you'll be prorated. If you downgrade, the change takes effect at your next billing cycle."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! Students get 50% off the Researcher plan with a verified university email. Just sign up with your .edu.ng email to apply automatically."
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-8 transition-all duration-300 ${
                    plan.popular
                      ? "bg-primary text-primary-foreground shadow-glow scale-105 z-10"
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
                    <span className={`font-display text-5xl font-bold ${
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
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.popular ? "text-secondary" : "text-success"
                        }`} />
                        <span className={plan.popular ? "text-primary-foreground/90" : "text-foreground"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations && (
                    <div className="mb-8 pb-4 border-t border-primary-foreground/20 pt-4">
                      <p className="text-xs text-primary-foreground/50 mb-2">Limitations:</p>
                      {plan.limitations.map((limit) => (
                        <p key={limit} className="text-xs text-primary-foreground/50">• {limit}</p>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={plan.popular ? "gold" : plan.variant}
                    size="lg"
                    asChild
                  >
                    <Link to="/signup">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">
                  Got questions? We've got answers.
                </p>
              </div>

              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                        <p className="text-muted-foreground text-sm">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
