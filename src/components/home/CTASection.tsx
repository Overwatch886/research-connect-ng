import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 hero-gradient relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-primary/50 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm mb-6">
            <Shield className="w-4 h-4" />
            <span>Join 50,000+ Nigerian Students</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Research?
          </h2>
          
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-xl mx-auto">
            Whether you're conducting research or participating in studies, 
            Research Connect makes it simple, secure, and rewarding.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl" asChild>
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
