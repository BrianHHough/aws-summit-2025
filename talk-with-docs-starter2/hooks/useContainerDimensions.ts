"use client";

import { useState, useEffect, useRef } from "react";

export function useContainerDimensions() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    
    resizeObserver.observe(ref.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  return { ref, width };
}