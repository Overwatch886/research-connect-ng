import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Zap, CheckCircle } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/50 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-sm mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Verified Nigerian Student Researchers Only</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up">
            Get Quality Research Participants{" "}
            <span className="gradient-text-gold">in Minutes</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Connect with verified students from over 150+ Nigerian universities. 
            Create surveys, find participants, and get responses - all on one secure platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="gold" size="xl" asChild>
              <Link to="/signup?role=researcher">
                Start Research Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/signup?role=participant">
                Earn as Participant
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-primary-foreground/60 text-sm animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span>150+ Universities</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span>50,000+ Students</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span>End-to-End Encryption</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-3xl font-bold text-foreground mb-2">50K+</h3>
            <p className="text-muted-foreground text-sm">Verified Students</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-display text-3xl font-bold text-foreground mb-2">24hrs</h3>
            <p className="text-muted-foreground text-sm">Average Response Time</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-display text-3xl font-bold text-foreground mb-2">100%</h3>
            <p className="text-muted-foreground text-sm">Data Encrypted</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
