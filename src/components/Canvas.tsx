import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Toolbar } from "./Toolbar";
import { AIAssistant } from "./AIAssistant";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

// Define Tools
export type Tool = 
  | "select" | "draw" | "eraser" | "rectangle" | "circle" 
  | "line" | "text" | "triangle" | "diamond" | "pentagon" 
  | "hexagon" | "star";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  // -- REFS (Instant Access for Drawing) --
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const activeShapeRef = useRef<fabric.Object | null>(null);
  const isHistoryProcessing = useRef(false);

  // -- STATE --
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [activeColor, setActiveColor] = useState("#1e40af");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showAI, setShowAI] = useState(false);
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { theme } = useTheme(); 

  // Helper: Theme Colors
  const getThemeColor = (color: string) => {
    if (["#000000", "#ffffff"].includes(color)) {
      return theme === 'dark' ? '#ffffff' : '#000000';
    }
    return color;
  };

  // --- SHAPE MATH (Restored) ---
  const getPolygonPoints = (shapeType: string, cx: number, cy: number, w: number, h: number) => {
    const radius = Math.max(w, h) / 2;
    const points = [];
    
    if (shapeType === "star") {
      const innerRadius = radius * 0.5;
      for (let i = 0; i < 5; i++) {
        points.push({
          x: cx + radius * Math.cos((18 + i * 72) * Math.PI / 180),
          y: cy - radius * Math.sin((18 + i * 72) * Math.PI / 180)
        });
        points.push({
          x: cx + innerRadius * Math.cos((54 + i * 72) * Math.PI / 180),
          y: cy - innerRadius * Math.sin((54 + i * 72) * Math.PI / 180)
        });
      }
    } else {
      const sides = shapeType === "pentagon" ? 5 : shapeType === "hexagon" ? 6 : 4; 
      for (let i = 0; i < sides; i++) {
        const angle = 2 * Math.PI * i / sides - (Math.PI / 2);
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle)
        });
      }
    }
    return points;
  };

  // --- HISTORY LOGIC ---
  const saveHistory = (canvas: fabric.Canvas) => {
    if (isHistoryProcessing.current) return;
    const json = JSON.stringify(canvas.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndex <= 0) return;

    isHistoryProcessing.current = true;
    const newIndex = historyIndex - 1;
    const prevState = history[newIndex];

    canvas.loadFromJSON(prevState, () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      isHistoryProcessing.current = false;
      toast({ title: "Undo", description: "Step back" });
    });
  };

  const handleZoom = (dir: 'in' | 'out') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    let zoom = canvas.getZoom();
    zoom = dir === 'in' ? zoom * 1.1 : zoom / 1.1;
    if (zoom > 20) zoom = 20; if (zoom < 0.01) zoom = 0.01;
    canvas.setZoom(zoom);
    canvas.requestRenderAll();
  };

  const handleDownload = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'thinkboard.png';
    link.href = dataURL;
    link.click();
  };

  // --- 1. INITIALIZE ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: theme === 'dark' ? '#111827' : '#f8fafc',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    saveHistory(canvas);

    canvas.on('object:modified', () => saveHistory(canvas));
    canvas.on('path:created', () => saveHistory(canvas)); 

    const handleResize = () => {
      canvas.setDimensions({ width: window.innerWidth, height: window.innerHeight });
      canvas.renderAll();
    };
    window.addEventListener('resize', handleResize);

    // KEYBOARD SHORTCUTS
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObj = canvas.getActiveObject();
        // @ts-ignore
        if (activeObj && !activeObj.isEditing) {
          canvas.remove(activeObj);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          saveHistory(canvas);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.dispose();
    };
  }, []);

  // --- 2. UPDATE THEME & TOOL ---
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = theme === 'dark' ? '#111827' : '#f8fafc';
    
    // Update Objects color on theme switch
    canvas.getObjects().forEach((obj) => {
        if (obj.stroke === '#000000' || obj.stroke === '#ffffff') obj.set('stroke', theme === 'dark' ? '#ffffff' : '#000000');
        if (obj.fill === '#000000' || obj.fill === '#ffffff') obj.set('fill', theme === 'dark' ? '#ffffff' : '#000000');
    });
    canvas.requestRenderAll();
  }, [theme]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = activeTool === "select";
    
    if (activeTool === "select") canvas.defaultCursor = "default";
    else if (activeTool === "eraser") canvas.defaultCursor = "not-allowed";
    else canvas.defaultCursor = "crosshair";

    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.width = strokeWidth;
      brush.color = getThemeColor(activeColor);
      canvas.freeDrawingBrush = brush;
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [activeTool, activeColor, strokeWidth, theme]);

  // --- 3. DRAWING INTERACTION (Ref-Based for Speed) ---
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const onMouseDown = (opt: any) => {
      const pointer = canvas.getPointer(opt.e);
      const target = canvas.findTarget(opt.e);

      // ERASER
      if (activeTool === "eraser") {
        if (target) {
          canvas.remove(target);
          canvas.requestRenderAll();
          saveHistory(canvas);
        }
        return;
      }

      // TEXT
      if (activeTool === "text" && !target) {
        const text = new fabric.IText("Type here", {
          left: pointer.x, top: pointer.y,
          fill: getThemeColor(activeColor), fontSize: 20, fontFamily: "Arial"
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        saveHistory(canvas);
        setActiveTool("select"); // Text needs to switch to select to edit
        return;
      }

      // SHAPES
      if (!["select", "draw", "text", "eraser"].includes(activeTool) && !target) {
        isDrawingRef.current = true;
        startPointRef.current = { x: pointer.x, y: pointer.y };

        let shape: fabric.Object | null = null;
        const opts = {
          left: pointer.x, top: pointer.y, width: 0, height: 0,
          fill: "transparent", stroke: getThemeColor(activeColor), strokeWidth: strokeWidth,
          selectable: false, evented: false
        };

        if (activeTool === "rectangle") shape = new fabric.Rect(opts);
        else if (activeTool === "circle") shape = new fabric.Ellipse({ ...opts, rx: 0, ry: 0 });
        else if (activeTool === "triangle") shape = new fabric.Triangle(opts);
        else if (activeTool === "line") shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], opts);
        
        // Polygons (Star, Diamond, etc.) start as dummy rects
        else shape = new fabric.Rect(opts); 

        if (shape) {
          canvas.add(shape);
          activeShapeRef.current = shape;
        }
      }
    };

    const onMouseMove = (opt: any) => {
      if (!isDrawingRef.current || !activeShapeRef.current || !startPointRef.current) return;
      
      const pointer = canvas.getPointer(opt.e);
      const startX = startPointRef.current.x;
      const startY = startPointRef.current.y;
      const w = Math.abs(pointer.x - startX);
      const h = Math.abs(pointer.y - startY);
      
      if (activeTool === "rectangle" || activeTool === "triangle") {
        activeShapeRef.current.set({ width: w, height: h });
        if (pointer.x < startX) activeShapeRef.current.set({ left: pointer.x });
        if (pointer.y < startY) activeShapeRef.current.set({ top: pointer.y });
      } 
      else if (activeTool === "circle") {
        (activeShapeRef.current as fabric.Ellipse).set({ rx: w/2, ry: h/2 });
        if (pointer.x < startX) activeShapeRef.current.set({ left: pointer.x });
        if (pointer.y < startY) activeShapeRef.current.set({ top: pointer.y });
      }
      else if (activeTool === "line") {
        (activeShapeRef.current as fabric.Line).set({ x2: pointer.x, y2: pointer.y });
      }
      // --- COMPLEX SHAPES (The Fix) ---
      else if (["star", "diamond", "pentagon", "hexagon"].includes(activeTool)) {
        canvas.remove(activeShapeRef.current);
        const cx = startX + (pointer.x - startX)/2;
        const cy = startY + (pointer.y - startY)/2;
        const points = getPolygonPoints(activeTool, cx, cy, w, h);
        
        const newShape = new fabric.Polygon(points, {
          fill: "transparent", stroke: getThemeColor(activeColor), strokeWidth: strokeWidth,
          selectable: false, evented: false
        });
        canvas.add(newShape);
        activeShapeRef.current = newShape;
      }
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (isDrawingRef.current && activeShapeRef.current) {
        activeShapeRef.current.set({ selectable: true, evented: true });
        activeShapeRef.current.setCoords();
        canvas.setActiveObject(activeShapeRef.current);
        
        isDrawingRef.current = false;
        startPointRef.current = null;
        activeShapeRef.current = null;
        
        saveHistory(canvas);
        // Tool stays active! (Removed setActiveTool("select"))
      }
    };

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);

    return () => {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [activeTool, activeColor, strokeWidth, theme]); 

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-auto max-w-[90%]">
        <Toolbar 
          activeTool={activeTool}
          onToolClick={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          onShowAI={() => setShowAI(true)}
          onClear={() => { fabricCanvasRef.current?.clear(); fabricCanvasRef.current?.setBackgroundColor(theme === 'dark' ? '#111827' : '#f8fafc', () => {}); saveHistory(fabricCanvasRef.current!); }}
          onUndo={handleUndo} 
          onZoom={(dir) => handleZoom(dir)} 
          onShowExport={handleDownload} 
          canvas={fabricCanvasRef.current}
        />
      </div>

      {showAI && (
        <div className="absolute left-6 top-24 z-50">
          <AIAssistant onGenerate={() => {}} isGenerating={false} />
          <button onClick={() => setShowAI(false)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">×</button>
        </div>
      )}
    </div>
  );
};