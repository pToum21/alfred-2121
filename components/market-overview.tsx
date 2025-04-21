import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp, TrendingDown, BarChart2, Building2, Home, Building, Factory } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateType = 'residential-originator' | 'real-estate-brokerage' | 'multifamily' | 'commercial';

interface StockData {
  name: string;
  fullName: string;
  change: number;
  formattedChange: string;
  isLoading: boolean;
  error?: string;
  category?: string;
}

// Define stock mappings
const stockMappings: Record<string, { name: string; fullName: string; category: string }> = {
  'UWMC': { name: 'UWMC', fullName: 'UWM Holdings Corporation', category: 'Residential Originators' },
  'RKT': { name: 'RKT', fullName: 'Rocket Companies Inc.', category: 'Residential Originators' },
  'COMP': { name: 'COMP', fullName: 'Compass Inc.', category: 'Real Estate Brokerage' },
  'EXPI': { name: 'EXPI', fullName: 'eXp World Holdings Inc.', category: 'Real Estate Brokerage' },
  'AVB': { name: 'AVB', fullName: 'AvalonBay Communities Inc.', category: 'Multifamily' },
  'EQR': { name: 'EQR', fullName: 'Equity Residential', category: 'Multifamily' },
  'MAA': { name: 'MAA', fullName: 'Mid-America Apartment Communities Inc.', category: 'Multifamily' },
  'PLD': { name: 'PLD', fullName: 'Prologis Inc.', category: 'Commercial' },
  'AMT': { name: 'AMT', fullName: 'American Tower Corporation', category: 'Commercial' },
  'CCI': { name: 'CCI', fullName: 'Crown Castle International Corp.', category: 'Commercial' }
};

const templates: Record<TemplateType, {
  name: string;
  stocks: Array<{ name: string; fullName: string; category?: string; }>
}> = {
  'residential-originator': {
  name: 'Residential Originator/Servicer',
  stocks: [
    { name: 'FNMA', fullName: 'Fannie Mae', category: 'Government Sponsored' },
    { name: 'FMCC', fullName: 'Freddie Mac', category: 'Government Sponsored' },
    { name: 'RKT', fullName: 'Rocket Companies', category: 'Originators' },
    { name: 'UWMC', fullName: 'UWM Holdings', category: 'Originators' },
    { name: 'LDI', fullName: 'loanDepot', category: 'Originators' },
    { name: 'COOP', fullName: 'Mr. Cooper Group', category: 'Servicers' },
    { name: 'PHM', fullName: 'PulteGroup', category: 'Servicers' }, // Replaced OCN
    { name: 'PFSI', fullName: 'PennyMac Financial Services', category: 'Servicers' },
    { name: 'TREE', fullName: 'LendingTree', category: 'Marketplace' },
  ]
},
  'real-estate-brokerage': {
    name: 'Residential Real Estate Brokerage',
    stocks: [
      { name: 'RMAX', fullName: 'RE/MAX Holdings', category: 'Traditional Brokerage' },
      { name: 'DHI', fullName: 'D.R. Horton', category: 'Traditional Brokerage' },
      { name: 'ZG', fullName: 'Zillow Group', category: 'Tech-Enabled' },
      { name: 'RDFN', fullName: 'Redfin', category: 'Tech-Enabled' },
      { name: 'EXPI', fullName: 'eXp World Holdings', category: 'Tech-Enabled' },
      { name: 'OPEN', fullName: 'Opendoor Technologies', category: 'iBuying' },
      { name: 'CBRE', fullName: 'CBRE Group', category: 'Commercial' },
      { name: 'KW', fullName: 'Kennedy-Wilson Holdings', category: 'Commercial' },
      { name: 'COMP', fullName: 'Compass', category: 'Tech-Enabled' },
      { name: 'HOUS', fullName: 'Anywhere Real Estate', category: 'Traditional Brokerage' },
    ]
  },
  'multifamily': {
    name: 'Multifamily Originator/Servicer',
    stocks: [
      { name: 'EQR', fullName: 'Equity Residential', category: 'REITs' },
      { name: 'AVB', fullName: 'AvalonBay Communities', category: 'REITs' },
      { name: 'ESS', fullName: 'Essex Property Trust', category: 'REITs' },
      { name: 'MAA', fullName: 'Mid-America Apartment', category: 'REITs' },
      { name: 'UDR', fullName: 'UDR Inc', category: 'REITs' },
      { name: 'CPT', fullName: 'Camden Property Trust', category: 'REITs' },
      { name: 'AIV', fullName: 'Apartment Investment and Management', category: 'REITs' },
      { name: 'ELS', fullName: 'Equity LifeStyle Properties', category: 'REITs' },
      { name: 'NXRT', fullName: 'NexPoint Residential Trust', category: 'REITs' },
      { name: 'IRT', fullName: 'Independence Realty Trust', category: 'REITs' },
    ]
  },
  'commercial': {
    name: 'Commercial Real Estate Brokerage & Asset Mgr',
    stocks: [
      { name: 'CBRE', fullName: 'CBRE Group', category: 'Brokerage' },
      { name: 'JLL', fullName: 'Jones Lang LaSalle', category: 'Brokerage' },
      { name: 'CWK', fullName: 'Cushman & Wakefield', category: 'Brokerage' },
      { name: 'BXP', fullName: 'Boston Properties', category: 'Investment' },
      { name: 'BX', fullName: 'Blackstone', category: 'Asset Management' },
      { name: 'KKR', fullName: 'KKR & Co', category: 'Asset Management' },
      { name: 'APO', fullName: 'Apollo Global Management', category: 'Asset Management' },
      { name: 'CG', fullName: 'The Carlyle Group', category: 'Asset Management' },
      { name: 'BAM', fullName: 'Brookfield Asset Management', category: 'Asset Management' },
      { name: 'VICI', fullName: 'VICI Properties', category: 'REITs' },
    ]
  },
};

