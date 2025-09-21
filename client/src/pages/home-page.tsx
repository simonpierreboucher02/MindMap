import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Map, MapWithNodes } from "@shared/schema";
import { Sidebar } from "@/components/mind-map/sidebar";
import { Toolbar } from "@/components/mind-map/toolbar";
import { MindMapCanvas } from "@/components/mind-map/mind-map-canvas";
import { NodeCustomizationPanel } from "@/components/mind-map/node-customization-panel";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "outline">("visual");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: maps = [] } = useQuery<Map[]>({
    queryKey: ["/api/maps"],
    enabled: !!user,
  });

  const { data: currentMap } = useQuery<MapWithNodes>({
    queryKey: ["/api/maps", selectedMapId],
    enabled: !!selectedMapId,
  });

  // Select first map by default
  if (maps.length > 0 && !selectedMapId) {
    setSelectedMapId(maps[0].id);
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  };

  return (
    <div className="h-screen flex bg-background text-foreground relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Sidebar
        maps={maps}
        selectedMapId={selectedMapId}
        onSelectMap={(mapId) => {
          setSelectedMapId(mapId);
          setIsSidebarOpen(false); // Close sidebar on map selection on mobile
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        data-testid="sidebar"
      />
      
      <div className="flex-1 flex flex-col">
        <Toolbar
          currentMap={currentMap}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          canvasRef={canvasRef}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          data-testid="toolbar"
        />
        
        <MindMapCanvas
          ref={canvasRef}
          map={currentMap}
          viewMode={viewMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          data-testid="mindmap-canvas"
        />
      </div>

      {selectedNodeId && (
        <NodeCustomizationPanel
          nodeId={selectedNodeId}
          mapId={selectedMapId!}
          onClose={() => setSelectedNodeId(null)}
          data-testid="node-customization-panel"
        />
      )}
    </div>
  );
}
