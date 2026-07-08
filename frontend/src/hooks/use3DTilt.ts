import { useRef, useState, useCallback } from "react";

export function use3DTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  
  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setStyle({ 
      transform: `perspective(900px) rotateX(${-y * strength}deg) rotateY(${x * strength}deg) scale3d(1.03,1.03,1.03)`, 
      transition: "none" 
    });
  }, [strength]);

  const handleLeave = useCallback(() => {
    setStyle({ 
      transform: "", 
      transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1)" 
    });
  }, []);

  return { ref, style, onMouseMove: handleMove, onMouseLeave: handleLeave };
}
