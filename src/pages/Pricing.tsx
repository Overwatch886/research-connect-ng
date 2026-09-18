import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Check, 
  Sparkles, 
  HelpCircle, 
  Coins, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  HeartHandshake, 
  GraduationCap, 
  Building2, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "How does participant pricing work?",
    answer: "You only pay for verified, substantive student responses. You choose the reward amount (₦500 to ₦1,500) and target sample size. 100% of the student reward is locked in secure escrow and disbursed only when Gemini AI verifies the response. A flat 10% platform fee is added to cover AI screening, identity verification, and hosting. No monthly recurring subscriptions!"
  },
  {
    question: "What does the 10% platform fee cover?",
    answer: "The 10% fee powers our anti-fraud infrastructure: real-time Gemini semantic relevance screening (detecting off-topic banter and gibberish), automated student matriculation/.edu.ng verification across 150+ Nigerian universities, conversational AI interview hosting with Ada, and guaranteed escrow protection."
  },
  {
    question: "How do Free Surveys work through Peer Research Karma?",
    answer: "If you have zero research budget (such as for undergraduate final-year projects), you can publish for free! To earn free responses, simply participate in academic surveys posted by peer researchers. Every verified response you submit earns you 1 Peer Research Credit (1 credit = 1 free response slot for your study). Plus, new verified student researchers receive 5 free welcome credits on signup!"
  },
  {
    question: "What happens to unspent escrow funds?",
    answer: "Your escrow funds are strictly protected. If your survey expires or you pause it before reaching your target sample size, 100% of the remaining unspent reward and pro-rated platform fee is instantly returned to your researcher wallet."
  },
  {
    question: "What verification methods are supported?",
    answer: "We support university institutional email verification (.edu.ng domains) and matriculation number verification for all 150+ Nigerian federal, state, and accredited private universities."
  }
];

