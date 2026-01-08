import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  ArrowLeft,
  Plus,
  GripVertical,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Star,
  Hash,
  Calendar,
  Upload,
  Trash2,
  Copy,
  Settings,
  Eye,
  Save
} from "lucide-react";

type QuestionType = "short" | "long" | "multiple" | "checkbox" | "dropdown" | "rating" | "number" | "date" | "file";

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
}

const questionTypes = [
  { type: "short" as const, icon: Type, label: "Short Answer" },
  { type: "long" as const, icon: AlignLeft, label: "Long Answer" },
  { type: "multiple" as const, icon: Circle, label: "Multiple Choice" },
  { type: "checkbox" as const, icon: CheckSquare, label: "Checkboxes" },
  { type: "dropdown" as const, icon: List, label: "Dropdown" },
  { type: "rating" as const, icon: Star, label: "Rating Scale" },
  { type: "number" as const, icon: Hash, label: "Number" },
  { type: "date" as const, icon: Calendar, label: "Date" },
  { type: "file" as const, icon: Upload, label: "File Upload" },
];

const CreateSurvey = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      type: "short",
      title: "What is your name?",
      required: true
    }
  ]);
  const [activeQuestion, setActiveQuestion] = useState<string | null>("1");

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: "Untitled Question",
      required: false,
      options: type === "multiple" || type === "checkbox" || type === "dropdown" 
        ? ["Option 1", "Option 2"] 
        : undefined
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQuestion === id) {
      setActiveQuestion(null);
    }
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const newQuestion = { ...question, id: Date.now().toString() };
      const index = questions.findIndex(q => q.id === id);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <input
                type="text"
                placeholder="Untitled Survey"
                className="font-display text-xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save & Publish
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Editor */}
        <main className="flex-1 p-8 max-w-3xl mx-auto">
          {/* Survey Header Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6 border-t-4 border-t-primary">
            <input
              type="text"
              placeholder="Survey Title"
              className="w-full font-display text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Add a description (optional)"
              className="w-full bg-transparent border-none outline-none text-muted-foreground resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Questions */}
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`bg-card rounded-xl border-2 p-6 mb-4 transition-all ${
                activeQuestion === question.id 
                  ? "border-primary shadow-large" 
                  : "border-border"
              }`}
              onClick={() => setActiveQuestion(question.id)}
            >
              <div className="flex items-start gap-4">
                <div className="pt-2 cursor-grab">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="flex-1 space-y-4">
                  {/* Question Title */}
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Question"
                      className="flex-1 text-lg font-medium bg-transparent border-none outline-none text-foreground"
                      value={question.title}
                      onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {questionTypes.find(t => t.type === question.type)?.label}
                    </span>
                  </div>

                  {/* Question Options (for multiple choice, etc.) */}
                  {question.options && (
                    <div className="space-y-2 pl-6">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          {question.type === "multiple" && (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                          {question.type === "checkbox" && (
                            <CheckSquare className="w-5 h-5 text-muted-foreground" />
                          )}
                          {question.type === "dropdown" && (
                            <span className="text-muted-foreground text-sm">{optIndex + 1}.</span>
                          )}
                          <input
                            type="text"
                            className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none py-1"
                            value={option}
                            onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          />
                          {question.options!.length > 2 && (
                            <button
                              onClick={() => removeOption(question.id, optIndex)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(question.id)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add option
                      </button>
                    </div>
                  )}

                  {/* Preview for other types */}
                  {question.type === "short" && (
                    <div className="pl-6">
                      <div className="w-1/2 h-10 border-b border-border" />
                    </div>
                  )}
                  {question.type === "long" && (
                    <div className="pl-6">
                      <div className="w-full h-24 border border-border rounded-lg" />
                    </div>
                  )}
                  {question.type === "rating" && (
                    <div className="pl-6 flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground">
                          {n}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Question Actions */}
                  {activeQuestion === question.id && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => duplicateQuestion(question.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>

        {/* Question Types Sidebar */}
        <aside className="w-72 p-6 border-l border-border bg-background hidden lg:block">
          <h3 className="font-display font-semibold text-foreground mb-4">Add Question</h3>
          <div className="grid grid-cols-2 gap-2">
            {questionTypes.map((type) => (
              <button
                key={type.type}
                onClick={() => addQuestion(type.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <type.icon className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground">{type.label}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreateSurvey;
