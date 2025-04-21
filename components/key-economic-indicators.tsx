"use client"

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Settings2, Plus, X, Pin } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export type FredObservation = {
  date: string;
  value: number;
};

export type FredSeriesData = {
  id: string;
  title: string;
  units: string;
  frequency: string;
  observation_start: string;
  observation_end: string;
  last_updated: string;
  value: number;
  previousValue: number;
  change: number;
  observations: FredObservation[];
  monthOverMonthChange: number;
  yearOverYearChange?: number;
};

// Define all available indicators
const AVAILABLE_INDICATORS = [
  { id: "A191RL1Q225SBEA", title: "GDP Growth", category: "Economic" },
  { id: "UNRATE", title: "Unemployment Rate", category: "Economic" },
  { id: "CPIAUCSL", title: "Inflation Rate", category: "Economic" },
  { id: "PI", title: "Personal Income", category: "Economic" },
  { id: "PCE", title: "Consumer Spending", category: "Economic" },
  { id: "JTSJOL", title: "Job Openings", category: "Economic" },
  { id: "HOUST", title: "Housing Starts", category: "Housing" },
  { id: "PERMIT", title: "Building Permits", category: "Housing" },
  { id: "HSN1F", title: "New Home Sales", category: "Housing" },
  { id: "EXHOSLUSM495S", title: "Existing Home Sales", category: "Housing" },
  { id: "CSUSHPISA", title: "House Price Index", category: "Housing" },
  { id: "MORTGAGE30US", title: "Mortgage Rate", category: "Housing" },
  { id: "FEDFUNDS", title: "Federal Funds Rate", category: "Financial" },
  { id: "DGS10", title: "10-Year Treasury", category: "Financial" },
  { id: "SP500", title: "S&P 500", category: "Financial" },
  { id: "VIXCLS", title: "VIX", category: "Financial" }
];

// Default indicators to show
const DEFAULT_INDICATORS = [
  "A191RL1Q225SBEA", "UNRATE", "CPIAUCSL", "PI", "PCE", "JTSJOL", "HOUST", "PERMIT"
];

interface KeyEconomicIndicatorsProps {
  data: FredSeriesData[];
  timeframe: string;
}

