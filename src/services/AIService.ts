import { generateGeminiResponse } from '../lib/gemini';

// --- SET THIS TO FALSE TO USE REAL AI ---
const USE_MOCK_MODE = false; 

export const generateDiagram = async (prompt: string): Promise<string> => {
  console.log("ThinkBoard AI Request:", prompt);

  const systemPrompt = `You are an expert diagram generator for ThinkBoard.
  1. Your GOAL is to return valid Graphviz DOT code.
  2. Return ONLY the code starting with 'digraph G {'.
  3. Do NOT use markdown formatting (no \`\`\` backticks).
  4. Use professional colors: fillcolor="#e3f2fd", color="#1e88e5", fontname="Arial".
  5. If the user asks for a flowchart, use rectangular nodes.`;

  if (USE_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 1000));
    return `digraph G { Mock -> Mode }`; 
  }

  try {
    const response = await generateGeminiResponse(prompt, systemPrompt);
    
    // Clean up the output
    const cleanDot = response
      .replace(/```dot/g, '')
      .replace(/```/g, '')
      .trim();

    return cleanDot;

  } catch (error) {
    console.error("AI Generation Error:", error);
    return `digraph G { 
      rankdir=LR;
      node [style=filled, shape=box, fillcolor="#ffcdd2", color="#c62828"];
      Error [label="Connection Failed"];
      "Check Console" [fillcolor="#fff9c4"];
      Error -> "Check Console";
    }`;
  }
};