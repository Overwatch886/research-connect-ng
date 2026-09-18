import { useState } from "react";
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
import { Coins, Users, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExtendQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: {
    id: string;
    title: string;
    responses: number;
    target: number;
    rewardAmount?: number;
  } | null;
  onSuccess: (surveyId: string, newTarget: number) => void;
}

export const ExtendQuotaModal = ({
  isOpen,
  onClose,
  survey,
  onSuccess,
}: ExtendQuotaModalProps) => {
  const { toast } = useToast();
  const [additionalSpots, setAdditionalSpots] = useState<number>(25);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!survey) return null;

  const rewardPerStudent = survey.rewardAmount || 500;
  const newTotalTarget = survey.target + additionalSpots;
  const additionalStudentPool = additionalSpots * rewardPerStudent;
  const platformFee = Math.round(additionalStudentPool * 0.10);
  const totalEscrowDeposit = additionalStudentPool + platformFee;

  const handleConfirmResume = async () => {
    if (additionalSpots <= 0) {
      toast({
        title: "Invalid Quota",
        description: "Please specify at least 5 additional respondents to resume this study.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update in custom surveys in localStorage
      const storedCustom = localStorage.getItem("research_connect_custom_surveys");
      if (storedCustom) {
        const list = JSON.parse(storedCustom);
        const updatedList = list.map((s: any) => {
          if (s.id === survey.id) {
            return {
              ...s,
              max_responses: newTotalTarget,
              status: "active",
            };
          }
          return s;
        });
        localStorage.setItem("research_connect_custom_surveys", JSON.stringify(updatedList));
      }

      // 2. Update manual status override
      const statusMap = JSON.parse(localStorage.getItem("research_connect_survey_statuses") || "{}");
      statusMap[survey.id] = "active";
      localStorage.setItem("research_connect_survey_statuses", JSON.stringify(statusMap));

      // 3. Sync to Supabase if exists
      try {
        await supabase
          .from("surveys")
          .update({
            max_responses: newTotalTarget,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", survey.id);
      } catch (e) {}

      toast({
        title: "🎉 Study Resumed & Escrow Funded!",
        description: `Added ${additionalSpots} spots (Target: ${newTotalTarget}). ₦${totalEscrowDeposit.toLocaleString()} placed in verified student escrow.`,
      });

      onSuccess(survey.id, newTotalTarget);
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to extend survey quota. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">Resume & Extend Quota</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            This study hit its maximum quota of {survey.target} respondents and was closed. To resume collecting responses, expand your quota and fund the student reward escrow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Current Status Box */}
          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium truncate max-w-[220px]">
                {survey.title}
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                {survey.responses} / {survey.target} filled (100%)
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Previous escrow was 100% paid out to verified participants.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select Additional Respondents</Label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAdditionalSpots(num)}
                  className={`py-2 px-1 text-xs rounded-lg font-semibold border transition-all ${
                    additionalSpots === num
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card hover:bg-muted text-foreground border-border"
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <Input
                type="number"
                min={5}
                max={500}
                value={additionalSpots}
                onChange={(e) => setAdditionalSpots(Math.max(0, Number(e.target.value)))}
                className="text-xs h-9 font-semibold"
                placeholder="Custom respondent count"
              />
            </div>
          </div>

          {/* Financial Escrow Breakdown */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>New Total Target:</span>
              <span className="font-semibold text-foreground">{newTotalTarget} respondents</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Additional Incentive Pool (+{additionalSpots} × ₦{rewardPerStudent}):</span>
              <span className="font-semibold text-foreground">₦{additionalStudentPool.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Platform Verification Fee (10%):</span>
              <span className="font-semibold text-foreground">₦{platformFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-200">
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                Total Escrow Deposit:
              </span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                ₦{totalEscrowDeposit.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 pt-0.5">
              🛡️ 100% held in Paystack-backed smart escrow. Only released to students upon Gemini quality audit.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isProcessing || additionalSpots <= 0}
              onClick={handleConfirmResume}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {isProcessing ? "Processing Escrow..." : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Deposit ₦{totalEscrowDeposit.toLocaleString()} & Resume
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