export function processIndicatorData(data: FredSeriesData[] = [], timeframe: string): FredSeriesData[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map(series => {
    if (!series || !series.observations) {
      return {
        id: '',
        title: '',
        units: '',
        frequency: '',
        observation_start: '',
        observation_end: '',
        last_updated: new Date().toISOString().split('T')[0],
        value: 0,
        previousValue: 0,
        change: 0,
        observations: [],
        monthOverMonthChange: 0,
        yearOverYearChange: 0
      };
    }

    // Sort observations by date
    const sortedObs = [...series.observations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedObs.length === 0) {
      return {
        ...series,
        value: 0,
        previousValue: 0,
        change: 0,
        monthOverMonthChange: 0,
        last_updated: new Date().toISOString().split('T')[0]
      };
    }

    // Get the latest value and date
    const latestValue = sortedObs[0].value;
    const latestDate = new Date(sortedObs[0].date);

    // Calculate changes based on the timeframe
    let currentValue = latestValue;
    let monthOverMonthChange = 0;
    let yearOverYearChange = 0;
    let previousMonthValue = latestValue;
    let previousQuarterValue = latestValue;

    // Check if this is a quarterly indicator
    const isQuarterly = series.frequency === 'Quarterly' || 
                       series.title === 'GDP Growth' ||
                       series.title === 'House Price Index' ||
                       series.title === 'Federal Funds Rate';

    if (isQuarterly) {
      // For quarterly indicators, find the previous quarter's value
      const previousQuarter = new Date(latestDate);
      previousQuarter.setMonth(previousQuarter.getMonth() - 3);
      const previousQuarterObs = sortedObs.find(obs => {
        const obsDate = new Date(obs.date);
        return obsDate.getMonth() === previousQuarter.getMonth() && 
               obsDate.getFullYear() === previousQuarter.getFullYear();
      });
      previousQuarterValue = previousQuarterObs?.value || latestValue;

      // Find the same quarter last year's value
      const lastYear = new Date(latestDate);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const lastYearObs = sortedObs.find(obs => {
        const obsDate = new Date(obs.date);
        return obsDate.getMonth() === lastYear.getMonth() && 
               obsDate.getFullYear() === lastYear.getFullYear();
      });
      const lastYearValue = lastYearObs?.value || latestValue;

      // Calculate percentage changes
      monthOverMonthChange = ((latestValue - previousQuarterValue) / previousQuarterValue) * 100;
      yearOverYearChange = lastYearValue !== 0 ? ((latestValue - lastYearValue) / lastYearValue) * 100 : 0;
    } else {
      // For monthly indicators, find the previous month's value
      const previousMonth = new Date(latestDate);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthObs = sortedObs.find(obs => {
        const obsDate = new Date(obs.date);
        return obsDate.getMonth() === previousMonth.getMonth() && 
               obsDate.getFullYear() === previousMonth.getFullYear();
      });
      previousMonthValue = previousMonthObs?.value || latestValue;

      // Find the same month last year's value
      const lastYear = new Date(latestDate);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const lastYearObs = sortedObs.find(obs => {
        const obsDate = new Date(obs.date);
        return obsDate.getMonth() === lastYear.getMonth() && 
               obsDate.getFullYear() === lastYear.getFullYear();
      });
      const lastYearValue = lastYearObs?.value || latestValue;

      // Calculate percentage changes
      monthOverMonthChange = ((latestValue - previousMonthValue) / previousMonthValue) * 100;
      yearOverYearChange = lastYearValue !== 0 ? ((latestValue - lastYearValue) / lastYearValue) * 100 : 0;
    }

    // Get the appropriate value based on timeframe
    let displayValue = latestValue;
    let displayPreviousValue = isQuarterly ? 
      (new Date(latestDate).getMonth() % 3 === 0 ? latestValue : previousQuarterValue) : 
      previousMonthValue;
    let displayChange = monthOverMonthChange;
    let displayYoYChange = yearOverYearChange;

    // Calculate 1-year YoY change that will be used for all timeframes under 1 year
    const currentPeriodObs = sortedObs.slice(0, 6);
    const previousPeriodObs = sortedObs.slice(6);
    
    let oneYearYoYChange = 0;
    if (currentPeriodObs.length > 0 && previousPeriodObs.length > 0) {
      const currentAvg = currentPeriodObs.reduce((sum: number, obs: FredObservation) => sum + obs.value, 0) / currentPeriodObs.length;
      const previousAvg = previousPeriodObs.reduce((sum: number, obs: FredObservation) => sum + obs.value, 0) / previousPeriodObs.length;
      oneYearYoYChange = previousAvg !== 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
    }

    // Calculate changes based on timeframe
    switch (timeframe) {
      case '1M':
        // For 1M, use the actual month-over-month or quarter-over-quarter change
        displayValue = latestValue;
        displayChange = monthOverMonthChange;
        displayYoYChange = yearOverYearChange;
        break;

      case '3M':
        // For 3M, calculate average of last 3 months vs previous 3 months
        const threeMonthsAgo = new Date(latestDate);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthObs = sortedObs.filter(obs => new Date(obs.date) >= threeMonthsAgo);
        const previousThreeMonthsObs = sortedObs.filter(obs => {
          const obsDate = new Date(obs.date);
          return obsDate >= new Date(threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)) && 
                 obsDate < threeMonthsAgo;
        });
        
        if (threeMonthObs.length > 0) {
          displayValue = threeMonthObs.reduce((sum, obs) => sum + obs.value, 0) / threeMonthObs.length;
        }
        if (previousThreeMonthsObs.length > 0) {
          displayPreviousValue = previousThreeMonthsObs.reduce((sum, obs) => sum + obs.value, 0) / previousThreeMonthsObs.length;
        }
        if (displayPreviousValue !== 0) {
          displayChange = ((displayValue - displayPreviousValue) / displayPreviousValue) * 100;
        }
        break;

      case '6M':
        // For 6M, calculate average of last 6 months vs previous 6 months
        const sixMonthsAgo = new Date(latestDate);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthObs = sortedObs.filter(obs => new Date(obs.date) >= sixMonthsAgo);
        const previousSixMonthsObs = sortedObs.filter(obs => {
          const obsDate = new Date(obs.date);
          return obsDate >= new Date(sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)) && 
                 obsDate < sixMonthsAgo;
        });
        
        if (sixMonthObs.length > 0) {
          displayValue = sixMonthObs.reduce((sum, obs) => sum + obs.value, 0) / sixMonthObs.length;
        }
        if (previousSixMonthsObs.length > 0) {
          displayPreviousValue = previousSixMonthsObs.reduce((sum, obs) => sum + obs.value, 0) / previousSixMonthsObs.length;
        }
        if (displayPreviousValue !== 0) {
          displayChange = ((displayValue - displayPreviousValue) / displayPreviousValue) * 100;
        }
        break;

      case '1Y':
        // For 1Y, calculate average of last 12 months vs previous 12 months
        const oneYearAgo = new Date(latestDate);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearObs = sortedObs.filter(obs => new Date(obs.date) >= oneYearAgo);
        const previousYearObs = sortedObs.filter(obs => {
          const obsDate = new Date(obs.date);
          return obsDate >= new Date(oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)) && 
                 obsDate < oneYearAgo;
        });
        
        if (oneYearObs.length > 0) {
          displayValue = oneYearObs.reduce((sum, obs) => sum + obs.value, 0) / oneYearObs.length;
        }
        if (previousYearObs.length > 0) {
          displayPreviousValue = previousYearObs.reduce((sum, obs) => sum + obs.value, 0) / previousYearObs.length;
        }
        if (displayPreviousValue !== 0) {
          displayChange = ((displayValue - displayPreviousValue) / displayPreviousValue) * 100;
        }
        break;
    }

    // Special handling for different indicators
    switch (series.title) {
      case 'Inflation Rate':
        // Calculate inflation rate as percentage change in CPI
        const cpiValue = displayValue;
        const previousCpiValue = displayPreviousValue;
        const inflationRate = previousCpiValue !== 0 ? ((cpiValue - previousCpiValue) / previousCpiValue) * 100 : 0;
        return {
          ...series,
          value: inflationRate,
          previousValue: previousCpiValue,
          change: displayChange,
          monthOverMonthChange,
          yearOverYearChange: oneYearYoYChange,
          last_updated: latestDate.toISOString().split('T')[0]
        };

      case 'GDP Growth':
        // For GDP Growth, we want to show the latest quarterly growth rate
        // and calculate changes based on quarterly data
        const quarterlyObs = sortedObs.filter(obs => {
          const date = new Date(obs.date);
          // Only include data from the first month of each quarter
          return date.getMonth() % 3 === 0;
        });

        if (quarterlyObs.length >= 2) {
          const latestQuarter = quarterlyObs[0].value;
          const previousQuarter = quarterlyObs[1].value;
          monthOverMonthChange = ((latestQuarter - previousQuarter) / previousQuarter) * 100;
        }

        // For YoY change, compare with the same quarter last year
        const lastYearQuarter = quarterlyObs.find(obs => {
          const date = new Date(obs.date);
          const targetDate = new Date(latestDate);
          targetDate.setFullYear(targetDate.getFullYear() - 1);
          return date.getMonth() === targetDate.getMonth() && 
                 date.getFullYear() === targetDate.getFullYear();
        });
        yearOverYearChange = lastYearQuarter ? 
          ((latestValue - lastYearQuarter.value) / lastYearQuarter.value) * 100 : 0;

        return {
          ...series,
          value: latestValue,
          previousValue: previousMonthValue,
          change: displayChange,
          monthOverMonthChange,
          yearOverYearChange,
          last_updated: latestDate.toISOString().split('T')[0],
          frequency: 'Quarterly' // Add this to indicate quarterly reporting
        };

      case 'House Price Index':
      case 'Federal Funds Rate':
      case 'S&P 500':
      case 'VIX':
      case 'New Home Sales':
      case 'Existing Home Sales':
      case 'Mortgage Rate':
      case '10-Year Treasury':
      case 'Personal Income':
      case 'Consumer Spending':
      case 'Job Openings':
      case 'Housing Starts':
      case 'Building Permits':
      case 'Unemployment Rate':
        // For all indicators, show the percentage change for the selected timeframe
        return {
          ...series,
          value: displayChange,
          previousValue: displayPreviousValue,
          change: displayChange,
          monthOverMonthChange,
          yearOverYearChange: yearOverYearChange,
          last_updated: latestDate.toISOString().split('T')[0]
        };

      default:
        return {
          ...series,
          value: displayChange,
          previousValue: displayPreviousValue,
          change: displayChange,
          monthOverMonthChange,
          yearOverYearChange: yearOverYearChange,
          last_updated: latestDate.toISOString().split('T')[0]
        };
    }
  });
}

