import React, { useState, useRef, useCallback, forwardRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapWithNodes, Node, InsertNode, InsertConnection } from "@shared/schema";
import { NodeComponent } from "@/components/mind-map/node-component";
import { ConnectionLine } from "@/components/mind-map/connection-line";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MindMapCanvasProps {
  map?: MapWithNodes;
  viewMode: "visual" | "outline";
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

export const MindMapCanvas = forwardRef<HTMLDivElement, MindMapCanvasProps>(function MindMapCanvas({ map, viewMode, selectedNodeId, onSelectNode, zoomLevel = 1, onZoomChange }, ref) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionStartNode, setConnectionStartNode] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: InsertNode) => {
      const res = await apiRequest("POST", "/api/nodes", nodeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maps", map?.id] });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertNode> }) => {
      const res = await apiRequest("PUT", `/api/nodes/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maps", map?.id] });
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (connectionData: InsertConnection) => {
      const res = await apiRequest("POST", "/api/connections", connectionData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maps", map?.id] });
      setConnectionStartNode(null);
    },
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectNode(null);
    }
  }, [onSelectNode]);

  const handleAddNode = useCallback((e: React.MouseEvent) => {
    if (!map) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // For better mobile experience, place new nodes in the center of visible area
    // rather than using button click coordinates
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Convert to logical coordinates (accounting for zoom and pan)
    let x = (centerX - panOffset.x) / zoomLevel - 60; // Center the node
    let y = (centerY - panOffset.y) / zoomLevel - 30;
    
    // Add intelligent spacing for multiple nodes so they don't stack
    const nodeCount = map.nodes?.length || 0;
    x += (nodeCount % 3) * 160 - 160; // -160, 0, or +160 offset (wider than node width)
    y += Math.floor(nodeCount / 3) * 120 - 60; // Vertical offset with enough spacing
    
    // Ensure coordinates are positive
    x = Math.max(20, x);
    y = Math.max(20, y);

    const newNode: InsertNode = {
      mapId: map.id,
      text: "New Node",
      x,
      y,
      width: 120,
      height: 60,
      shape: "rectangle",
      color: "#3b82f6",
      textColor: "#ffffff",
    };

    createNodeMutation.mutate(newNode);
  }, [map, createNodeMutation, panOffset, zoomLevel]);

  const handleNodeMove = useCallback((nodeId: string, x: number, y: number) => {
    // Convert canvas coordinates back to logical coordinates
    const logicalX = (x - panOffset.x) / zoomLevel;
    const logicalY = (y - panOffset.y) / zoomLevel;
    
    updateNodeMutation.mutate({
      id: nodeId,
      updates: { x: logicalX, y: logicalY },
    });
  }, [updateNodeMutation, panOffset, zoomLevel]);

  const handleNodeClick = useCallback((nodeId: string, isCtrlKey: boolean) => {
    if (isCtrlKey && map) {
      // Handle connection creation
      if (connectionStartNode === null) {
        // Start a new connection
        setConnectionStartNode(nodeId);
      } else if (connectionStartNode === nodeId) {
        // Cancel connection if clicking the same node
        setConnectionStartNode(null);
      } else {
        // Complete the connection
        const connectionData: InsertConnection = {
          mapId: map.id,
          sourceNodeId: connectionStartNode,
          targetNodeId: nodeId,
        };
        createConnectionMutation.mutate(connectionData);
      }
    } else {
      // Normal node selection
      onSelectNode(nodeId);
      setConnectionStartNode(null);
    }
  }, [connectionStartNode, map, createConnectionMutation, onSelectNode]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!onZoomChange) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel * delta));
    onZoomChange(newZoom);
  }, [zoomLevel, onZoomChange]);

  const handlePanStart = useCallback((e: React.PointerEvent) => {
    // For touch, don't immediately start panning to allow tap-to-deselect
    // For mouse, pan if middle button or shift is held
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    } else if (e.pointerType === 'touch') {
      // Store start position for touch, but don't start panning yet
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  }, [panOffset]);

  const handlePanMove = useCallback((e: PointerEvent) => {
    // For touch, start panning if moved more than threshold
    if (!isPanning && e.pointerType === 'touch') {
      const moveDistance = Math.abs(e.clientX - (panStart.x + panOffset.x)) + Math.abs(e.clientY - (panStart.y + panOffset.y));
      if (moveDistance > 10) { // 10px threshold
        setIsPanning(true);
      }
    }
    
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }, [isPanning, panStart, panOffset]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Attach global pointer events for panning (supports touch)
  React.useEffect(() => {
    if (isPanning) {
      document.addEventListener('pointermove', handlePanMove);
      document.addEventListener('pointerup', handlePanEnd);
      return () => {
        document.removeEventListener('pointermove', handlePanMove);
        document.removeEventListener('pointerup', handlePanEnd);
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  if (viewMode === "outline") {
    return (
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Outline View</h2>
          {map?.nodes && map.nodes.length > 0 ? (
            <ul className="space-y-2">
              {map.nodes.map((node) => (
                <li key={node.id} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-sm" 
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="text-foreground">{node.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No nodes to display</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={(node) => {
        (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className="flex-1 relative overflow-hidden canvas-container bg-background"
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onPointerDown={handlePanStart}
      data-testid="canvas-visual"
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* SVG for connections */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0'
        }}
      >
        {map?.connections.map((connection) => {
          const sourceNode = map.nodes.find(n => n.id === connection.sourceNodeId);
          const targetNode = map.nodes.find(n => n.id === connection.targetNodeId);
          
          if (!sourceNode || !targetNode) return null;

          return (
            <ConnectionLine
              key={connection.id}
              connectionId={connection.id}
              sourceNode={sourceNode}
              targetNode={targetNode}
            />
          );
        })}
      </svg>

      {/* Nodes Container */}
      <div 
        className="absolute inset-0 z-20"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0'
        }}
      >
        {map?.nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isConnectionStart={connectionStartNode === node.id}
            onSelect={(isCtrlKey) => handleNodeClick(node.id, isCtrlKey)}
            onMove={handleNodeMove}
          />
        ))}
      </div>

      {/* Add Node Button - Mobile Optimized */}
      <Button
        className="absolute bottom-4 right-4 w-12 h-12 sm:bottom-8 sm:right-8 sm:w-14 sm:h-14 rounded-full shadow-lg z-30 touch-manipulation active:scale-95 transition-transform"
        onClick={handleAddNode}
        disabled={!map}
        data-testid="button-add-node"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>

      {/* Empty State */}
      {!map && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Select a map to start editing</p>
          </div>
        </div>
      )}

      {map && map.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Click the + button to add your first node</p>
          </div>
        </div>
      )}

      {/* Connection Instructions */}
      {connectionStartNode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-40">
          <p className="text-sm font-medium">Hold Ctrl and click another node to create a connection</p>
        </div>
      )}
    </div>
  );
});
