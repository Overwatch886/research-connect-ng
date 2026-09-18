import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Building2, 
  Home, 
  Wallet, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";
import {
  StudentDemographics,
  NIGERIAN_UNIVERSITIES,
  GEOPOLITICAL_ZONES,
  LEVELS_OF_STUDY,
  FACULTIES,
  LIVING_ARRANGEMENTS,
  MONTHLY_BUDGET_TIERS,
  UNIVERSITY_ZONE_MAP,
  getStudentDemographics,
  saveStudentDemographics,
} from "@/lib/demographics";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DemographicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (demographics: StudentDemographics) => void;
}

export const DemographicsModal = ({ isOpen, onClose, onSaved }: DemographicsModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState<StudentDemographics>(getStudentDemographics());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(getStudentDemographics());
    }
  }, [isOpen]);

  const handleUniversityChange = (uni: string) => {
    const autoZone = UNIVERSITY_ZONE_MAP[uni];
    setForm((prev) => ({
      ...prev,
      university: uni,
      geopoliticalZone: autoZone || prev.geopoliticalZone,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: StudentDemographics = {
        ...form,
        updatedAt: new Date().toISOString(),
      };
      await saveStudentDemographics(updated, user?.id);
      onSaved(updated);
      toast({
        title: "🎯 Demographics Saved!",
        description: "Your academic & regional profile is updated. Surveys have been calibrated to match your profile.",
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save demographics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">Academic & Regional Demographics</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Academic researchers calibrate studies to specific Nigerian student groups. Complete your profile to unlock high-paying 100% matched surveys.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* University */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Tertiary Institution / University
            </Label>
            <select
              value={form.university}
              onChange={(e) => handleUniversityChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border bg-background text-foreground"
            >
              {NIGERIAN_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Geopolitical Zone */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                Geopolitical Zone
              </Label>
              <select
                value={form.geopoliticalZone}
                onChange={(e) => setForm({ ...form, geopoliticalZone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border bg-background text-foreground"
              >
                {GEOPOLITICAL_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Level of Study */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5 font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                Academic Level
              </Label>
              <select
                value={form.levelOfStudy}
                onChange={(e) => setForm({ ...form, levelOfStudy: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border bg-background text-foreground"
              >
                {LEVELS_OF_STUDY.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Faculty */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                Faculty / Discipline
              </Label>
              <select
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border bg-background text-foreground"
              >
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Department / Course</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Computer Science, Economics"
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Living Arrangement */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5 font-semibold">
                <Home className="w-3.5 h-3.5 text-amber-500" />
                Campus Living Arrangement
              </Label>
              <select
                value={form.livingArrangement}
                onChange={(e) => setForm({ ...form, livingArrangement: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border bg-background text-foreground"
              >
                {LIVING_ARRANGEMENTS.map((la) => (
                  <option key={la} value={la}>{la}</option>
                ))}
              </select>
            </div>

            {/* Monthly Budget Tier */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5 font-semibold">
                <Wallet className="w-3.5 h-3.5 text-blue-500" />
                Monthly Budget Tier
              </Label>
              <select
                value={form.monthlyBudgetTier}
                onChange={(e) => setForm({ ...form, monthlyBudgetTier: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border bg-background text-foreground"
              >
                {MONTHLY_BUDGET_TIERS.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Your demographic data is aggregated anonymously for academic demographic research under NDPR compliance. It guarantees you are matched to eligible surveys.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSaving ? "Saving..." : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Demographic Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
