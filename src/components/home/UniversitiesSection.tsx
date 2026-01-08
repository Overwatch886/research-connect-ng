import { GraduationCap, Building2 } from "lucide-react";

const universities = [
  "University of Lagos",
  "University of Ibadan",
  "Obafemi Awolowo University",
  "University of Nigeria, Nsukka",
  "Ahmadu Bello University",
  "University of Benin",
  "Covenant University",
  "Lagos State University",
  "University of Ilorin",
  "Nnamdi Azikiwe University",
  "Federal University of Technology, Akure",
  "Babcock University"
];

const UniversitiesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm mb-4">
            <GraduationCap className="w-4 h-4" />
            <span>Trusted by Students</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            150+ Nigerian Universities <span className="gradient-text">Verified</span>
          </h2>
          <p className="text-muted-foreground">
            We support student verification from all accredited tertiary institutions in Nigeria.
          </p>
        </div>

        {/* University Logos Scroll */}
        <div className="relative overflow-hidden py-8">
          <div className="flex gap-8 animate-[scroll_30s_linear_infinite]">
            {[...universities, ...universities].map((uni, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl bg-muted/50 border border-border"
              >
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {uni}
                </span>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default UniversitiesSection;
