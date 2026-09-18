import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Loader2, 
  CheckCircle2, 
  Coins, 
  ShieldCheck, 
  Bot, 
  User as UserIcon,
  Volume2
} from "lucide-react";
import { 
  conductConversationalStep, 
  ChatMessage, 
  GeneratedQuestion 
} from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ConversationalSurveyorProps {
  surveyId: string;
  surveyTitle: string;
  rewardAmount: number;
  questions: GeneratedQuestion[];
  onFinish?: () => void;
}

export const ConversationalSurveyor = ({
  surveyId,
  surveyTitle,
  rewardAmount,
  questions,
  onFinish,
}: ConversationalSurveyorProps) => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Initialize opening greeting
  useEffect(() => {
    const firstQ = questions[0];
    const initialGreeting = `Hello! 👋 I'm Ada, your AI conversational interviewer for today's study on "${surveyTitle}".
We want to understand your real personal experiences. To start us off:
${firstQ?.title || "How has your daily routine on campus been recently?"}`;

    setMessages([
      {
        id: "m-init",
        sender: "ai",
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [surveyTitle, questions]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Voice speech-to-text integration
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech-to-text. Please type your response.",
      });
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-NG"; // Nigerian English accent support

      recognition.onstart = () => {
        setIsListening(true);
        toast({ title: "Listening...", description: "Speak your response into your microphone." });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isThinking || isCompleted) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    try {
      const step = await conductConversationalStep(
        surveyTitle,
        questions,
        [...messages, userMsg],
        text,
        currentQIndex
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: step.aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCurrentQIndex(step.nextQuestionIndex);

      if (step.isFinished) {
        // Payout credit
        const currentBalance = Number(localStorage.getItem("research_connect_user_balance") || "1500");
        const updated = currentBalance + rewardAmount;
        localStorage.setItem("research_connect_user_balance", updated.toString());

        // Save response
        const recorded = JSON.parse(localStorage.getItem("research_connect_recorded_responses") || "[]");
        recorded.push({
          id: Date.now().toString(),
          survey_id: surveyId,
          survey_title: surveyTitle,
          chat_history: [...messages, userMsg, aiMsg],
          reward_amount: rewardAmount,
          reward_paid: true,
          completed_at: new Date().toISOString(),
        });
        localStorage.setItem("research_connect_recorded_responses", JSON.stringify(recorded));

        setIsCompleted(true);
        toast({
          title: "🎉 Survey Completed & Rewarded!",
          description: `₦${rewardAmount.toLocaleString()} credited to your student wallet.`,
        });
        if (onFinish) onFinish();
      }
    } catch (err) {
      toast({
        title: "Communication Error",
        description: "Failed to connect to survey assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsThinking(false);
    }
  };

  const progressPercent = Math.min(
    Math.round(((currentQIndex + 1) / Math.max(questions.length, 1)) * 100),
    100
  );

  return (
    <div className="flex flex-col h-[650px] bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-muted/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-background absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">Ada • AI Field Researcher</h3>
              <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                Gemini 1.5 Flash
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
              {surveyTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 font-semibold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <Coins className="w-3 h-3" /> +₦{rewardAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm"
              }`}
            >
              {msg.sender === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                  : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              <span
                className={`text-[10px] block mt-1 ${
                  msg.sender === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-start gap-2.5 max-w-[75%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Ada is analyzing your response and formulating the next point...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Completion Banner or Input Area */}
      {isCompleted ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Interview finished! ₦{rewardAmount.toLocaleString()} credited to your student wallet.</span>
          </div>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <Link to="/surveys">Browse More Surveys</Link>
          </Button>
        </div>
      ) : (
        <div className="p-3 sm:p-4 bg-card border-t border-border space-y-2">
          {/* Quick Option Chips (if multiple choice exists on current question) */}
          {questions[currentQIndex]?.options && (
            <div className="flex flex-wrap gap-1.5 pb-1 max-h-20 overflow-y-auto">
              {questions[currentQIndex].options!.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setInputText(opt)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/50 text-foreground transition-colors text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleSpeechRecognition}
              className={`shrink-0 ${isListening ? "text-rose-600 border-rose-500 animate-pulse bg-rose-50" : ""}`}
              title="Voice Input (Speech-to-text)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-600" />}
            </Button>

            <Input
              placeholder={isListening ? "Listening to your voice..." : "Type your natural response here..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isThinking || isCompleted}
              className="text-sm py-2 flex-1"
              autoFocus
            />

            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isThinking || isCompleted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Dynamic follow-ups powered by Gemini 1.5 Flash
            </span>
            <span>Question {Math.min(currentQIndex + 1, questions.length)} of {questions.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
