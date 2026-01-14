import { TrendingUp, Wallet, ArrowUpRight, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface EarningsCardProps {
  totalEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  completedSurveys: number;
  onWithdraw: () => void;
  isWithdrawing?: boolean;
}

export const EarningsCard = ({
  totalEarnings,
  pendingBalance,
  availableBalance,
  completedSurveys,
  onWithdraw,
  isWithdrawing,
}: EarningsCardProps) => {
  const minimumWithdrawal = 1000;
  const canWithdraw = availableBalance >= minimumWithdrawal;
  const progressToWithdraw = Math.min((availableBalance / minimumWithdrawal) * 100, 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardDescription className="text-muted-foreground mb-1">Available Balance</CardDescription>
            <CardTitle className="text-3xl font-bold">
              ₦{availableBalance.toLocaleString()}
            </CardTitle>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Total Earned
            </p>
            <p className="font-semibold">₦{totalEarnings.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </p>
            <p className="font-semibold text-amber-600">₦{pendingBalance.toLocaleString()}</p>
          </div>
        </div>

        <Separator />

        {/* Withdrawal Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Minimum withdrawal</span>
            <span className="font-medium">₦{minimumWithdrawal.toLocaleString()}</span>
          </div>
          
          {!canWithdraw && (
            <div className="space-y-2">
              <Progress value={progressToWithdraw} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                ₦{(minimumWithdrawal - availableBalance).toLocaleString()} more to unlock withdrawal
              </p>
            </div>
          )}

          <Button 
            className="w-full gap-2" 
            disabled={!canWithdraw || isWithdrawing}
            onClick={onWithdraw}
          >
            <CreditCard className="h-4 w-4" />
            {isWithdrawing ? "Processing..." : "Withdraw Funds"}
            {canWithdraw && <ArrowUpRight className="h-4 w-4" />}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Withdrawals are processed within 24-48 hours
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
