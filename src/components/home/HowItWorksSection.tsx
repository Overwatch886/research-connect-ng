import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const researcherSteps = [
  {
    step: "01",
    title: "Create Your Survey",
    description: "Use our drag-and-drop builder to create professional research forms with multiple question types."
  },
  {
    step: "02",
    title: "Set Participant Criteria",
    description: "Define your target sample - university, department, level, or any demographic requirement."
  },
  {
    step: "03",
    title: "Launch & Collect",
    description: "Publish your survey and watch verified responses come in. Pay participants fairly."
  },
  {
    step: "04",
    title: "Analyze & Export",
    description: "Get real-time analytics, visualizations, and export to your preferred format."
  }
];

const participantSteps = [
  {
    step: "01",
    title: "Verify Your Identity",
    description: "Use your university email or student ID to get verified. One-time process, takes 2 minutes."
  },
  {
    step: "02",
    title: "Browse Surveys",
    description: "Discover research opportunities that match your profile and interests."
  },
  {
    step: "03",
    title: "Complete & Earn",
    description: "Fill out surveys honestly and earn money for your time. Cash out anytime."
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-muted/30" id="how-it-works">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Simple, straightforward process for both researchers and participants.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* For Researchers */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              For Researchers
            </div>
            
            <div className="space-y-6">
              {researcherSteps.map((item, index) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild>
              <Link to="/signup?role=researcher">
                Start Research <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* For Participants */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              For Participants
            </div>
            
            <div className="space-y-6">
              {participantSteps.map((item, index) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary text-secondary-foreground font-display font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground mb-1">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="gold" asChild>
              <Link to="/signup?role=participant">
                Start Earning <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
