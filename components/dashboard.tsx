"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, GripVertical, Save, RotateCcw, LayoutGrid, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AskAlfred } from "@/components/ask-alfred"
import { KeyEconomicIndicators } from './key-economic-indicators'
import { EconomicTrends, FredSeriesData, FredObservation } from './economic-trends'
import { MarketOverview } from './market-overview'

// Types for the economic data from FRED
interface FredSeriesWithData {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  change: number;
  monthOverMonthChange: number;
  yearOverYearChange: number;
  observations: FredObservation[];
  frequency: string;
  units: string;
  observation_start: string;
  observation_end: string;
  last_updated: string;
}

export default function Dashboard() {
  // Debug trace - will execute immediately when component renders
  console.log('==== DASHBOARD COMPONENT RENDERING ====');
  
  // Custom logger for dashboard API related events
  const dashboardLogger = (message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const prefix = `[Dashboard API ${timestamp}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  };

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardSectionOrder');
      const defaultOrder = ['market-overview', 'economic-indicators', 'alfred', 'economic-trends'];
      console.log('Initial section order:', saved ? JSON.parse(saved) : defaultOrder);
      return saved ? JSON.parse(saved) : defaultOrder;
    }
    console.log('Initial render (SSR) - using default section order');
    return ['market-overview', 'economic-indicators', 'alfred', 'economic-trends'];
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; order: string[] }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardPresets');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [newLayoutName, setNewLayoutName] = useState('');
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<string>('6M');
  const [economicData, setEconomicData] = useState<FredSeriesData[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Add default section order constant
  const DEFAULT_SECTION_ORDER = ['market-overview', 'economic-indicators', 'alfred', 'economic-trends'];

  // Save section order to localStorage when it changes
  useEffect(() => {
    console.log('Section order effect triggered');
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardSectionOrder', JSON.stringify(sectionOrder));
      console.log('Saved section order to localStorage:', sectionOrder);
    }
  }, [sectionOrder]);

  // Save presets to localStorage when they change
  useEffect(() => {
    console.log('Presets effect triggered');
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardPresets', JSON.stringify(presets));
      console.log('Saved presets to localStorage:', presets);
    }
  }, [presets]);

  // Function to fetch economic data
  const fetchEconomicData = useCallback(async (timeframe: string) => {
    console.log(`=== FETCH ECONOMIC DATA CALLED with timeframe: ${timeframe} ===`);
    dashboardLogger(`Fetching economic data for timeframe: ${timeframe}`);
    setError(null);
    setLoading(true);
    
    try {
      // Use our server-side API endpoint instead of direct external API call
      const apiUrl = `/api/fred?timeframe=${timeframe}`;
      dashboardLogger(`Making request to: ${apiUrl}`);
      
      // Add direct debugging here
      console.log(`Calling fetch for URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status: ${response.status} - ${errorText}`);
      }
        
      // Log the raw response to debug
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
      
      let data;
      try {
        data = await response.json();
        console.log(`Response data type: ${typeof data}`);
        console.log(`Is array: ${Array.isArray(data)}`);
        if (Array.isArray(data)) {
          console.log(`Data length: ${data.length}`);
          if (data.length > 0) {
            console.log(`First item:`, data[0]);
          }
        }
      } catch (jsonError: unknown) {
        const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error';
        console.error(`Error parsing JSON:`, jsonError);
        throw new Error(`Failed to parse API response as JSON: ${errorMessage}`);
      }
      
      dashboardLogger(`Received response data: ${data ? (Array.isArray(data) ? `array with ${data.length} items` : typeof data) : 'null or undefined'}`);
      
      if (!data || !Array.isArray(data)) {
        dashboardLogger(`Invalid data format received:`, data);
        throw new Error('Invalid data format received from API (not an array)');
      }
      
      if (data.length === 0) {
        dashboardLogger(`Empty array received from API`);
        throw new Error('Empty data array received from API');
      }
      
      // Check if we got demo data
      const isDemo = response.headers.get('X-Data-Source') === 'demo';
      if (isDemo) {
        const errorMessage = response.headers.get('X-Error-Message');
        setError(`Using demo data: ${errorMessage || 'External API unavailable'}`);
        console.log('Using demo data due to external API error:', errorMessage);
      } else {
        setError(null);
      }
      
      console.log(`Setting economic data with ${data.length} items`);
      setEconomicData(data);
      dashboardLogger(`Successfully set economic data with ${data.length} items`);
    } catch (error: any) {
      console.error(`Error in fetchEconomicData:`, error);
      dashboardLogger(`Error fetching economic data: ${error.message}`);
      
      // More user-friendly error message
      const errorMsg = error.message || 'Unknown error';
      const userFriendlyMessage = errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') 
        ? 'Network connection error - unable to reach API server' 
        : errorMsg;
        
      setError(`Failed to fetch economic data: ${userFriendlyMessage}`);
    } finally {
      console.log('Setting loading state to false');
      setLoading(false);
      dashboardLogger(`Set loading state to false`);
    }
  }, []);

  // Early initialization console log
  console.log('Before useEffect hooks run');

  // Component mount effect
  useEffect(() => {
    console.log('MOUNT EFFECT - Dashboard useEffect triggered', {
      hasInitialized: hasInitialized.current,
      timeframe,
      dataLength: economicData.length
    });
    
    // Always fetch on component mount
    if (typeof window !== 'undefined') {
      console.log('Component mounted, starting initial data fetch...');
      hasInitialized.current = true;
      
      // Short timeout to ensure the component is fully mounted
      const fetchTimeout = setTimeout(() => {
        console.log('Executing initial fetch after timeout');
        fetchEconomicData(timeframe);
      }, 100);
      
      return () => {
        console.log('Cleaning up mount effect');
        clearTimeout(fetchTimeout);
      };
    }
  }, [timeframe, fetchEconomicData]); // Add proper dependencies
  
  // Handle timeframe changes
  useEffect(() => {
    console.log('TIMEFRAME EFFECT triggered', {
      hasInitialized: hasInitialized.current,
      timeframe
    });
    
    // Skip the initial render since it's handled by the mount effect
    if (hasInitialized.current && timeframe) {
      console.log(`Timeframe changed to ${timeframe}, fetching new data`);
      fetchEconomicData(timeframe);
    }
  }, [timeframe, fetchEconomicData]);

  // Debug console.log before render
  console.log('About to render dashboard component', {
    loading,
    hasError: error !== null,
    economicDataLength: economicData.length
  });

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
    
    if (fromIndex !== -1 && toIndex !== -1) {
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);
    setSectionOrder(newOrder);
    }
  };

  const savePreset = () => {
    if (!newLayoutName.trim()) return;
    
    const presetId = `preset-${Date.now()}`;
    const newPreset = {
      id: presetId,
      name: newLayoutName,
      order: [...sectionOrder]
    };
    
    setPresets([...presets, newPreset]);
    setNewLayoutName('');
    setSelectedLayout(presetId);
    setIsLayoutModalOpen(false);
  };

  const loadPreset = (preset: { id: string; name: string; order: string[] }) => {
    setSectionOrder([...preset.order]);
    setSelectedLayout(preset.id);
  };

  const deletePreset = (presetId: string) => {
    setPresets(presets.filter(preset => preset.id !== presetId));
    if (selectedLayout === presetId) {
      setSelectedLayout(null);
    }
  };

  const resetToDefault = () => {
    setSectionOrder([...DEFAULT_SECTION_ORDER]);
    setSelectedLayout(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleTimeframeChange = (value: string) => {
    console.log(`Timeframe change requested: ${value}`);
    setTimeframe(value);
  };

  const handleLegendClick = (series: string) => {
    setSelectedSeries(selectedSeries === series ? null : series);
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading economic data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Connection Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 text-sm">
              Make sure the Dashboard API is running on port 3007. You can start it with:
              <pre className="bg-muted p-2 mt-2 rounded-md overflow-x-auto">
                cd dashboard-api && npm start
              </pre>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={() => fetchEconomicData(timeframe)} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Retry Connection
          </Button>
          <Button variant="outline" onClick={() => window.open('http://localhost:3007/health', '_blank')} className="flex items-center gap-2">
            Test API Connection
          </Button>
        </div>
      </div>
    );
  }

  console.log('Rendering main dashboard content');
  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
          <Image 
            src="/ChatGPT Image Apr 16, 2025, 11_54_20 AM (1).png"
            alt="Economic Dashboard"
            width={300}
            height={80}
            priority
            className="mb-2"
          />
          <p className="text-muted-foreground">View and analyze economic trends and indicators</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          
          <Button variant="outline" onClick={() => fetchEconomicData(timeframe)} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Refresh Data
                    </Button>
          
          <Dialog open={isLayoutModalOpen} onOpenChange={setIsLayoutModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Save size={16} />
                Save Layout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Dashboard Layout</DialogTitle>
                <DialogDescription>
                  Name your layout to save your current dashboard configuration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                      <Input
                    placeholder="Layout name"
                        value={newLayoutName}
                        onChange={(e) => setNewLayoutName(e.target.value)}
                      />
                </div>
                <Button onClick={savePreset} disabled={!newLayoutName.trim()}>
                  Save Layout
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={resetToDefault} className="flex items-center gap-2">
            <RotateCcw size={16} />
            Reset
          </Button>
          
          <Button variant="outline" onClick={() => router.push('/home')} className="flex items-center gap-2">
            Back to Home
          </Button>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Saved Layouts</h2>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <div
                key={preset.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 border rounded-md cursor-pointer transition-colors",
                  selectedLayout === preset.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
                onClick={() => loadPreset(preset)}
              >
                <LayoutGrid size={14} />
                <span>{preset.name}</span>
                <button
                  className={cn(
                    "ml-2 rounded-full p-1 hover:bg-red-500/10",
                    selectedLayout === preset.id
                      ? "text-primary-foreground hover:text-red-300"
                      : "text-muted-foreground hover:text-red-500"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(preset.id);
                  }}
                >
                  <AlertCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {sectionOrder.map(sectionId => {
          console.log(`Rendering section: ${sectionId}`);
          
          return (
            <div
              key={sectionId}
              draggable
              onDragStart={(e) => handleDragStart(e, sectionId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, sectionId)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative border rounded-lg transition-all",
                draggingId === sectionId ? "opacity-50" : "opacity-100",
                draggingId && draggingId !== sectionId ? "border-dashed border-primary" : ""
              )}
            >
              <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-medium text-muted-foreground">
                <GripVertical className="inline-block mr-1" size={12} />
                Drag to reorder
              </div>
              
              {sectionId === 'market-overview' && (
                <div>
                  <MarketOverview initialTemplate="residential-originator" />
                </div>
              )}
              
              {sectionId === 'alfred' && (
                <div>
                  <AskAlfred />
                </div>
              )}
              
              {sectionId === 'economic-indicators' && (
                <KeyEconomicIndicators 
                  data={economicData}
                  timeframe={timeframe}
                />
              )}
              
              {sectionId === 'economic-trends' && (
                <EconomicTrends
                  data={economicData}
                  timeframe={timeframe}
                  selectedSeries={selectedSeries}
                  onLegendClick={handleLegendClick}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}