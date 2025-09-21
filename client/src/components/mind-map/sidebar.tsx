import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-provider";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Map } from "@shared/schema";
import { 
  Lightbulb, 
  Search, 
  Plus, 
  Moon, 
  Sun, 
  Settings, 
  Upload, 
  Download,
  MoreVertical 
} from "lucide-react";

interface SidebarProps {
  maps: Map[];
  selectedMapId: string | null;
  onSelectMap: (mapId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ maps, selectedMapId, onSelectMap, isOpen = true, onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const createMapMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/maps", { title });
      return await res.json();
    },
    onSuccess: (newMap) => {
      queryClient.invalidateQueries({ queryKey: ["/api/maps"] });
      onSelectMap(newMap.id);
    },
  });

  const filteredMaps = maps.filter(map =>
    map.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewMap = () => {
    const title = prompt("Enter map title:");
    if (title?.trim()) {
      createMapMutation.mutate(title.trim());
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  return (
    <div className={`
      w-80 bg-card border-r border-border flex flex-col 
      fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">MindMap</h2>
              <p className="text-xs text-muted-foreground" data-testid="text-username">
                {user?.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search maps and nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Map List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground">My Maps</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewMap}
            disabled={createMapMutation.isPending}
            data-testid="button-new-map"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {filteredMaps.map((map) => (
            <div
              key={map.id}
              className={`group p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors ${
                selectedMapId === map.id ? "border-l-2 border-primary bg-accent/50" : ""
              }`}
              onClick={() => onSelectMap(map.id)}
              data-testid={`map-item-${map.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm" data-testid={`text-map-title-${map.id}`}>
                    {map.title}
                  </h4>
                  <p className="text-xs text-muted-foreground" data-testid={`text-map-updated-${map.id}`}>
                    {formatTimeAgo(map.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  data-testid={`button-map-menu-${map.id}`}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {filteredMaps.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No maps found" : "No maps yet"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleNewMap}
                  data-testid="button-create-first-map"
                >
                  Create your first map
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleNewMap}
            data-testid="button-new-map-footer"
          >
            <Plus className="w-4 h-4 mr-3" />
            New Map
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            data-testid="button-import-map"
          >
            <Upload className="w-4 h-4 mr-3" />
            Import Map
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            data-testid="button-export-all"
          >
            <Download className="w-4 h-4 mr-3" />
            Export All
          </Button>
        </div>
      </div>
    </div>
  );
}
