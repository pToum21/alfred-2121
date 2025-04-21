import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface DraggableSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

export function DraggableSection({
  id,
  title,
  children,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: DraggableSectionProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, id)}
      onDragEnd={onDragEnd}
      className={cn(
        "transition-opacity duration-200",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <Card>
        <CardHeader className="relative cursor-move">
          <div className="absolute right-4 top-4 text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
} 