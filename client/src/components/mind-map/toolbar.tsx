import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapWithNodes } from "@shared/schema";
import { ZoomIn, ZoomOut, Download, ChevronDown, Menu } from "lucide-react";
import { ExportService, ExportOptions } from "@/lib/export-service";
import { useRef } from "react";

interface ToolbarProps {
  currentMap?: MapWithNodes;
  viewMode: "visual" | "outline";
  onViewModeChange: (mode: "visual" | "outline") => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canvasRef?: React.RefObject<HTMLElement>;
  onOpenSidebar?: () => void;
}

export function Toolbar({ currentMap, viewMode, onViewModeChange, zoomLevel = 1, onZoomIn, onZoomOut, canvasRef, onOpenSidebar }: ToolbarProps) {
  const handleExport = async (format: ExportOptions['format']) => {
    if (!currentMap) return;

    try {
      const canvasElement = canvasRef?.current || null;
      await ExportService.exportMap(currentMap, canvasElement, {
        format,
        quality: 2,
        includeBackground: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return "Saved just now";
    if (diffMinutes < 60) return `Saved ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Saved ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Saved ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu + Map Info */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSidebar}
            className="lg:hidden"
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground" data-testid="text-map-title">
            {currentMap?.title || "No Map Selected"}
          </h1>
          {currentMap && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span data-testid="text-node-count">
                {currentMap.nodes?.length || 0} nodes
              </span>
              <span>•</span>
              <span data-testid="text-last-saved">
                {formatTimeAgo(currentMap.updatedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Toolbar Actions */}
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "visual" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("visual")}
              data-testid="button-view-visual"
            >
              Visual
            </Button>
            <Button
              variant={viewMode === "outline" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("outline")}
              data-testid="button-view-outline"
            >
              Outline
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border border-border rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onZoomIn}
              disabled={!onZoomIn || zoomLevel >= 3}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2" data-testid="text-zoom-level">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onZoomOut}
              disabled={!onZoomOut || zoomLevel <= 0.1}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentMap}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('json')} data-testid="export-json">
                <Download className="w-4 h-4 mr-2" />
                JSON Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('png')} data-testid="export-png">
                <Download className="w-4 h-4 mr-2" />
                PNG Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('svg')} data-testid="export-svg">
                <Download className="w-4 h-4 mr-2" />
                SVG Vector
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} data-testid="export-pdf">
                <Download className="w-4 h-4 mr-2" />
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('markdown')} data-testid="export-markdown">
                <Download className="w-4 h-4 mr-2" />
                Markdown Outline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
