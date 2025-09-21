import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Node, InsertNode } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Square, Circle, Hexagon } from "lucide-react";

interface NodeCustomizationPanelProps {
  nodeId: string;
  mapId: string;
  onClose: () => void;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#ef4444", // red
  "#8b5cf6", // purple
  "#f59e0b", // orange
  "#ec4899", // pink
  "#6b7280", // gray
  "#84cc16", // lime
];

const SHAPES = [
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "hexagon", icon: Hexagon, label: "Hexagon" },
];

export function NodeCustomizationPanel({ nodeId, mapId, onClose }: NodeCustomizationPanelProps) {
  const [text, setText] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");
  const [selectedShape, setSelectedShape] = useState("rectangle");

  const { data: node } = useQuery<Node>({
    queryKey: ["/api/nodes", nodeId],
    queryFn: async () => {
      // Get node from the map data
      const map = await queryClient.getQueryData(["/api/maps", mapId]) as any;
      return map?.nodes.find((n: Node) => n.id === nodeId);
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: async (updates: Partial<InsertNode>) => {
      const res = await apiRequest("PUT", `/api/nodes/${nodeId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maps", mapId] });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/nodes/${nodeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maps", mapId] });
      onClose();
    },
  });

  useEffect(() => {
    if (node) {
      setText(node.text);
      setSelectedColor(node.color);
      setSelectedShape(node.shape);
    }
  }, [node]);

  const handleApply = () => {
    updateNodeMutation.mutate({
      text,
      color: selectedColor,
      shape: selectedShape as "rectangle" | "circle" | "hexagon",
      textColor: getContrastColor(selectedColor),
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this node?")) {
      deleteNodeMutation.mutate();
    }
  };

  const getContrastColor = (hexColor: string) => {
    // Simple contrast calculation
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  if (!node) return null;

  return (
    <Card className="fixed right-2 top-16 w-64 sm:right-4 sm:top-20 sm:w-72 shadow-lg z-50 max-h-[calc(100vh-5rem)] overflow-y-auto" data-testid="customization-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Customize Node</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Node Text */}
        <div>
          <Label htmlFor="node-text" className="text-sm">Text</Label>
          <Input
            id="node-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1"
            data-testid="input-node-text"
          />
        </div>

        {/* Shape Selection */}
        <div>
          <Label className="text-sm">Shape</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {SHAPES.map((shape) => {
              const Icon = shape.icon;
              return (
                <Button
                  key={shape.id}
                  variant={selectedShape === shape.id ? "default" : "outline"}
                  size="sm"
                  className="h-10"
                  onClick={() => setSelectedShape(shape.id)}
                  data-testid={`button-shape-${shape.id}`}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <Label className="text-sm">Color</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-md border-2 transition-colors ${
                  selectedColor === color ? "border-ring" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                data-testid={`button-color-${color.slice(1)}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={handleApply}
            disabled={updateNodeMutation.isPending}
            className="flex-1"
            data-testid="button-apply-changes"
          >
            {updateNodeMutation.isPending ? "Applying..." : "Apply"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteNodeMutation.isPending}
            data-testid="button-delete-node"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