const formatValue = (value: number, title: string, timeframe: string): string => {
  // All values should be shown as percentages with 2 decimal places
  return `${value.toFixed(2)}%`;
}

const getTrendColor = (change: number): string => {
  if (change > 5) return 'bg-green-600'
  if (change > 2) return 'bg-green-500'
  if (change > 0) return 'bg-green-400'
  if (change === 0) return 'bg-gray-500'
  if (change > -2) return 'bg-red-400'
  if (change > -5) return 'bg-red-500'
  return 'bg-red-600'
}

export function KeyEconomicIndicators({ data = [], timeframe }: KeyEconomicIndicatorsProps) {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(() => {
    // Try to get saved preferences from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedIndicators');
      return saved ? JSON.parse(saved) : DEFAULT_INDICATORS;
    }
    return DEFAULT_INDICATORS;
  });

  // Add state for pinned indicators
  const [pinnedIndicators, setPinnedIndicators] = useState<string[]>(() => {
    // Try to get saved pin preferences from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinnedIndicators');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save preferences to localStorage when they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedIndicators', JSON.stringify(selectedIndicators));
    }
  }, [selectedIndicators]);

  // Save pinned indicators to localStorage when they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinnedIndicators', JSON.stringify(pinnedIndicators));
    }
  }, [pinnedIndicators]);

  // Validate data before processing - wrapped in useMemo
  const validData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);
  
  const processedData = useMemo(() => {
    try {
      return processIndicatorData(validData, timeframe);
    } catch (error) {
      return [];
    }
  }, [validData, timeframe]);

  // Filter data based on selected indicators and sort by pinned status
  const displayData = useMemo(() => {
    const filteredData = processedData.filter(series => selectedIndicators.includes(series.id));
    
    // Sort the data so pinned indicators appear first
    return filteredData.sort((a, b) => {
      const aIsPinned = pinnedIndicators.includes(a.id);
      const bIsPinned = pinnedIndicators.includes(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });
  }, [processedData, selectedIndicators, pinnedIndicators]);

  const toggleIndicator = (indicatorId: string) => {
    setSelectedIndicators(prev => {
      if (prev.includes(indicatorId)) {
        return prev.filter(id => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Function to toggle pin status
  const togglePin = (indicatorId: string) => {
    setPinnedIndicators(prev => {
      if (prev.includes(indicatorId)) {
        return prev.filter(id => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Show loading state when no data is available
  if (!validData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Economic Indicators</CardTitle>
          <CardDescription>Loading economic data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <div className="animate-pulse">Loading indicators...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Key Economic Indicators</CardTitle>
            <CardDescription>Current values and recent changes</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Customize your dashboard</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Customize Your Dashboard</DialogTitle>
                  <DialogDescription>
                    Add or remove indicators to create your personalized dashboard. Select the economic indicators that matter most to you.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {Object.entries(
                      AVAILABLE_INDICATORS.reduce((acc, indicator) => {
                        if (!acc[indicator.category]) {
                          acc[indicator.category] = [];
                        }
                        acc[indicator.category].push(indicator);
                        return acc;
                      }, {} as Record<string, typeof AVAILABLE_INDICATORS>)
                    ).map(([category, indicators]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium">{category}</h4>
                        <div className="space-y-2">
                          {indicators.map((indicator) => (
                            <div key={indicator.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={indicator.id}
                                checked={selectedIndicators.includes(indicator.id)}
                                onCheckedChange={() => toggleIndicator(indicator.id)}
                              />
                              <label
                                htmlFor={indicator.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {indicator.title}
                              </label>
                              <div className="ml-auto flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    togglePin(indicator.id);
                                  }}
                                >
                                  <Pin
                                    className={cn(
                                      "h-3 w-3",
                                      pinnedIndicators.includes(indicator.id)
                                        ? "fill-current text-blue-500"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayData.map((series) => (
            <Card 
              key={series.id} 
              className={cn(
                "bg-background/50 backdrop-blur-sm relative",
                series.change > 0 ? "border-green-500 border-4" : "border-red-500 border-4"
              )}
            >
              {/* Pin indicator */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-70 hover:opacity-100 z-10"
                onClick={() => togglePin(series.id)}
                title={pinnedIndicators.includes(series.id) ? "Unpin indicator" : "Pin indicator"}
              >
                <Pin
                  className={cn(
                    "h-4 w-4",
                    pinnedIndicators.includes(series.id)
                      ? "fill-current text-blue-500"
                      : "text-muted-foreground"
                  )}
                />
              </Button>

              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium">{series.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Last updated: {series.last_updated}
                    </CardDescription>
                  </div>
                  {(series.frequency === 'Quarterly' || 
                    series.title === 'GDP Growth' ||
                    series.title === 'House Price Index' ||
                    series.title === 'Federal Funds Rate') && (
                    <span className="text-xs text-muted-foreground">
                      Reported quarterly
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {/* Current Value */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {formatValue(series.value, series.title, timeframe)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeframe === '1M' ? 'Monthly Change' : 
                       timeframe === '3M' ? '3-Month Change' :
                       timeframe === '6M' ? '6-Month Change' :
                       'Yearly Change'}
                    </span>
                  </div>

                  {/* Changes */}
                  <div className="space-y-1">
                    {/* Month over Month Change */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {(series.frequency === 'Quarterly' || 
                          series.title === 'GDP Growth' ||
                          series.title === 'House Price Index' ||
                          series.title === 'Federal Funds Rate') ? 'QoQ Change' : 'MoM Change'}
                      </span>
                      <span className={cn(
                        "font-medium",
                        series.monthOverMonthChange > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {series.monthOverMonthChange > 0 ? '+' : ''}
                        {series.monthOverMonthChange.toFixed(2)}%
                      </span>
                    </div>

                    {/* Year over Year Change */}
                    {series.yearOverYearChange !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {series.title === 'GDP Growth' ? 'Year-over-Year Change' : 'YoY Change'}
                        </span>
                        <span className={cn(
                          "font-medium",
                          series.yearOverYearChange > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {series.yearOverYearChange > 0 ? '+' : ''}
                          {series.yearOverYearChange.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 