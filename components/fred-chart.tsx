// components/fred-chart.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Area } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Info, ChevronDown, TrendingUp, TrendingDown, Clock, Settings } from 'lucide-react';
import { FaviconLink } from './ui/favicon-link';
import { ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

interface FREDDataItem {
  date: string;
  value: string;
}

interface BLSDataItem {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes?: Array<{ text: string }>;
}

export interface FREDChartProps {
  data: Array<FREDDataItem | BLSDataItem>;
  series: string;
  seriesTitle: string;
  height?: number;
  dataSource: 'FRED' | 'BLS' | 'CFPB';
  seriesExplanation?: string;
}

export function FREDChart({ data, series, dataSource, seriesExplanation, seriesTitle, height }: FREDChartProps) {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('all');
  const [smoothing, setSmoothing] = useState(1);
  const [showArea, setShowArea] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.error('No data provided to FREDChart');
      return [];
    }

    console.log('Raw data:', JSON.stringify(data, null, 2));

    return data.map(item => {
      let date: Date;
      let value: number;

      if ('date' in item) {
        // FRED data
        date = new Date(item.date);
        value = parseFloat(item.value);
      } else {
        // BLS data
        const blsItem = item as BLSDataItem;
        const year = parseInt(blsItem.year);
        const month = parseInt(blsItem.period.slice(1)) - 1; // 'M01' to 'M12' for months
        date = new Date(year, month, 1);
        value = parseFloat(blsItem.value);
      }

      return { date, value };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = chartData;
    if (timeRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const diff = now.getTime() - item.date.getTime();
        const days = diff / (1000 * 3600 * 24);
        return days <= parseInt(timeRange);
      });
    }
    if (smoothing > 1) {
      filtered = filtered.filter((_, index) => index % smoothing === 0);
    }
    return filtered;
  }, [chartData, timeRange, smoothing]);

  const latestDataPoint = chartData[chartData.length - 1] || { value: 0 };
  const previousDataPoint = chartData[chartData.length - 2] || { value: latestDataPoint.value };
  
  const currentValue = latestDataPoint.value;
  const changeValue = currentValue - previousDataPoint.value;
  const changePercent = previousDataPoint.value !== 0 
    ? (changeValue / previousDataPoint.value) * 100 
    : 0;

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
  const formatValue = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background/95 backdrop-blur-md p-2 border border-border/50 rounded-md shadow-xl text-xs font-mono"
        >
          <p className="font-medium text-foreground/80">{formatDate(new Date(label))}</p>
          <p className="text-primary font-bold">{formatValue(payload[0].value)}</p>
        </motion.div>
      );
    }
    return null;
  };

  const isDarkMode = theme === 'dark';

  const ChartControls = () => (
    <div className="flex items-center gap-2 text-xs">
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="h-7 w-[80px] text-xs">
          <SelectValue placeholder="Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="365">1Y</SelectItem>
          <SelectItem value="180">6M</SelectItem>
          <SelectItem value="30">1M</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex items-center gap-2 bg-secondary/30 rounded-md px-2 py-1">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <Slider
          min={1}
          max={10}
          step={1}
          value={[smoothing]}
          onValueChange={(value) => setSmoothing(value[0])}
          className="w-[60px]"
        />
      </div>

      <button
        onClick={() => setShowArea(!showArea)}
        className={cn(
          "h-7 px-2 rounded-md text-xs transition-colors",
          showArea ? "bg-primary/20 text-primary" : "bg-secondary/30 text-secondary-foreground"
        )}
      >
        Area
      </button>
    </div>
  );

  const DataHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{seriesTitle}</h3>
        <p className="text-xs text-muted-foreground font-mono">{series}</p>
      </div>
      <div className="flex items-center gap-3">
        <ChartControls />
        <Popover>
          <PopoverTrigger>
            <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2 text-xs">
              <h4 className="font-medium">Series Information</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>{seriesExplanation}</p>
                <p className="font-mono">Last updated: {formatDate(new Date(chartData[chartData.length - 1]?.date))}</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const ValueDisplay = () => {
    const changeColor = changeValue >= 0 ? 'text-green-500' : 'text-red-500';
    const ChangeIcon = changeValue >= 0 ? TrendingUp : TrendingDown;
    
    return (
      <div className="flex items-center gap-4 mb-4 bg-secondary/20 rounded-md p-2 text-xs">
        <div>
          <span className="text-muted-foreground">Current</span>
          <p className="font-mono font-bold">{formatValue(currentValue)}</p>
        </div>
        <div className={changeColor}>
          <span className="flex items-center gap-1">
            <ChangeIcon className="w-3 h-3" />
            {formatValue(Math.abs(changeValue))}
          </span>
          <span className="text-[10px]">({changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    );
  };

  const getCitationUrl = () => {
    if (dataSource === 'FRED') {
      return `https://fred.stlouisfed.org/series/${series}`;
    } else if (dataSource === 'BLS') {
      return `https://data.bls.gov/timeseries/${series}`;
    }
    return '';
  };

  return (
    <Card className="w-full bg-background/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-2">
        <div className="space-y-1">
          <div style={{ height: height || 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData} 
                margin={{ top: 5, right: 25, left: 0, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(tick) => {
                    const date = new Date(tick);
                    return date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: '2-digit'
                    });
                  }}
                  angle={-35}
                  textAnchor="end" 
                  height={25}
                  tick={{ 
                    fontSize: 8,
                    fill: isDarkMode ? "#9CA3AF" : "#4B5563", 
                    fontFamily: 'var(--font-mono)',
                    dy: 8
                  }}
                  tickSize={3}
                  tickCount={5}
                  minTickGap={30}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (Math.abs(value) >= 1000000) {
                      return (value / 1000000).toFixed(1) + 'M';
                    } else if (Math.abs(value) >= 1000) {
                      return (value / 1000).toFixed(0) + 'K';
                    }
                    return value.toFixed(0);
                  }}
                  tick={{ 
                    fontSize: 8, 
                    fill: isDarkMode ? "#9CA3AF" : "#4B5563", 
                    fontFamily: 'var(--font-mono)'
                  }}
                  width={35}
                  tickCount={5}
                  minTickGap={20}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                {showArea && (
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    fill={isDarkMode ? "url(#colorGradientDark)" : "url(#colorGradientLight)"} 
                    strokeWidth={0} 
                    fillOpacity={0.1} 
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isDarkMode ? "#60A5FA" : "#3B82F6"} 
                  strokeWidth={1.5} 
                  dot={false} 
                  activeDot={{ r: 4, fill: isDarkMode ? "#60A5FA" : "#3B82F6", stroke: isDarkMode ? "#111827" : "#FFFFFF", strokeWidth: 2 }} 
                />
                <ReferenceLine 
                  y={currentValue} 
                  label={{ 
                    value: formatValue(currentValue), 
                    position: 'right',
                    fontSize: 10,
                    fill: isDarkMode ? "#9CA3AF" : "#4B5563",
                    fontFamily: 'var(--font-mono)'
                  }} 
                  stroke={isDarkMode ? "#9CA3AF" : "#4B5563"} 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5}
                />
                <defs>
                  <linearGradient id="colorGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGradientDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-end">
          <span className="mr-1">Source:</span>
          <FaviconLink href={getCitationUrl()}>
            {dataSource === 'FRED' ? 'Federal Reserve Economic Data' : dataSource === 'BLS' ? 'Bureau of Labor Statistics' : 'CFPB'}
            <ExternalLink className="ml-1 inline-block w-3 h-3" />
          </FaviconLink>
        </div>
      </CardContent>
    </Card>
  );
}