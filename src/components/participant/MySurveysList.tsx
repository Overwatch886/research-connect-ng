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
      {responses.map((response) => {
        const title = response.surveys?.title || (response as any).survey_title || "Demographic Research Survey";
        const reward = response.surveys?.reward_amount ?? (response as any).reward_amount ?? 500;
        const rawDate = response.completed_at || response.started_at || new Date().toISOString();
        let formattedDate = "recently";
        try {
          formattedDate = formatDistanceToNow(new Date(rawDate), { addSuffix: true });
        } catch (e) {
          formattedDate = "recently";
        }

        return (
          <Card key={response.id} className="hover:border-border/80 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {response.status === "completed" ? "Completed" : "Started"} {formattedDate}
                  </CardDescription>
                </div>
                <Badge 
                  variant={response.status === "completed" ? "default" : "secondary"}
                  className={response.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium" : "bg-amber-100 text-amber-800 border-amber-300"}
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
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <span>Reward:</span>
                  <span className="font-bold text-foreground">₦{reward.toLocaleString()}</span>
                  {response.status === "completed" && (
                    <Badge variant="outline" className="ml-1 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                      {response.reward_paid ? "Credited to Wallet" : "Pending"}
                    </Badge>
                  )}
                </div>
                {response.status === "in_progress" ? (
                  <Button 
                    size="sm" 
                    className="gap-1 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
                    onClick={() => onContinue(response.surveys?.id || response.survey_id || response.id)}
                  >
                    Continue Survey <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-1 text-xs border-emerald-200 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
                    onClick={() => onContinue(response.surveys?.id || response.survey_id || response.id)}
                  >
                    Review Responses <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
