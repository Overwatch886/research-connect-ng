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
}

export const SurveyCard = ({ survey, onStart, isStarting, hasStarted, hasCompleted }: SurveyCardProps) => {
  const spotsRemaining = survey.max_responses 
    ? survey.max_responses - survey.current_responses 
    : null;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${hasCompleted ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/10" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{survey.title}</CardTitle>
            </div>
            <CardDescription className="line-clamp-2">
              {survey.description || "No description provided"}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
              ₦{survey.reward_amount.toLocaleString()}
            </Badge>
            {hasCompleted && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{survey.estimated_time} mins</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span>₦{survey.reward_amount}</span>
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
            className="w-full gap-2 border-emerald-300 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 font-medium"
            onClick={() => onStart(survey.id)}
            disabled={isStarting}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isStarting ? "Opening..." : "Completed • Review / Retake"}</span>
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
