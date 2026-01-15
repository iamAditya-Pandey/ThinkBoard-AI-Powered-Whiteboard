import { Canvas } from "@/components/Canvas";
import { Logo } from "@/components/ui/Logo"; 
import { Github, PenTool } from "lucide-react";

const Index = () => {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-slate-50 dark:bg-[#111827]">
      
      {/* 1. Logo (Fixed Top Left) */}
      <div className="fixed top-6 left-6 z-50 pointer-events-none">
        <div className="pointer-events-auto">
           <Logo />
        </div>
      </div>

      {/* 2. Main Canvas */}
      {/* The Canvas component now internally handles the Toolbar, AI Assistant, and Shape Logic */}
      <Canvas />

       {/* 3. Footer (Fixed Bottom Right) */}
       <div className="fixed bottom-4 right-6 z-50 flex items-center gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <a
                href="https://github.com/iamAditya-Pandey"
                target="_blank"
                rel="noreferrer"
                className="bg-white/90 dark:bg-gray-800 backdrop-blur border border-slate-200 dark:border-gray-700 shadow-lg p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"
            >
                <Github className="w-4 h-4 text-slate-700 dark:text-white" />
            </a>

            <div className="bg-white/90 dark:bg-gray-800 backdrop-blur border border-slate-200 dark:border-gray-700 shadow-lg px-4 py-2 rounded-full text-xs text-slate-600 dark:text-gray-300 flex items-center gap-2 font-semibold">
                <PenTool className="w-3 h-3 text-blue-600" />
                <span>ThinkBoard © 2025 | Designed by Aditya Pandey</span>
            </div>
          </div>
       </div>

    </div>
  );
};

export default Index;