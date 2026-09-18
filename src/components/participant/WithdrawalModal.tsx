import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  CreditCard, 
  Loader2, 
  ShieldCheck, 
  Zap 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onWithdrawSuccess: (newBalance: number) => void;
  defaultName?: string;
}

const NIGERIAN_BANKS = [
  { id: "opay", name: "OPay Digital Services (Paycom)", code: "999992" },
  { id: "palmpay", name: "PalmPay Ltd", code: "999991" },
  { id: "kuda", name: "Kuda Microfinance Bank", code: "50211" },
  { id: "moniepoint", name: "Moniepoint MFB", code: "50515" },
  { id: "gtb", name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { id: "access", name: "Access Bank", code: "044" },
  { id: "zenith", name: "Zenith Bank", code: "057" },
  { id: "uba", name: "United Bank for Africa (UBA)", code: "033" },
  { id: "firstbank", name: "First Bank of Nigeria", code: "011" },
  { id: "stanbic", name: "Stanbic IBTC Bank", code: "221" },
];

export const WithdrawalModal = ({
  isOpen,
  onClose,
  availableBalance,
  onWithdrawSuccess,
  defaultName = "STUDENT ACCOUNT",
}: WithdrawalModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [bank, setBank] = useState("opay");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState(availableBalance.toString());
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-resolve simulated account name when 10 digits entered
  const handleAccountNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(cleaned);

    if (cleaned.length === 10) {
      setIsVerifyingAccount(true);
      setTimeout(() => {
        setIsVerifyingAccount(false);
        const resolved = defaultName.toUpperCase();
        setResolvedName(resolved);
      }, 500);
    } else {
      setResolvedName(null);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 500) {
      toast({
        title: "Minimum Withdrawal is ₦500",
        description: "Please enter an amount of at least ₦500 to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ₦${availableBalance.toLocaleString()} available.`,
        variant: "destructive",
      });
      return;
    }

    if (accountNumber.length !== 10) {
      toast({
        title: "Invalid Account Number",
        description: "Please enter a valid 10-digit Nigerian NUBAN account number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate instant NIBSS / Paystack settlement delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newBalance = Math.max(0, availableBalance - withdrawAmount);
      localStorage.setItem("research_connect_user_balance", newBalance.toString());

      // Record withdrawal transaction log
      const selectedBankName = NIGERIAN_BANKS.find((b) => b.id === bank)?.name || "Nigerian Bank";
      const withdrawals = JSON.parse(localStorage.getItem("research_connect_withdrawals") || "[]");
      const refCode = `RC-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
      
      withdrawals.unshift({
        id: Date.now().toString(),
        amount: withdrawAmount,
        bank: selectedBankName,
        account_number: `******${accountNumber.slice(-4)}`,
        account_name: resolvedName || defaultName,
        reference: refCode,
        timestamp: new Date().toISOString(),
        status: "success",
      });
      localStorage.setItem("research_connect_withdrawals", JSON.stringify(withdrawals));

      // Sync updated balance to Supabase profile if logged in
      if (user?.id) {
        try {
          await supabase
            .from("profiles")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } catch (supaErr) {
          console.warn("Could not sync withdrawal to profile:", supaErr);
        }
      }

      onWithdrawSuccess(newBalance);
      onClose();

      toast({
        title: "🚀 Transfer Successful!",
        description: `₦${withdrawAmount.toLocaleString()} has been sent to ${resolvedName || defaultName} (${selectedBankName}). Ref: ${refCode}`,
      });
    } catch (err) {
      toast({
        title: "Disbursement Error",
        description: "Failed to disburse funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Withdraw Earnings</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Instant automated disbursement to your Nigerian bank account or mobile wallet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleWithdraw} className="space-y-4 pt-2">
          {/* Balance Preview Card */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Available to Withdraw</p>
              <p className="text-xl font-bold text-foreground">
                ₦{availableBalance.toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> 0% Payout Fee
            </Badge>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => setAmount(availableBalance.toString())}
              >
                Withdraw All (₦{availableBalance.toLocaleString()})
              </button>
            </div>
            <Input
              id="amount"
              type="number"
              min={500}
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              required
            />
            <p className="text-[11px] text-muted-foreground">Minimum withdrawal: ₦500</p>
          </div>

          {/* Bank selector */}
          <div className="space-y-1.5">
            <Label htmlFor="bank">Destination Bank / Fintech</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger id="bank">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_BANKS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber">10-Digit NUBAN Account Number</Label>
            <Input
              id="accountNumber"
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => handleAccountNumberChange(e.target.value)}
              placeholder="0123456789"
              required
            />
            
            {/* Account name resolution simulation */}
            {isVerifyingAccount && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span>Verifying account details with NIBSS...</span>
              </div>
            )}

            {resolvedName && !isVerifyingAccount && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">{resolvedName}</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
              disabled={isSubmitting || !accountNumber || accountNumber.length < 10 || Number(amount) < 500}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Confirm & Transfer ₦{Number(amount || 0).toLocaleString()}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
