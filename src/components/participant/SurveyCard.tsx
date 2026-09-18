import { Clock, DollarSign, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Survey } from "@/hooks/useSurveys";

interface SurveyCardProps {
  survey: Survey;
  onStart: (surveyId: string) => void;
  isStarting: boolean;
  hasStarted?: boolean;
  hasCompleted?: boolean;
  matchInfo?: {
    isMatch: boolean;
    matchReason: string;
  };
}

export const SurveyCard = ({ 
  survey, 
  onStart, 
  isStarting, 
  hasStarted, 
  hasCompleted,
  matchInfo 
}: SurveyCardProps) => {
  const spotsRemaining = survey.max_responses 
    ? survey.max_responses - survey.current_responses 
    : null;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${hasCompleted ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/10" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{survey.title}</CardTitle>
              {matchInfo && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1 shrink-0 ${
                    matchInfo.isMatch
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  <span>{matchInfo.isMatch ? "🎯" : "🔒"}</span>
                  <span>{matchInfo.matchReason}</span>
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {survey.description || "No description provided"}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
              ₦{(survey.reward_amount ?? 500).toLocaleString()}
            </Badge>
            {hasCompleted && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submitted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{survey.estimated_time ?? 5} mins</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span>₦{survey.reward_amount ?? 500}</span>
          </div>
          
          {spotsRemaining !== null && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{spotsRemaining} spots left</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        {hasCompleted ? (
          <Button 
            variant="outline"
            className="w-full gap-2 border-emerald-300 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 font-medium cursor-default opacity-85"
            disabled={true}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>✓ Response Submitted</span>
          </Button>
        ) : hasStarted ? (
          <Button 
            className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium"
            onClick={() => onStart(survey.id)}
            disabled={isStarting}
          >
            {isStarting ? "Resuming..." : "Continue Survey"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : matchInfo && !matchInfo.isMatch ? (
          <Button 
            variant="outline"
            className="w-full gap-2 border-muted-foreground/30 text-muted-foreground bg-muted/40 font-medium cursor-not-allowed"
            disabled={true}
          >
            <span>🔒 Ineligible for Your Demographic Profile</span>
          </Button>
        ) : (
          <Button 
            className="w-full gap-2" 
            onClick={() => onStart(survey.id)}
            disabled={isStarting}
          >
            {isStarting ? "Starting..." : "Start Survey"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
