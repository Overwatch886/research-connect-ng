import { CheckCircle, Clock, Play, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SurveyResponse, Survey } from "@/hooks/useSurveys";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  responses: (SurveyResponse & { surveys: Survey })[];
}

type ActivityType = "started" | "completed" | "paid";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  amount: number;
  timestamp: string;
}

export const RecentActivity = ({ responses }: RecentActivityProps) => {
  // Generate activity items from responses
  const activities: Activity[] = responses
    .flatMap((response) => {
      const items: Activity[] = [];
      
      // Started activity
      items.push({
        id: `${response.id}-started`,
        type: "started",
        title: response.surveys.title,
        amount: response.surveys.reward_amount,
        timestamp: response.started_at,
      });
      
      // Completed activity
      if (response.status === "completed" && response.completed_at) {
        items.push({
          id: `${response.id}-completed`,
          type: "completed",
          title: response.surveys.title,
          amount: response.surveys.reward_amount,
          timestamp: response.completed_at,
        });
      }
      
      // Paid activity (if applicable)
      if (response.reward_paid && response.completed_at) {
        items.push({
          id: `${response.id}-paid`,
          type: "paid",
          title: response.surveys.title,
          amount: response.surveys.reward_amount,
          timestamp: response.completed_at, // Using completed_at as proxy
        });
      }
      
      return items;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "started":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "paid":
        return <DollarSign className="h-4 w-4 text-amber-500" />;
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case "started":
        return "Started";
      case "completed":
        return "Completed";
      case "paid":
        return "Paid";
    }
  };

  const getActivityBadgeVariant = (type: ActivityType): "default" | "secondary" | "outline" => {
    switch (type) {
      case "started":
        return "secondary";
      case "completed":
        return "default";
      case "paid":
        return "outline";
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your survey activity will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Your latest survey interactions</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="divide-y">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {activity.type !== "started" && (
                    <span className="text-sm font-medium text-green-600">
                      +₦{activity.amount}
                    </span>
                  )}
                  <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                    {getActivityLabel(activity.type)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
