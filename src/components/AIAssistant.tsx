import { useState } from "react";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface AIAssistantProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export const AIAssistant = ({ onGenerate, isGenerating }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(true); // Default open if triggered by parent
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt);
    setPrompt(""); 
  };

  // If closed internally, show nothing (Parent controls re-opening via Toolbar)
  if (!isOpen) return null;

  return (
    <Card className="w-80 p-4 shadow-2xl border-slate-200 bg-white/95 backdrop-blur animate-in fade-in slide-in-from-left-5">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>AI Assistant</span>
        </div>
        {/* We rely on parent close button mostly, but this works locally too */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 hover:bg-slate-100 rounded-full"
          onClick={() => setIsOpen(false)} 
        >
          <X className="w-4 h-4 text-slate-500" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* FIX: Force text color to slate-900 (dark) so it's visible on white bg */}
        <Textarea
          placeholder="Describe a diagram (e.g. 'Login flow')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="resize-none h-24 text-sm bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Generate Diagram
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};