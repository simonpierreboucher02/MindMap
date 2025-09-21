import { Node } from "@shared/schema";

interface ConnectionLineProps {
  connectionId: string;
  sourceNode: Node;
  targetNode: Node;
}

export function ConnectionLine({ connectionId, sourceNode, targetNode }: ConnectionLineProps) {
  const startX = sourceNode.x + sourceNode.width / 2;
  const startY = sourceNode.y + sourceNode.height / 2;
  const endX = targetNode.x + targetNode.width / 2;
  const endY = targetNode.y + targetNode.height / 2;

  // Create a curved path
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlX = midX;
  const controlY = startY < endY ? midY - 50 : midY + 50;

  const pathData = `M${startX},${startY} Q${controlX},${controlY} ${endX},${endY}`;

  return (
    <path
      d={pathData}
      className="connection-line"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth="2"
      fill="none"
      data-testid="connection-line"
      data-connection-id={connectionId}
      data-source-node={sourceNode.id}
      data-target-node={targetNode.id}
    />
  );
}
