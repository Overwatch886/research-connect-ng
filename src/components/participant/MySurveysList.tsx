import { Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SurveyResponse, Survey } from "@/hooks/useSurveys";
import { formatDistanceToNow } from "date-fns";

interface MySurveysListProps {
  responses: (SurveyResponse & { surveys: Survey })[];
  onContinue: (responseId: string) => void;
}

export const MySurveysList = ({ responses, onContinue }: MySurveysListProps) => {
  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No surveys yet</h3>
          <p className="text-muted-foreground">
            Start taking surveys to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <Card key={response.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{response.surveys.title}</CardTitle>
                <CardDescription className="text-sm">
                  Started {formatDistanceToNow(new Date(response.started_at), { addSuffix: true })}
                </CardDescription>
              </div>
              <Badge 
                variant={response.status === "completed" ? "default" : "secondary"}
                className={response.status === "completed" ? "bg-green-600" : ""}
              >
                {response.status === "completed" ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" /> In Progress</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Reward: <span className="font-medium text-foreground">₦{response.surveys.reward_amount.toLocaleString()}</span>
                {response.status === "completed" && (
                  <Badge variant="outline" className="ml-2">
                    {response.reward_paid ? "Paid" : "Pending"}
                  </Badge>
                )}
              </div>
              {response.status === "in_progress" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => onContinue(response.id)}
                >
                  Continue <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
