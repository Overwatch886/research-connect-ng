import { Clock, DollarSign, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Survey } from "@/hooks/useSurveys";

interface SurveyCardProps {
  survey: Survey;
  onStart: (surveyId: string) => void;
  isStarting: boolean;
  hasStarted?: boolean;
}

export const SurveyCard = ({ survey, onStart, isStarting, hasStarted }: SurveyCardProps) => {
  const spotsRemaining = survey.max_responses 
    ? survey.max_responses - survey.current_responses 
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{survey.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {survey.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            ₦{survey.reward_amount.toLocaleString()}
          </Badge>
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
        {hasStarted ? (
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
