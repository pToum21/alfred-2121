import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MarketOverview } from './market-overview';
import { DraggableSection } from './draggable-section';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableHead, TableRow } from './ui/table';

interface DashboardLayoutProps {
  sections: Array<{
    id: string;
    type: string;
    title: string;
  }>;
  economicData: any;
  timeframe: string;
}

interface Preset {
  id: string;
  name: string;
  sectionOrder: string[];
}

export function DashboardLayout({ sections, economicData, timeframe }: DashboardLayoutProps) {
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardSectionOrder');
      return saved ? JSON.parse(saved) : ['market-overview', 'economic-trends', 'key-indicators', 'pinecone-results'];
    }
    return ['market-overview', 'economic-trends', 'key-indicators', 'pinecone-results'];
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>(() => {
    // Load presets from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardPresets');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [newPresetName, setNewPresetName] = useState('');

  // Save presets to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardPresets', JSON.stringify(presets));
    }
  }, [presets]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    const newOrder = [...sectionOrder];
    const fromIndex = newOrder.indexOf(draggedId);
    const toIndex = newOrder.indexOf(targetId);
    
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);
    
    setSectionOrder(newOrder);
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      sectionOrder: [...sectionOrder],
    };
    
    setPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
  };

  const loadPreset = (preset: Preset) => {
    setSectionOrder(preset.sectionOrder);
  };

  const deletePreset = (presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const renderSection = (section: { id: string; type: string; title: string }) => {
    switch (section.type) {
      case 'market-overview':
        return <MarketOverview initialTemplate="residential-originator" />;
      // Add other section types here
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Manage Layouts</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Manage Dashboard Layouts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New layout name"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
                <Button onClick={savePreset}>Save Current Layout</Button>
              </div>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex justify-between items-center p-2 rounded-lg border">
                    <span className="font-medium">{preset.name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => loadPreset(preset)}>
                        Load
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deletePreset(preset.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sectionOrder.map((sectionId) => {
          const section = sections.find((s) => s.id === sectionId);
          if (!section) return null;

          return (
            <DraggableSection
              key={section.id}
              id={section.id}
              title={section.title}
              isDragging={draggingId === section.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            >
              {renderSection(section)}
            </DraggableSection>
          );
        })}
      </div>
    </div>
  );
} 