interface MarketOverviewProps {
  initialTemplate?: TemplateType;
  onTemplateChange?: (template: TemplateType) => void;
}

// Create a separate component for the stock card to minimize re-renders
const StockCard = React.memo(({ stock }: { stock: StockData }) => {
  // Determine the trend icon and color based on the change
  const getTrendIcon = () => {
    if (stock.change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (stock.change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart2 className="h-4 w-4 text-gray-500" />;
  };

  // Determine the text color based on the change
  const getTextColor = () => {
    if (stock.change > 0) return 'text-green-500';
    if (stock.change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Determine the background color based on the change
  const getBgColor = () => {
    if (stock.change > 0) return 'bg-green-50 dark:bg-green-900/20';
    if (stock.change < 0) return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-gray-50 dark:bg-gray-800/50';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-base">{stock.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{stock.fullName}</div>
        </div>
        <div className={`flex items-center ${getTextColor()} ${getBgColor()} px-2 py-1 rounded-md`}>
          {stock.isLoading ? (
            <Spinner className="h-4 w-4" />
          ) : stock.error ? (
            <span className="text-xs">N/A</span>
          ) : (
            <>
              {getTrendIcon()}
              <span className="ml-1 font-medium">{stock.formattedChange}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

StockCard.displayName = 'StockCard';

// Create a separate component for the stock data fetching logic
const StockDataFetcher = ({ template, onDataChange }: { template: TemplateType, onDataChange: (data: StockData[]) => void }) => {
  const isMounted = useRef(true);
  const currentTemplate = useRef(template);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch stock data
  const fetchStockData = useCallback(async (templateToFetch: TemplateType) => {
    if (!isMounted.current) return;
    
    console.log('Fetching stock data for template:', templateToFetch);
    
    try {
      // Initialize stock data with loading state
      const initialData = templates[templateToFetch].stocks.map(stock => ({
        name: stock.name,
        fullName: stock.fullName,
        change: 0,
        formattedChange: '0.00',
        isLoading: true,
        category: stock.category
      }));
      
      onDataChange(initialData);
      
      // Fetch data for each stock
      const fetchPromises = templates[templateToFetch].stocks.map(async (stock) => {
        try {
          console.log(`Fetching data for ${stock.name}...`);
          const response = await fetch(`/api/stock?symbol=${stock.name}`);
          
          if (!response.ok) {
            console.error(`Failed to fetch stock data for ${stock.name}: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch stock data for ${stock.name}`);
          }
          
          const data = await response.json();
          console.log(`Received data for ${stock.name}:`, data);
          
          return {
            name: stock.name,
            fullName: stock.fullName,
            change: data.change,
            formattedChange: data.formattedChange,
            isLoading: false,
            category: stock.category
          };
        } catch (err) {
          console.error(`Error fetching stock data for ${stock.name}:`, err);
          return {
            name: stock.name,
            fullName: stock.fullName,
            change: 0,
            formattedChange: 'N/A',
            isLoading: false,
            error: 'Data unavailable',
            category: stock.category
          };
        }
      });
      
      const results = await Promise.all(fetchPromises);
      console.log('All stock data fetched:', results.length, 'stocks');
      
      if (isMounted.current) {
        onDataChange(results);
      }
    } catch (err) {
      console.error('Error in fetchStockData:', err);
      // Handle error silently
    }
  }, [onDataChange]);

  // Set up the refresh interval
  useEffect(() => {
    isMounted.current = true;
    
    // Set up the refresh interval
    refreshInterval.current = setInterval(() => {
      if (isMounted.current) {
        fetchStockData(currentTemplate.current);
      }
    }, 5 * 60 * 1000);
    
    // Initial fetch
    fetchStockData(template);
    
    // Clean up the interval when the component unmounts
    return () => {
      isMounted.current = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [fetchStockData, template]);
  
  // Update the current template reference when it changes
  useEffect(() => {
    currentTemplate.current = template;
    
    // Clear any existing timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }
    
    // Set a timeout to debounce the fetching
    fetchTimeout.current = setTimeout(() => {
      fetchStockData(template);
    }, 300);
  }, [template, fetchStockData]);

  // This component doesn't render anything
  return null;
};

// Main component that doesn't re-render when stock data changes
const MarketOverview = memo(({ initialTemplate = 'residential-originator', onTemplateChange }: MarketOverviewProps) => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentTemplate, setCurrentTemplate] = useState<TemplateType>(initialTemplate);
  
  console.log('MarketOverview component initialized with template:', initialTemplate);
  
  // Handle data changes from the fetcher
  const handleDataChange = useCallback((data: StockData[]) => {
    console.log('Stock data received:', data.length, 'stocks');
    setStockData(data);
    setIsLoading(false);
  }, []);

  // Handle template change
  const handleTemplateChange = useCallback((value: string) => {
    const newTemplate = value as TemplateType;
    setCurrentTemplate(newTemplate);
    if (onTemplateChange) {
      onTemplateChange(newTemplate);
    }
  }, [onTemplateChange]);

  // Group stocks by category
  const groupedStocks = useMemo(() => {
    const groups: Record<string, StockData[]> = {};
    
    stockData.forEach(stock => {
      const category = stock.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(stock);
    });
    
    return groups;
  }, [stockData]);

  // Get all unique categories
  const categories = useMemo(() => {
    return Object.keys(groupedStocks);
  }, [groupedStocks]);

  // Get top performers and worst performers
  const { topPerformers, worstPerformers } = useMemo(() => {
    const sortedStocks = [...stockData].sort((a, b) => b.change - a.change);
    return {
      topPerformers: sortedStocks.slice(0, 3),
      worstPerformers: sortedStocks.slice(-3).reverse()
    };
  }, [stockData]);

  // Get template icon
  const getTemplateIcon = () => {
    switch (currentTemplate) {
      case 'residential-originator':
        return <Home className="h-5 w-5" />;
      case 'real-estate-brokerage':
        return <Building2 className="h-5 w-5" />;
      case 'multifamily':
        return <Building className="h-5 w-5" />;
      case 'commercial':
        return <Factory className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <StockDataFetcher template={currentTemplate} onDataChange={handleDataChange} />
      
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              {getTemplateIcon()}
            </div>
            <div>
              <CardTitle>Real Estate Market Overview</CardTitle>
              <CardDescription>Performance metrics for key real estate stocks</CardDescription>
            </div>
          </div>
          <Select
            value={currentTemplate}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential-originator">Residential Originators</SelectItem>
              <SelectItem value="real-estate-brokerage">Real Estate Brokerage</SelectItem>
              <SelectItem value="multifamily">Multifamily</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner className="h-8 w-8" label="Loading stock market data..." />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Top Performers */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {topPerformers.map((stock) => (
                      <div key={stock.name} className="flex items-center justify-between p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-xs font-bold text-green-700 dark:text-green-300">
                              {stock.name.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{stock.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.fullName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            +{stock.formattedChange}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Worst Performers */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    Worst Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {worstPerformers.map((stock) => (
                      <div key={stock.name} className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <span className="text-xs font-bold text-red-700 dark:text-red-300">
                              {stock.name.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{stock.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.fullName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">
                            {stock.formattedChange}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market View Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-2">All Stocks</TabsTrigger>
                <TabsTrigger value="by-category" className="text-xs sm:text-sm py-2">By Category</TabsTrigger>
                <TabsTrigger value="market-segments" className="text-xs sm:text-sm py-2">Market Segments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stockData.map((stock) => (
                    <Card key={stock.name} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-bold text-muted-foreground">
                                {stock.name.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{stock.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.fullName}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "text-sm font-medium",
                            stock.change > 0 ? "text-green-600 dark:text-green-400" :
                            stock.change < 0 ? "text-red-600 dark:text-red-400" :
                            "text-muted-foreground"
                          )}>
                            {stock.change > 0 ? '+' : ''}{stock.formattedChange}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="by-category" className="mt-4">
                <div className="space-y-6">
                  {Object.entries(groupedStocks).map(([category, stocks]) => {
                    const avgChange = stocks.reduce((sum, stock) => sum + stock.change, 0) / stocks.length;
                    const isPositive = avgChange > 0;
                    
                    return (
                      <Card key={category}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{category}</CardTitle>
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {avgChange > 0 ? '+' : ''}{avgChange.toFixed(2)}%
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {stocks.map((stock) => (
                              <div key={stock.name} className="p-3 rounded-lg border hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                      <span className="text-xs font-bold text-muted-foreground">
                                        {stock.name.slice(0, 2)}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{stock.name}</p>
                                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.fullName}</p>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "text-sm font-medium",
                                    stock.change > 0 ? "text-green-600 dark:text-green-400" :
                                    stock.change < 0 ? "text-red-600 dark:text-red-400" :
                                    "text-muted-foreground"
                                  )}>
                                    {stock.change > 0 ? '+' : ''}{stock.formattedChange}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="market-segments" className="mt-4">
                <div className="space-y-4">
                  {Object.entries(groupedStocks).map(([category, stocks]) => {
                    const avgChange = stocks.reduce((sum, stock) => sum + stock.change, 0) / stocks.length;
                    const isPositive = avgChange > 0;
                    
                    return (
                      <Card key={category}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{category}</CardTitle>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-medium",
                                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {avgChange > 0 ? '+' : ''}{avgChange.toFixed(2)}%
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stocks.map((stock) => (
                              <div key={stock.name} className="p-3 rounded-lg border hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                      <span className="text-xs font-bold text-muted-foreground">
                                        {stock.name.slice(0, 2)}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{stock.name}</p>
                                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.fullName}</p>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "text-sm font-medium",
                                    stock.change > 0 ? "text-green-600 dark:text-green-400" :
                                    stock.change < 0 ? "text-red-600 dark:text-red-400" :
                                    "text-muted-foreground"
                                  )}>
                                    {stock.change > 0 ? '+' : ''}{stock.formattedChange}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MarketOverview.displayName = 'MarketOverview';

export { MarketOverview }; 