import { Link } from "react-router-dom";
import { ShieldAlert, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

interface UnverifiedStudentBannerProps {
  className?: string;
}

export const UnverifiedStudentBanner = ({ className = "" }: UnverifiedStudentBannerProps) => {
  const { profile, isLoading } = useProfile();

  if (isLoading || !profile || profile.is_verified) {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-4 sm:p-4.5 text-foreground shadow-sm ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-4 ring-amber-500/5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span>Student Verification Pending</span>
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                Action Required
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed max-w-2xl">
              Your Nigerian tertiary institution profile is unverified. Verify your student email or student ID card to participate in institutional research and receive instant cash rewards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:self-center pl-13 sm:pl-0">
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm gap-1.5 h-8.5 px-3.5"
            asChild
          >
            <Link to="/verify-student">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Verify Student Status</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnverifiedStudentBanner;
