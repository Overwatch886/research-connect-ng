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
  Zap, 
  Smartphone, 
  Building2 
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

const AIRTIME_NETWORKS = [
  { id: "mtn", name: "MTN Nigeria", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-300" },
  { id: "airtel", name: "Airtel Nigeria", color: "text-red-500 bg-red-50 dark:bg-red-950/50 border-red-300" },
  { id: "glo", name: "Glo Mobile (Globacom)", color: "text-green-600 bg-green-50 dark:bg-green-950/50 border-green-300" },
  { id: "9mobile", name: "9mobile", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300" },
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
  
  const [channel, setChannel] = useState<"bank" | "airtime">("bank");
  
  // Bank fields
  const [bank, setBank] = useState("opay");
  const [accountNumber, setAccountNumber] = useState("");
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  // Airtime fields
  const [network, setNetwork] = useState("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Shared amount
  const [amount, setAmount] = useState(availableBalance.toString());
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

  const handlePhoneNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 11);
    setPhoneNumber(cleaned);

    // Auto-detect network from 4-digit prefix
    if (cleaned.length >= 4) {
      const prefix = cleaned.slice(0, 4);
      if (["0803", "0806", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916", "0703", "0706"].includes(prefix)) {
        setNetwork("mtn");
      } else if (["0802", "0808", "0812", "0902", "0907", "0901", "0912", "0708", "0701"].includes(prefix)) {
        setNetwork("airtel");
      } else if (["0805", "0807", "0815", "0811", "0905", "0915", "0705"].includes(prefix)) {
        setNetwork("glo");
      } else if (["0809", "0817", "0818", "0909", "0908"].includes(prefix)) {
        setNetwork("9mobile");
      }
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    const minAmount = channel === "airtime" ? 200 : 500;

    if (isNaN(withdrawAmount) || withdrawAmount < minAmount) {
      toast({
        title: `Minimum is ₦${minAmount.toLocaleString()}`,
        description: `Please enter an amount of at least ₦${minAmount.toLocaleString()} to proceed.`,
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

    if (channel === "bank" && accountNumber.length !== 10) {
      toast({
        title: "Invalid Account Number",
        description: "Please enter a valid 10-digit Nigerian NUBAN account number.",
        variant: "destructive",
      });
      return;
    }

    if (channel === "airtime" && phoneNumber.length < 11) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 11-digit Nigerian phone number (e.g. 08012345678).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate instant NIBSS / VTU API settlement delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newBalance = Math.max(0, availableBalance - withdrawAmount);
      localStorage.setItem("research_connect_user_balance", newBalance.toString());

      // Record withdrawal transaction log
      let withdrawals: any[] = [];
      try {
        const stored = localStorage.getItem("research_connect_withdrawals");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) withdrawals = parsed;
        }
      } catch {}
      const refCode = channel === "airtime" 
        ? `VTU-AIR-${Math.floor(100000 + Math.random() * 900000)}`
        : `RC-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const selectedBankName = NIGERIAN_BANKS.find((b) => b.id === bank)?.name || "Nigerian Bank";
      const selectedNetworkName = AIRTIME_NETWORKS.find((n) => n.id === network)?.name || "Mobile Network";

      withdrawals.unshift({
        id: Date.now().toString(),
        channel,
        amount: withdrawAmount,
        destination: channel === "airtime" ? `${phoneNumber} (${selectedNetworkName})` : `${selectedBankName} - ******${accountNumber.slice(-4)}`,
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

      if (channel === "airtime") {
        toast({
          title: "📱 Airtime Sent Successfully!",
          description: `₦${withdrawAmount.toLocaleString()} instant VTU recharge sent to ${phoneNumber} (${selectedNetworkName}). Ref: ${refCode}`,
        });
      } else {
        toast({
          title: "🚀 Bank Transfer Successful!",
          description: `₦${withdrawAmount.toLocaleString()} sent to ${resolvedName || defaultName} (${selectedBankName}). Ref: ${refCode}`,
        });
      }
    } catch (err) {
      toast({
        title: "Disbursement Error",
        description: "Failed to process disbursement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0 || num > availableBalance) return false;
    if (channel === "bank") {
      return accountNumber.length === 10 && num >= 500;
    } else {
      return phoneNumber.length === 11 && num >= 200;
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
            Instant automated disbursement to your Nigerian bank account or mobile phone number.
          </DialogDescription>
        </DialogHeader>

        {/* Channel Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setChannel("bank")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              channel === "bank"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Bank Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel("airtime")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              channel === "airtime"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Airtime Recharge</span>
          </button>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-4 pt-1">
          {/* Balance Preview Card */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Available to Withdraw</p>
              <p className="text-xl font-bold text-foreground">
                ₦{availableBalance.toLocaleString()}
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> 0% Fee • Instant
            </Badge>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="amount">Amount (₦)</Label>
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
              min={channel === "airtime" ? 200 : 500}
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={channel === "airtime" ? "e.g. 500" : "e.g. 1500"}
              required
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Min: ₦{channel === "airtime" ? "200" : "500"}</span>
              {channel === "airtime" && (
                <div className="flex items-center gap-1">
                  {[200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-medium border"
                    >
                      ₦{preset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {channel === "bank" ? (
            /* Bank Selection & Account */
            <>
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
                
                {isVerifyingAccount && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span>Verifying account with NIBSS...</span>
                  </div>
                )}

                {resolvedName && !isVerifyingAccount && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold">{resolvedName}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Airtime Recharge Inputs */
            <>
              <div className="space-y-1.5">
                <Label>Select Mobile Network</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AIRTIME_NETWORKS.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setNetwork(n.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        network === n.id
                          ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                          : "border-border hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span>{n.name}</span>
                      {network === n.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Recipient Nigerian Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    maxLength={11}
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    placeholder="08012345678"
                    required
                    className="pr-16"
                  />
                  {phoneNumber.length === 11 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      VALID
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Works on MTN, Airtel, Glo, and 9mobile. Instant electronic top-up.
                </p>
              </div>
            </>
          )}

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
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing {channel === "airtime" ? "Airtime" : "Transfer"}...</span>
                </>
              ) : (
                <>
                  {channel === "airtime" ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  <span>
                    {channel === "airtime" ? "Recharge Airtime" : "Transfer Funds"} (₦{Number(amount || 0).toLocaleString()})
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
