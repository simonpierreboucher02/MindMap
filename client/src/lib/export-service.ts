import html2canvas from "html2canvas";
import jsPDF from "jspdf";
// @ts-ignore - dom-to-image doesn't have official types
import domtoimage from "dom-to-image";
import { MapWithNodes } from "@shared/schema";

export interface ExportOptions {
  format: "json" | "png" | "svg" | "pdf" | "markdown";
  quality?: number;
  includeBackground?: boolean;
}

export class ExportService {
  static async exportMap(
    map: MapWithNodes,
    canvasElement: HTMLElement | null,
    options: ExportOptions
  ): Promise<void> {
    if (!map) {
      throw new Error("No map data available for export");
    }

    const filename = `${map.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    switch (options.format) {
      case "json":
        this.exportJSON(map, filename);
        break;
      case "png":
        await this.exportPNG(canvasElement, filename, options);
        break;
      case "svg":
        await this.exportSVG(canvasElement, filename);
        break;
      case "pdf":
        await this.exportPDF(canvasElement, filename, options);
        break;
      case "markdown":
        this.exportMarkdown(map, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static exportJSON(map: MapWithNodes, filename: string): void {
    const dataStr = JSON.stringify(map, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    this.downloadFile(dataBlob, `${filename}.json`);
  }

  private static async exportPNG(
    canvasElement: HTMLElement | null,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    if (!canvasElement) {
      throw new Error("Canvas element not found for PNG export");
    }

    try {
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: options.includeBackground ? "#ffffff" : null,
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          this.downloadFile(blob, `${filename}.png`);
        }
      }, "image/png");
    } catch (error) {
      console.error("PNG export failed:", error);
      throw new Error("Failed to export as PNG");
    }
  }

  private static async exportSVG(
    canvasElement: HTMLElement | null,
    filename: string
  ): Promise<void> {
    if (!canvasElement) {
      throw new Error("Canvas element not found for SVG export");
    }

    try {
      const svgDataUrl = await domtoimage.toSvg(canvasElement, {
        bgcolor: "#ffffff",
        quality: 1.0,
      });

      // Convert data URL to blob
      const response = await fetch(svgDataUrl);
      const blob = await response.blob();
      this.downloadFile(blob, `${filename}.svg`);
    } catch (error) {
      console.error("SVG export failed:", error);
      throw new Error("Failed to export as SVG");
    }
  }

  private static async exportPDF(
    canvasElement: HTMLElement | null,
    filename: string,
    options: ExportOptions
  ): Promise<void> {
    if (!canvasElement) {
      throw new Error("Canvas element not found for PDF export");
    }

    try {
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: options.includeBackground ? "#ffffff" : null,
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      throw new Error("Failed to export as PDF");
    }
  }

  private static exportMarkdown(map: MapWithNodes, filename: string): void {
    let markdown = `# ${map.title}\n\n`;
    
    // Add metadata
    markdown += `**Created:** ${new Date(map.createdAt).toLocaleDateString()}\n`;
    markdown += `**Last Updated:** ${new Date(map.updatedAt).toLocaleDateString()}\n`;
    markdown += `**Nodes:** ${map.nodes.length}\n`;
    markdown += `**Connections:** ${map.connections.length}\n\n`;

    // Add nodes section
    markdown += `## Nodes\n\n`;
    
    if (map.nodes.length === 0) {
      markdown += `*No nodes in this map.*\n\n`;
    } else {
      // Group nodes by connections to create a hierarchical structure
      const nodeMap = new Map(map.nodes.map(node => [node.id, node]));
      const connectionMap = new Map<string, string[]>();
      
      // Build connection map (parent -> children)
      map.connections.forEach(conn => {
        if (!connectionMap.has(conn.sourceNodeId)) {
          connectionMap.set(conn.sourceNodeId, []);
        }
        connectionMap.get(conn.sourceNodeId)!.push(conn.targetNodeId);
      });

      // Find root nodes (nodes with no incoming connections)
      const hasIncoming = new Set(map.connections.map(c => c.targetNodeId));
      const rootNodes = map.nodes.filter(node => !hasIncoming.has(node.id));
      const visited = new Set<string>();

      // Recursive function to build markdown hierarchy
      const addNodeToMarkdown = (nodeId: string, level: number = 0) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) return;

        const indent = "  ".repeat(level);
        markdown += `${indent}- **${node.text}**`;
        
        // Add node metadata
        const metadata: string[] = [];
        if (node.shape !== "rectangle") metadata.push(`Shape: ${node.shape}`);
        if (node.color !== "#3b82f6") metadata.push(`Color: ${node.color}`);
        
        if (metadata.length > 0) {
          markdown += ` *(${metadata.join(", ")})*`;
        }
        markdown += `\n`;

        // Add children
        const children = connectionMap.get(nodeId) || [];
        children.forEach(childId => addNodeToMarkdown(childId, level + 1));
      };

      // Start with root nodes
      if (rootNodes.length > 0) {
        rootNodes.forEach(node => addNodeToMarkdown(node.id));
      }

      // Add any unconnected nodes
      map.nodes.forEach(node => {
        if (!visited.has(node.id)) {
          addNodeToMarkdown(node.id);
        }
      });
    }

    // Add connections section
    if (map.connections.length > 0) {
      markdown += `\n## Connections\n\n`;
      map.connections.forEach(conn => {
        const sourceNode = map.nodes.find(n => n.id === conn.sourceNodeId);
        const targetNode = map.nodes.find(n => n.id === conn.targetNodeId);
        
        if (sourceNode && targetNode) {
          markdown += `- **${sourceNode.text}** → **${targetNode.text}**\n`;
        }
      });
    }

    const blob = new Blob([markdown], { type: "text/markdown" });
    this.downloadFile(blob, `${filename}.md`);
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}