const Pricing = () => {
  const [sampleSize, setSampleSize] = useState<number>(50);
  const [rewardPerStudent, setRewardPerStudent] = useState<number>(500);

  const studentPool = sampleSize * rewardPerStudent;
  const platformFee = Math.round(studentPool * 0.10);
  const totalEscrow = studentPool + platformFee;
  const costPerResponse = rewardPerStudent + Math.round(rewardPerStudent * 0.10);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="py-12 md:py-16 text-center container mx-auto px-4 max-w-4xl">
          <Badge variant="outline" className="px-3.5 py-1.5 border-primary/30 text-primary bg-primary/5 text-xs font-semibold uppercase tracking-wider mb-4 gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            Transparent Pay-Per-Participant Model
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Simple, Transparent <span className="gradient-text">Research Pricing</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Pay only for genuine, verified Nigerian student responses. No locked monthly subscriptions. 100% of student incentives held in escrow + flat 10% platform fee.
          </p>
        </section>

        {/* Interactive Escrow & Participant Budget Calculator */}
        <section className="container mx-auto px-4 max-w-4xl mb-20">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Interactive Calculator</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">Estimate Your Research Escrow</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Slide or select your sample size and reward per verified student.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>Avg. Completion: &lt; 24 Hours</span>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8 pt-8">
              {/* Controls Column */}
              <div className="md:col-span-7 space-y-6">
                {/* Sample Size Control */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Target Verified Students:</span>
                    </label>
                    <span className="font-bold text-lg text-primary">{sampleSize} respondents</span>
                  </div>
                  <Slider
                    value={[sampleSize]}
                    onValueChange={(val) => setSampleSize(val[0])}
                    min={10}
                    max={500}
                    step={10}
                    className="py-3"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                    <span>10 (Pilot Study)</span>
                    <span>100 (Undergraduate)</span>
                    <span>250 (Thesis)</span>
                    <span>500+ (National)</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {[25, 50, 100, 200, 500].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSampleSize(count)}
                        className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                          sampleSize === count
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {count} students
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reward per Student Control */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-secondary" />
                      <span>Reward per Verified Student:</span>
                    </label>
                    <span className="font-bold text-lg text-secondary">₦{rewardPerStudent.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[500, 750, 1000, 1500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRewardPerStudent(amt)}
                        className={`text-xs py-2 rounded-xl border font-bold transition-all ${
                          rewardPerStudent === amt
                            ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        ₦{amt}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Recommended: ₦500 for 3–5 min surveys; ₦1,000+ for in-depth 10+ min studies.
                  </p>
                </div>

                {/* Feature Checklist */}
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Gemini AI anti-fraud semantic relevance screening included</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Conversational AI Interview Mode with Voice STT (Ada)</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1-Click Grounded APA Academic Paper & Google NotebookLM Dossier Export</span>
                  </div>
                </div>
              </div>

              {/* Escrow Breakdown Card */}
              <div className="md:col-span-5 bg-gradient-to-b from-card to-muted/40 p-6 rounded-2xl border border-border flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Transparent Escrow Deposit
                  </span>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Student Reward Pool:</span>
                      <span className="font-semibold text-foreground">₦{studentPool.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pl-2 -mt-1">
                      (100% disbursed to {sampleSize} verified students)
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span>Platform Fee (10%):</span>
                      </span>
                      <span className="font-semibold text-foreground">₦{platformFee.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pl-2 -mt-1">
                      (Anti-fraud AI, .edu.ng verification & hosting)
                    </div>

                    <div className="pt-3 border-t-2 border-border/80 flex justify-between items-baseline">
                      <span className="font-bold text-base">Total Escrow:</span>
                      <div className="text-right">
                        <span className="font-display text-3xl font-extrabold text-primary">
                          ₦{totalEscrow.toLocaleString()}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          ₦{costPerResponse.toLocaleString()} per verified response
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-md" asChild>
                    <Link to={`/create-survey`}>
                      Launch Survey with this Budget
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground mt-2">
                    🔒 Funds held in escrow. Instant refund for unspent quota.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The 3 Research Funding Paths */}
        <section className="container mx-auto px-4 max-w-6xl mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Three Flexible Paths to Research Data
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              From zero-budget undergraduate theses to large-scale faculty grants.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Path 1: Free Community Exchange */}
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Peer Research Karma</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Free Community Exchange</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Perfect for final-year students, pilot projects, and self-funded academic researchers.
                </p>

                <div className="mb-6">
                  <span className="font-display text-4xl font-extrabold">₦0</span>
                  <span className="text-sm text-muted-foreground ml-1.5">Cash Required</span>
                </div>

                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>5 Free Welcome Credits</strong> on institutional signup</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Earn 1 credit per verified peer survey taken</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Gemini anti-fraud semantic relevance check</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Conversational Voice Interview with Ada</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Grounded APA Academic Whitepaper Draft</span>
                  </li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/signup?role=researcher">Start Free with Peer Karma</Link>
              </Button>
            </div>

            {/* Path 2: Direct Escrow (Most Popular) */}
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col justify-between shadow-xl scale-105 z-10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Most Popular</span>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-semibold mb-4">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Pay Per Participant</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-2 text-primary-foreground">Direct Escrow Funding</h3>
                <p className="text-sm text-primary-foreground/80 mb-6">
                  For rapid academic research, Master's/PhD theses, and verified departmental studies.
                </p>

                <div className="mb-6">
                  <span className="font-display text-4xl font-extrabold text-primary-foreground">₦Reward</span>
                  <span className="text-sm text-primary-foreground/80 ml-1.5">+ 10% Platform Fee</span>
                </div>

                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Fast completion: under 24 to 48 hours</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Verified students from 150+ Nigerian universities</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Real-time Gemini anti-fraud semantic screening</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>Conversational voice interview mode (Ada)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>1-Click Grounded APA Academic Paper Draft</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>1-Click Google NotebookLM Dossier & Audio Overview</span>
                  </li>
                </ul>
              </div>

              <Button variant="gold" size="lg" className="w-full font-bold shadow-lg" asChild>
                <Link to="/create-survey">Fund & Launch Survey</Link>
              </Button>
            </div>

            {/* Path 3: Institutional Grants */}
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-4">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Faculties & Grants</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Institutional & Grants</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  For university faculties, NGOs, think-tanks, and funded research teams.
                </p>

                <div className="mb-6">
                  <span className="font-display text-4xl font-extrabold">Custom</span>
                  <span className="text-sm text-muted-foreground ml-1.5">Volume Discounts</span>
                </div>

                <ul className="space-y-3 mb-8 text-sm">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Volume platform fee discounts (&lt;8%)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>University department invoicing & bank transfers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Stratified sampling (Federal vs State vs Private)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Raw SPSS, Stata, and anonymized CSV exports</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Dedicated research methodologist support</span>
                  </li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:contact@researchconnect.ng?subject=Institutional Research Inquiry">Contact Research Team</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Deep Dive: How Free Surveys (Peer Karma) Work */}
        <section className="container mx-auto px-4 max-w-4xl mb-24">
          <div className="bg-muted/30 border border-border rounded-3xl p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold">
                  How Free Surveys Work: The Peer Research Karma System
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  A fair, self-sustaining reciprocity engine designed for Nigerian student researchers.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-semibold text-sm">Earn 5 Welcome Credits</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every researcher who verifies their university email (.edu.ng) or matric number receives 5 starter response credits immediately.
                </p>
              </div>

              <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-semibold text-sm">Take Peer Surveys</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Contribute to research posted by fellow Nigerian students. Each thoughtful response that passes Gemini's semantic quality audit earns you <strong>1 Peer Credit</strong>.
                </p>
              </div>

              <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="font-semibold text-sm">Publish Your Study Free</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Spend your accumulated credits to get verified students to respond to your study for free (1 credit = 1 verified respondent). Zero naira out of pocket.
                </p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Anti-Gaming Protection:</strong> Gemini AI automatically audits every submitted answer for genuine relevance. Keyboard mashing, bot scripts, or one-word evasive replies are disqualified and do not award karma credits.
              </span>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-sm">
                Everything you need to know about pricing, escrow, and peer credits.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base mb-1.5">{faq.question}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
