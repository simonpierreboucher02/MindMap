import React, { useState, useRef, useCallback } from "react";
import { Node } from "@shared/schema";
import { cn } from "@/lib/utils";

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  isConnectionStart?: boolean;
  onSelect: (isCtrlKey: boolean) => void;
  onMove: (nodeId: string, x: number, y: number) => void;
}

export function NodeComponent({ node, isSelected, isConnectionStart = false, onSelect, onMove }: NodeComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    
    // If Ctrl is held, handle connection creation instead of dragging
    if (e.ctrlKey || e.metaKey) {
      onSelect(true);
      return;
    }
    
    // Capture pointer for mobile touch support
    e.currentTarget.setPointerCapture(e.pointerId);
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
    onSelect(false);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    if (nodeRef.current) {
      nodeRef.current.style.left = `${newX}px`;
      nodeRef.current.style.top = `${newY}px`;
    }
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    onMove(node.id, newX, newY);
  }, [isDragging, dragStart, onMove, node.id]);

  // Attach global pointer events for dragging (supports touch)
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const getShapeClasses = () => {
    switch (node.shape) {
      case "circle":
        return "rounded-full";
      case "hexagon":
        return "hexagon-clip";
      default:
        return "rounded-lg";
    }
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "mindmap-node absolute flex items-center justify-center font-medium shadow-lg cursor-move transition-all duration-200 select-none",
        getShapeClasses(),
        isSelected && "ring-2 ring-ring ring-offset-2",
        isConnectionStart && "ring-2 ring-orange-500 ring-offset-2 shadow-orange-500/50",
        isDragging && "z-50 scale-105"
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: node.color,
        color: node.textColor,
      }}
      onPointerDown={handlePointerDown}
      data-testid={`node-${node.id}`}
    >
      <span className="text-sm font-medium text-center px-2 py-1 truncate max-w-full pointer-events-none">
        {node.text}
      </span>
    </div>
  );
}
