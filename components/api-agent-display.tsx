'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FREDChart } from './fred-chart';
import { Loader2, ChevronDown, ChevronRight, CheckCircle2, ArrowRightCircle, Code2, BarChart, ExternalLink, FileText, DollarSign, Building2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MemoizedReactMarkdown } from '@/components/ui/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from './ui/spinner';
import { Michroma } from 'next/font/google';

const michroma = Michroma({ 
  weight: '400',
  subsets: ['latin'],
});

export interface ApiAgentStep {
  step_type: string;
  content: any;
  state: string;
  step_id?: string;
}

type DataSource = 'FRED' | 'BLS' | 'HMDA' | 'SEC' | 'CFPB';

const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const parseMarkdown = (text: any): string => {
  // If input is not a string, convert it to string
  const content = typeof text === 'string' ? text : JSON.stringify(text);
  
  try {
    return content
      // Links - Add this before other replacements
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4 space-y-1">$&</ul>')
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-sm font-semibold mt-2 mb-1 break-words">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mt-3 mb-2 break-words">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mt-4 mb-2 break-words">$1</h1>')
      // Code blocks
      .replace(/```(.*?)\n([\s\S]*?)```/g, '<pre class="bg-muted/50 p-2 rounded-sm text-[10px] font-mono mt-2 mb-2 whitespace-pre-wrap break-words overflow-x-auto">$2</pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-muted/50 px-1 rounded-sm font-mono text-[10px] break-all">$1</code>')
      // Paragraphs - ensure they break words and wrap
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p class="mb-2 break-words whitespace-pre-wrap">${para}</p>`)
      .join('\n');
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // If parsing fails, return a pre-formatted block with the content
    return `<pre class="whitespace-pre-wrap break-words overflow-x-auto bg-muted/50 p-2 rounded-sm text-[10px] font-mono">${String(content)}</pre>`;
  }
};

export interface ApiAgentDisplayProps {
  steps: ApiAgentStep[];
  currentStep?: number;
  totalSteps?: number;
}

const getStepTitle = (step_type: string) => {
  switch (step_type) {
    case 'user_query':
      return 'Query';
    case 'analysis_plan':
      return 'Analysis Plan';
    case 'api_call':
      return 'API Request';
    case 'api_response':
      return 'Data Processing';
    case 'api_analysis':
      return 'Analysis';
    case 'final_analysis':
      return 'Final Analysis';
    default:
      return step_type;
  }
};

interface StepState {
  id: string;
  isComplete: boolean;
}

// Add URL mapping for each source type
const SOURCE_URLS = {
  FRED: (id: string) => `https://fred.stlouisfed.org/series/${id}`,
  BLS: (id: string) => `https://data.bls.gov/timeseries/${id}`,
  HMDA: (id: string) => `https://ffiec.cfpb.gov/data-browser/data/browse/${id}`,
  SEC: (id: string) => `https://www.sec.gov/edgar/browse/?CIK=${id}`,
  CFPB: (id: string) => `https://www.consumerfinance.gov/data-research/consumer-complaints/search/detail/${id}`
};

// Update the SOURCE_COLORS constant to use more subtle colors
const SOURCE_COLORS = {
  FRED: 'bg-secondary text-secondary-foreground border-border',
  BLS: 'bg-secondary text-secondary-foreground border-border',
  HMDA: 'bg-secondary text-secondary-foreground border-border',
  SEC: 'bg-secondary text-secondary-foreground border-border',
  CFPB: 'bg-secondary text-secondary-foreground border-border',
  Search: 'bg-secondary text-secondary-foreground border-border',
  API: 'bg-secondary text-secondary-foreground border-border'
} as const;

// Add HMDA action type mapping
const HMDA_ACTION_TYPES = {
  '1': 'Loan originated',
  '2': 'Application approved but not accepted',
  '3': 'Application denied',
  '4': 'Application withdrawn by applicant',
  '5': 'File closed for incompleteness',
  '6': 'Purchased loan',
  '7': 'Preapproval request denied',
  '8': 'Preapproval request approved but not accepted'
} as const;

export const ApiAgentDisplay = ({ steps, currentStep = 0, totalSteps = steps.length }: ApiAgentDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<StepState[]>([]);
  const [filteredSteps, setFilteredSteps] = useState<ApiAgentStep[]>([]);
  const [sources, setSources] = useState<{id: string; type: DataSource}[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastStepRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Extract sources from steps
  useEffect(() => {
    const newSources = new Set<string>();
    const sourcesWithTypes: {id: string; type: DataSource}[] = [];

    steps.forEach(step => {
      if (step.step_type === 'api_call' && typeof step.content === 'object') {
        // Extract from API calls
        const content = step.content;
        let sourceType: DataSource | undefined;
        let sourceId: string | undefined;

        if (content.function === 'get_fred_data') {
          sourceType = 'FRED';
          sourceId = content.parameters?.series_id;
        } else if (content.function === 'get_bls_data') {
          sourceType = 'BLS';
          sourceId = content.parameters?.series_id;
        } else if (content.function === 'get_hmda_data') {
          sourceType = 'HMDA';
          // Use year and state for HMDA source ID
          if (content.parameters?.years && content.parameters?.state) {
            sourceId = `${content.parameters.years}/${content.parameters.state}`;
          }
        } else if (content.function === 'get_sec_data') {
          sourceType = 'SEC';
          sourceId = content.parameters?.cik;
        } else if (content.function === 'get_cfpb_data') {
          sourceType = 'CFPB';
          sourceId = content.parameters?.complaint_id;
        }

        if (sourceType && sourceId && !newSources.has(`${sourceType}-${sourceId}`)) {
          newSources.add(`${sourceType}-${sourceId}`);
          sourcesWithTypes.push({
            id: sourceId,
            type: sourceType
          });
        }
      }

      // Also extract sources from API responses for HMDA
      if (step.step_type === 'api_response' && typeof step.content === 'object') {
        const content = step.content;
        if (content.response?.parameters && 'state' in content.response.parameters) {
          const params = content.response.parameters;
          const sourceId = `${params.years || '2022'}/${params.state}`;
          if (!newSources.has(`HMDA-${sourceId}`)) {
            newSources.add(`HMDA-${sourceId}`);
            sourcesWithTypes.push({
              id: sourceId,
              type: 'HMDA'
            });
          }
        }
      }
    });

    setSources(sourcesWithTypes);
  }, [steps]);

  // Filter steps and update completed steps when steps change
  useEffect(() => {
    // Filter out raw query steps
    const newFilteredSteps = steps.filter(step => {
      if (step.step_type === 'user_query' && typeof step.content === 'object' && 'input' in step.content) {
        return false;
      }
      return true;
    });
    setFilteredSteps(newFilteredSteps);

    // Update completed steps
    setCompletedSteps(prevSteps => {
      const newSteps = [...prevSteps];
      
      newFilteredSteps.forEach((step, index) => {
        if (newSteps.find(s => s.id === step.step_id)) {
          return;
        }

        if ((index < newFilteredSteps.length - 1 && newFilteredSteps[index + 1]) || step.state === 'complete') {
          newSteps.push({
            id: step.step_id || '',
            isComplete: true
          });
        }
      });

      return newSteps;
    });
  }, [steps]);

  // Handle scrolling when filtered steps change
  useEffect(() => {
    if (filteredSteps.length > 0 && lastStepRef.current && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      const lastStep = lastStepRef.current;
      
      requestAnimationFrame(() => {
        const scrollAreaHeight = scrollArea.clientHeight;
        const lastStepTop = lastStep.offsetTop;
        const lastStepHeight = lastStep.clientHeight;
        const currentScroll = scrollArea.scrollTop;
        const scrollAreaBottom = currentScroll + scrollAreaHeight;
        
        // Only scroll if the new step is below the visible area
        if (lastStepTop + lastStepHeight > scrollAreaBottom) {
          const targetScroll = lastStepTop - scrollAreaHeight + lastStepHeight + 16; // 16px padding
          scrollArea.scrollTo({
            top: targetScroll,
            behavior: currentScroll === 0 ? 'auto' : 'smooth' // Use auto for initial scroll
          });
        }
      });
    }
  }, [filteredSteps]);

  // Update the getStepStatus function
  const getStepStatus = (step: ApiAgentStep) => {
    const isComplete = completedSteps.some(s => s.id === step.step_id);
    
    if (isComplete) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }

    switch (step.state) {
      case 'planning':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />;
      case 'executing':
        return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
      case 'complete':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  // Update the step content rendering to use completion state
  const renderStepContent = (currentStep: ApiAgentStep, isStepComplete: boolean) => {
    switch (currentStep.step_type) {
      case 'user_query':
        try {
          const content = currentStep.content;
          if (typeof content === 'object' && content.input) {
            return (
              <div className="text-xs text-muted-foreground">
                {content.input.replace(/\\r\\n/g, '').replace(/\\n/g, '').trim()}
              </div>
            );
          }
          return null;
        } catch (error) {
          return null;
        }

      case 'analysis_plan':
        try {
          const content = currentStep.content;
          if (typeof content === 'string') {
            try {
              const parsed = JSON.parse(content);
              return (
                <div className="text-xs text-muted-foreground">
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(parsed.content) }} />
                </div>
              );
            } catch {
              return (
                <div className="text-xs text-muted-foreground">
                  <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                </div>
              );
            }
          }
          if (typeof content === 'object' && content.content) {
            return (
              <div className="text-xs text-muted-foreground">
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content.content) }} />
              </div>
            );
          }
          return null;
        } catch (error) {
          return null;
        }

      case 'api_call':
        try {
          const content = currentStep.content;
          if (content && typeof content === 'object') {
            const { function: functionName, ...params } = content;
            
            // Add special handling for state regulations search
            if (functionName === 'search_state_regulations') {
              const { state, topic, year } = params;
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['API']
                      )}>
                        Regulations
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Searching {state || 'state'} regulations{topic ? ` related to ${topic}` : ''}...
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      {state && <div>State: {state}</div>}
                      {topic && <div>Topic: {topic}</div>}
                      {year && <div>Year: {year}</div>}
                    </div>
                  </div>
                </div>
              );
            }
            
            // Special handling for SEC filings search
            if (functionName === 'search_sec_filings') {
              const { query, filters } = params;
              const companyName = filters?.company || 'specified company';
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['SEC']
                      )}>
                        SEC
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Searching SEC Filings for {companyName}...
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6">
                      <div>Query: {query}</div>
                      {filters && (
                        <div className="space-y-1 mt-1">
                          {filters.filing_type && <div>Filing Type: {filters.filing_type}</div>}
                          {filters.year && <div>Year: {filters.year}</div>}
                          {filters.filing_url && <div>URL: {filters.filing_url}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            
            // Determine the data source type from the function name
            let sourceType: DataSource | 'Search' = 'FRED'; // Add 'Search' as possible type
            if (functionName === 'search_time_series') {
              sourceType = 'Search';
            } else if (functionName.includes('bls')) {
              sourceType = 'BLS';
            } else if (functionName.includes('sec')) {
              sourceType = 'SEC';
            } else if (functionName.includes('hmda')) {
              sourceType = 'HMDA';
            } else if (functionName.includes('cfpb')) {
              sourceType = 'CFPB';
            }

            // Debug log to see what we're getting
            console.log('API Call Content:', {
              sourceType,
              function: functionName,
              parameters: params
            });

            // Create display message based on source type
            const getDisplayMessage = () => {
              switch (sourceType) {
                case 'Search':
                  return `Searching for ${params.query || 'datasets'}...`;
                case 'SEC':
                  return `Fetching company data...`;
                case 'HMDA':
                  const parts = [];
                  if (params.state) parts.push(`state: ${params.state}`);
                  if (params.years) parts.push(`year: ${params.years}`);
                  if (params.loan_type) parts.push(`type: ${params.loan_type.toLowerCase()}`);
                  if (params.loan_purpose) parts.push(`purpose: ${params.loan_purpose.toLowerCase()}`);
                  return parts.length > 0 
                    ? `Fetching HMDA data (${parts.join(', ')})`
                    : 'Fetching HMDA data...';
                default:
                  return `Fetching ${params.series_id || params.dataset_id} data...`;
              }
            };

            // Create parameter display based on source type
            const renderParameters = () => {
              switch (sourceType) {
                case 'Search':
                  return (
                    <div className="space-y-1">
                      <div>Query: {params.query}</div>
                      {params.source_filter && (
                        <div>Source: {params.source_filter}</div>
                      )}
                    </div>
                  );
                case 'SEC':
                  return (
                    <div>Company: {params.company_name || params.cik || 'Loading...'}</div>
                  );
                case 'HMDA':
                  const hmdaParams = params;
                  return (
                    <div className="space-y-1">
                      {hmdaParams.state && <div>State: {hmdaParams.state}</div>}
                      {hmdaParams.years && <div>Year: {hmdaParams.years}</div>}
                      {hmdaParams.loan_type && <div>Loan Type: {hmdaParams.loan_type}</div>}
                      {hmdaParams.loan_purpose && <div>Purpose: {hmdaParams.loan_purpose}</div>}
                      {hmdaParams.property_type && <div>Property Type: {hmdaParams.property_type}</div>}
                      {/* Only show URL preview if we have both state and years */}
                      {hmdaParams.state && hmdaParams.years && (
                        <div className="text-[9px] text-muted-foreground mt-1">
                          <span className="text-purple-600">URL:</span> {`${hmdaParams.state}/${hmdaParams.years}`}
                        </div>
                      )}
                    </div>
                  );
                default:
                  return (
                    <>
                      <div>Series: {params.series_id || params.dataset_id}</div>
                      {(params.start_date || params.start_year) && (
                        <div>From: {params.start_date || params.start_year}</div>
                      )}
                      {(params.end_date || params.end_year) && (
                        <div>To: {params.end_date || params.end_year}</div>
                      )}
                    </>
                  );
              }
            };

            // Add Search to SOURCE_COLORS
            const sourceColors = {
              ...SOURCE_COLORS,
              'Search': 'bg-blue-50/50 text-blue-600 border border-blue-200'
            };

            return (
              <div className="pl-3 border-l border-primary/20">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className={cn(
                    "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                    sourceColors[sourceType]
                  )}>
                    {sourceType}
                  </Badge>
                  <span className="text-muted-foreground">
                    {getDisplayMessage()}
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                  {renderParameters()}
                </div>
              </div>
            );
          }
        } catch (error) {
          console.error('Error in api_call:', error, currentStep);
          return null;
        }

      case 'api_response':
        try {
          const content = currentStep.content;
          if (!content) return null;

          let responseData;
          let functionName = '';
          let dataSource = 'API';
          
          if (typeof content === 'object') {
            functionName = content.function;
            
            // Add detailed logging here
            console.log('API Response Content:', {
              functionName,
              rawContent: content,
              responseType: typeof content.response,
            });
            
            // Handle nested JSON string in response
            if (typeof content.response === 'string') {
              try {
                responseData = JSON.parse(content.response);
                console.log('Parsed string response:', responseData);
              } catch (e) {
                responseData = content.response;
                console.log('Failed to parse string response:', content.response);
              }
            } else {
              responseData = content.response;
              console.log('Direct response data:', responseData);
            }

            // Add logging for state regulations detection
            const isStateRegulations = 
              functionName === 'search_state_regulations' || 
              (responseData?.results?.some((result: any) => 
                result.type === 'state_regulation' ||
                (result.metadata?.breadcrumb && result.metadata.breadcrumb.includes('State Regulations')) ||
                result.id?.includes('fl-Fla-Admin-Code') || 
                result.title?.includes('Fla. Admin. Code')
              ));

            console.log('State Regulations Detection:', {
              isStateRegulations,
              function: functionName,
              hasResults: !!responseData?.results,
              resultCount: responseData?.results?.length,
              firstResult: responseData?.results?.[0],
              detectionCriteria: {
                functionMatch: functionName === 'search_state_regulations',
                hasStateRegType: responseData?.results?.some((r: any) => r.type === 'state_regulation'),
                hasBreadcrumb: responseData?.results?.some((r: any) => r.metadata?.breadcrumb?.includes('State Regulations')),
                hasFloridaCode: responseData?.results?.some((r: any) => r.id?.includes('fl-Fla-Admin-Code')),
                hasFloridaTitle: responseData?.results?.some((r: any) => r.title?.includes('Fla. Admin. Code'))
              }
            });

            // Handle state regulations first
            if (isStateRegulations && responseData?.results) {
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        "bg-amber-50 text-amber-600 border border-amber-200"
                      )}>
                        State Regulations
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Found {responseData.results.length} relevant regulation{responseData.results.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                      {responseData.results.map((reg: any, idx: number) => {
                        // Extract metadata in a consistent way
                        const metadata = {
                          type: reg.type || reg.metadata?.type || 'State Regulation',
                          title: reg.metadata?.title || reg.title || '',
                          section: reg.metadata?.section || reg.section || reg.id?.split('-').slice(-1)[0] || 'Unknown',
                          content: reg.content || reg.metadata?.text || '',
                          url: reg.url || reg.metadata?.url || '',
                          id: reg.section_id || reg.id || '',
                          breadcrumb: reg.metadata?.breadcrumb?.split(' > ') || [],
                          lastUpdated: reg.last_updated || reg.metadata?.effective_date || null
                        };

                        return (
                          <div 
                            key={idx} 
                            className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden"
                          >
                            {/* Header */}
                            <div className="p-4 bg-muted/30">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-muted-foreground font-medium">
                                    {metadata.breadcrumb.length > 1 ? metadata.breadcrumb.slice(-2)[0] : metadata.type}
                                  </div>
                                  <h4 className="text-sm font-medium text-foreground">
                                    {metadata.title}
                                  </h4>
                                </div>
                                <Badge variant="outline" className="text-[9px] whitespace-nowrap bg-card">
                                  Section {metadata.section}
                                </Badge>
                              </div>
                            </div>

                            {/* Content */}
                            {metadata.content && (
                              <div className="p-4 border-t border-border/50">
                                <div className="text-[11px] text-muted-foreground leading-relaxed">
                                  {metadata.content}
                                </div>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {metadata.url && (
                                  <a 
                                    href={metadata.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                  >
                                    View Full Text <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  ID: {metadata.id}
                                </span>
                              </div>
                              {metadata.lastUpdated && (
                                <span className="text-[9px] text-muted-foreground">
                                  {reg.last_updated ? 
                                    `Updated: ${new Date(metadata.lastUpdated).toLocaleDateString()}` :
                                    `Effective: ${new Date(metadata.lastUpdated).toLocaleDateString()}`
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Search metadata */}
                    <div className="flex gap-2 text-[9px] text-muted-foreground border-t border-border/50 pt-3 mt-4">
                      <span>State: {responseData.state_filter || responseData.state || 'All'}</span>
                      <span>•</span>
                      <span>Query: "{responseData.query}"</span>
                      {responseData.year && (
                        <>
                          <span>•</span>
                          <span>Year: {responseData.year}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Then handle time series search results
            if (content.function === 'search_time_series' || (responseData?.query && !isStateRegulations)) {
              const searchData = responseData;
              
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['Search']
                      )}>
                        Search
                      </Badge>
                      <span className={cn(
                        "text-muted-foreground",
                        isStepComplete && "text-green-500"
                      )}>
                        {isStepComplete ? 'Results found' : 'Searching datasets...'}
                      </span>
                    </div>

                    {/* Results Summary */}
                    {isStepComplete && searchData.results && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-muted-foreground">
                          Found {searchData.results.length} matching series
                        </div>
                        
                        {/* Results */}
                        <div className="space-y-2">
                          {searchData.results.map((result: any, idx: number) => {
                            // Extract metadata in a consistent way
                            const metadata = {
                              id: result.id,
                              title: result.metadata?.title || result.title || '',
                              seasonalAdjustment: result.metadata?.seasonal_adjustment_short || '',
                              url: result.url || '',
                              source: result.source || result.metadata?.source || ''
                            };

                            return (
                              <div 
                                key={idx} 
                                className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden"
                              >
                                <div className="p-3 flex items-start justify-between gap-4">
                                  <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono text-blue-500">
                                        {metadata.id}
                                      </span>
                                      {metadata.seasonalAdjustment && (
                                        <Badge variant="outline" className="text-[9px] whitespace-nowrap bg-card">
                                          {metadata.seasonalAdjustment}
                                        </Badge>
                                      )}
                                      {metadata.source && (
                                        <Badge variant="secondary" className="text-[9px] whitespace-nowrap">
                                          {metadata.source}
                                        </Badge>
                                      )}
                                    </div>
                                    <h4 className="text-xs text-muted-foreground">
                                      {metadata.title}
                                    </h4>
                                  </div>
                                  {metadata.url && (
                                    <a 
                                      href={metadata.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-primary hover:underline flex items-center gap-1 shrink-0"
                                    >
                                      View Series <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Search metadata */}
                        <div className="flex gap-2 text-[9px] text-muted-foreground border-t border-border/50 pt-3">
                          <span>Source: {searchData.source_filter || 'All'}</span>
                          <span>•</span>
                          <span>Query: "{searchData.query}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Special handling for SEC filings search results
            if (functionName === 'search_sec_filings' && responseData?.results) {
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['SEC']
                      )}>
                        SEC
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Found {responseData.results.length} relevant filing{responseData.results.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3 pl-6">
                      {responseData.results.map((result: any, idx: number) => (
                        <div key={idx} className="text-xs space-y-1">
                          <div className="font-medium">{result.company || 'Unknown Company'}</div>
                          <div className="text-muted-foreground">
                            {result.filing_type} ({result.year})
                          </div>
                          <div className="text-muted-foreground text-[10px] bg-muted/50 p-2 rounded-sm whitespace-pre-wrap break-words">
                            {result.content}
                          </div>
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                          >
                            View Filing <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // Detect SEC data
            if (responseData?.company_info && responseData?.recent_filings) {
              const secData = responseData;
              
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-3">
                    {/* Header with SEC badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['SEC']
                      )}>
                        SEC
                      </Badge>
                      <span className={cn(
                        "text-muted-foreground",
                        isStepComplete && "text-green-500"
                      )}>
                        {isStepComplete ? 'Data received' : 'Processing data...'}
                      </span>
                    </div>

                    {/* Company Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium">{secData.company_info.name}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span>CIK: {secData.company_info.cik}</span>
                        <span>•</span>
                        <span>{secData.company_info.tickers.join(', ')}</span>
                        <span>•</span>
                        <span>{secData.company_info.exchanges.join(', ')}</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-medium text-muted-foreground">Key Metrics</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(secData.key_metrics).map(([key, data]: [string, any]) => (
                          <div 
                            key={key}
                            className="p-2 bg-muted/20 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3 text-purple-600" />
                              <span className="text-[10px] text-muted-foreground">{key}</span>
                            </div>
                            <div className="text-xs font-mono mt-1">
                              {typeof data.value === 'number' && data.value > 1000000
                                ? `$${(data.value / 1000000).toFixed(1)}M`
                                : data.value}
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              {new Date(data.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Filings */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-medium text-muted-foreground">Recent Filings</div>
                      <div className="space-y-1">
                        {secData.recent_filings.map((filing: any, index: number) => (
                          <a
                            key={index}
                            href={filing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-purple-600" />
                              <span className="text-[10px] font-medium">{filing.form}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(filing.filing_date).toLocaleDateString()}
                              </span>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            // Detect HMDA data
            else if (responseData?.parameters && 'state' in responseData.parameters) {
              dataSource = 'HMDA';
              const hmdaData = responseData;
              
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['HMDA']
                      )}>
                        HMDA
                      </Badge>
                      <span className={cn(
                        "text-muted-foreground",
                        isStepComplete && "text-green-500"
                      )}>
                        {isStepComplete ? 'Data received' : 'Processing data...'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>Parameters</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(hmdaData.parameters).map(([key, value], i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between text-[10px] font-mono p-1 bg-muted/20 rounded"
                          >
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                      {hmdaData.aggregations && (
                        <>
                          <div className="text-xs text-muted-foreground mt-2">
                            Aggregations
                          </div>
                          <div className="space-y-1">
                            {hmdaData.aggregations.map((agg: any, i: number) => (
                              <div 
                                key={i}
                                className="text-[10px] font-mono p-2 bg-muted/20 rounded space-y-1"
                              >
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-muted-foreground">Action:</span>
                                  <span className="text-right">
                                    <span className="font-medium">{HMDA_ACTION_TYPES[agg.actions_taken as keyof typeof HMDA_ACTION_TYPES]}</span>
                                    <span className="text-muted-foreground ml-1">({agg.actions_taken})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Count:</span>
                                  <span>{agg.count.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sum:</span>
                                  <span>${(agg.sum / 1e9).toFixed(2)}B</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            // Detect BLS data
            else if (responseData?.Results?.series?.[0]?.data) {
              dataSource = 'BLS';
              const blsData = responseData.Results.series[0].data;
              
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['BLS']
                      )}>
                        BLS
                      </Badge>
                      <span className={cn(
                        "text-muted-foreground",
                        isStepComplete && "text-green-500"
                      )}>
                        {isStepComplete ? 'Data received' : 'Processing data...'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>{blsData.length} observations</span>
                        <span>
                          {blsData[blsData.length - 1].periodName} {blsData[blsData.length - 1].year} to {blsData[0].periodName} {blsData[0].year}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {blsData.slice(0, 5).map((obs: any, i: number) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between text-[10px] font-mono p-1 bg-muted/20 rounded"
                          >
                            <span className="text-muted-foreground">{obs.periodName} {obs.year}:</span>
                            <span>{obs.value}%</span>
                          </div>
                        ))}
                        {blsData.length > 5 && (
                          <div className="text-center text-[10px] text-muted-foreground">
                            + {blsData.length - 5} more observations...
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] font-mono mt-2 p-1 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Total change:</span>
                          <span>{(Number(blsData[0].value) - Number(blsData[blsData.length - 1].value)).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            // Keep FRED data handling
            else if (responseData?.observations?.observations || responseData?.observations) {
              const observations = responseData.observations?.observations || responseData.observations;
              const metadata = responseData.metadata?.seriess?.[0] || {};
              const title = metadata.title || responseData.title || 'Time Series Data';
              const seriesId = metadata.id || responseData.id || 'Unknown';
              
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className={cn(
                          "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                          SOURCE_COLORS['FRED']
                        )}>
                          FRED
                        </Badge>
                        <span className={cn(
                          "text-muted-foreground",
                          isStepComplete && "text-green-500"
                        )}>
                          {isStepComplete ? 'Data received' : 'Processing data...'}
                        </span>
                      </div>
                      
                      {/* View toggle buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewMode('chart')}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-sm transition-colors",
                            viewMode === 'chart' 
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/50 text-muted-foreground"
                          )}
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-sm transition-colors",
                            viewMode === 'table' 
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/50 text-muted-foreground"
                          )}
                        >
                          Table
                        </button>
                      </div>
                    </div>

                    {/* Series Title */}
                    <div className="text-xs font-semibold text-foreground">
                      {title}
                    </div>
                    
                    {/* View content based on mode */}
                    <div className="h-[180px] relative">
                      {viewMode === 'chart' ? (
                        <div className="w-full h-full">
                          <FREDChart 
                            data={observations}
                            series={seriesId}
                            dataSource="FRED"
                            seriesTitle={title}
                            height={180}
                          />
                        </div>
                      ) : (
                        <div className="h-full overflow-y-auto">
                          <div className="text-xs text-muted-foreground flex items-center justify-between">
                            <span>{observations.length} observations</span>
                            <span>
                              {observations[0]?.date} to {observations[observations.length - 1]?.date}
                            </span>
                          </div>
                          <div className="space-y-1 mt-2">
                            {observations.map((obs: any, i: number) => (
                              <div 
                                key={i} 
                                className="flex items-center justify-between text-[10px] font-mono p-1 bg-muted/20 rounded"
                              >
                                <span className="text-muted-foreground">{obs.date}:</span>
                                <span>{obs.value}{metadata.units_short || ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add margin before summary stats */}
                    <div className="mt-2 flex justify-between text-[10px] font-mono p-1 bg-muted/30 rounded">
                      <span className="text-muted-foreground">Total change:</span>
                      <span>
                        {(Number(observations[observations.length - 1].value) - Number(observations[0].value)).toFixed(2)}
                        {metadata.units_short || ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Handle regular search results (non-regulations, non-time series)
            if (responseData?.results && !isStateRegulations) {
              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        "bg-blue-50 text-blue-600 border border-blue-200"
                      )}>
                        Search Results
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Found {responseData.results.length} matching items
                      </span>
                    </div>

                    {/* Results */}
                    <div className="space-y-2">
                      {responseData.results.map((result: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden"
                        >
                          <div className="p-3 flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-blue-500">
                                  {result.id}
                                </span>
                                {result.type && (
                                  <Badge variant="outline" className="text-[9px] whitespace-nowrap bg-card">
                                    {result.type}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-xs text-muted-foreground">
                                {result.title}
                              </h4>
                            </div>
                            {result.url && (
                              <a 
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-1 shrink-0"
                              >
                                View Details <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Search metadata */}
                    <div className="flex gap-2 text-[9px] text-muted-foreground border-t border-border/50 pt-3">
                      <span>Source: {responseData.source_filter || 'All'}</span>
                      <span>•</span>
                      <span>Query: "{responseData.query}"</span>
                    </div>
                  </div>
                </div>
              );
            }

            // Detect CFPB data
            else if (responseData?.aggregations?.dateRangeBuckets) {
              const cfpbData = responseData;
              const buckets = cfpbData.aggregations.dateRangeBuckets.dateRangeBuckets.buckets;
              const totalComplaints = cfpbData.hits.total.value;
              const dateRange = {
                min: new Date(cfpbData._meta.date_min),
                max: new Date(cfpbData._meta.date_max)
              };
              
              // Calculate some statistics
              const recentBuckets = buckets.slice(-12); // Last 12 months
              const avgRecentComplaints = Math.round(
                recentBuckets.reduce((sum: number, b: { doc_count: number }) => sum + b.doc_count, 0) / recentBuckets.length
              );
              const maxComplaints = Math.max(...buckets.map((b: { doc_count: number }) => b.doc_count));
              const latestMonthComplaints = buckets[buckets.length - 1].doc_count;

              return (
                <div className="pl-3 border-l border-primary/20">
                  <div className="space-y-4">
                    {/* Header with CFPB badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(
                        "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                        SOURCE_COLORS['CFPB']
                      )}>
                        CFPB
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Consumer Complaint Database
                      </span>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <div className="text-[10px] text-muted-foreground mb-1">Total Complaints</div>
                        <div className="text-lg font-semibold">
                          {totalComplaints.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <div className="text-[10px] text-muted-foreground mb-1">Monthly Average (Last 12mo)</div>
                        <div className="text-lg font-semibold">
                          {avgRecentComplaints.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">Monthly Complaints</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(buckets[0].key_as_string).toLocaleDateString()} - {new Date(buckets[buckets.length - 1].key_as_string).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="h-[180px] w-full">
                        <FREDChart 
                          data={buckets.map((b: { key_as_string: string; doc_count: number }) => ({
                            date: b.key_as_string.split('T')[0],
                            value: b.doc_count
                          }))}
                          series="complaints"
                          dataSource="CFPB"
                          seriesTitle="Consumer Complaints"
                          height={180}
                        />
                      </div>
                    </div>

                    {/* Recent Trends */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Recent Trends</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/20 rounded">
                          <div className="text-[10px] text-muted-foreground">Latest Month</div>
                          <div className="text-sm font-semibold mt-1">
                            {latestMonthComplaints.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground ml-1">complaints</span>
                          </div>
                        </div>
                        <div className="p-2 bg-muted/20 rounded">
                          <div className="text-[10px] text-muted-foreground">Peak Monthly</div>
                          <div className="text-sm font-semibold mt-1">
                            {maxComplaints.toLocaleString()}
                            <span className="text-[10px] text-muted-foreground ml-1">complaints</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date Range Info */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                      <div>Database Range: {dateRange.min.toLocaleDateString()} - {dateRange.max.toLocaleDateString()}</div>
                      <div>Updated: {new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              );
            }

            // Fallback for unknown data format
            return (
              <div className="pl-3 border-l border-primary/20">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className={cn(
                      "animate-in fade-in px-1.5 h-5 text-[10px] font-medium",
                      SOURCE_COLORS[functionName === 'get_fred_data' ? 'FRED' : 'API']
                    )}>
                      {functionName === 'get_fred_data' ? 'FRED' : 'API'}
                    </Badge>
                    <span className={cn(
                      "text-muted-foreground",
                      isStepComplete && "text-green-500"
                    )}>
                      {isStepComplete ? 'Data received' : 'Processing data...'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">
                      {responseData?.results ? (
                        <div className="space-y-2">
                          <div className="text-[10px] text-muted-foreground">
                            Found {responseData.results.length} results
                          </div>
                          <div className="space-y-2">
                            {responseData.results.map((result: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden"
                              >
                                <div className="p-3">
                                  <pre className="text-[10px] bg-muted/20 rounded overflow-auto">
                                    {JSON.stringify(result, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <pre className="mt-1 p-2 text-[10px] bg-muted/20 rounded overflow-auto">
                          {JSON.stringify(responseData, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        } catch (error) {
          console.error('Error in api_response:', error);
          return (
            <div className="pl-3 border-l border-primary/20">
              <div className="text-xs text-muted-foreground">
                <div>Error processing response data</div>
                <pre className="mt-1 p-2 text-[10px] bg-muted/20 rounded overflow-auto">
                  {JSON.stringify(currentStep.content, null, 2)}
                </pre>
              </div>
            </div>
          );
        }
        return null;

      case 'api_analysis':
        try {
          console.log('Rendering api_analysis step:', {
            rawContent: currentStep.content,
            type: typeof currentStep.content
          });

          let analysisContent = currentStep.content;
          
          // Handle the nested structure where analysis is inside a function object
          if (typeof analysisContent === 'object' && 'analysis' in analysisContent) {
            try {
              // Parse the nested analysis string
              analysisContent = JSON.parse(analysisContent.analysis);
              console.log('Successfully parsed nested analysis:', analysisContent);
            } catch (e) {
              console.log('Failed to parse nested analysis');
            }
          }
          // Handle direct string content
          else if (typeof analysisContent === 'string') {
            try {
              analysisContent = JSON.parse(analysisContent);
              console.log('Successfully parsed direct JSON:', analysisContent);
            } catch (e) {
              console.log('Failed to parse as direct JSON, trying markdown block');
              const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/);
              if (jsonMatch) {
                try {
                  analysisContent = JSON.parse(jsonMatch[1]);
                  console.log('Successfully parsed markdown JSON:', analysisContent);
                } catch (e2) {
                  console.log('Failed to parse markdown JSON');
                }
              }
            }
          }

          // Now handle the parsed content
          return (
            <div className="pl-3 border-l border-primary/20">
              <div className="space-y-2 text-xs">
                {/* Data Summary */}
                {analysisContent.data_summary && (
                  <div className="flex gap-2 items-start">
                    <BarChart className="h-3 w-3 mt-0.5 text-primary" />
                    <div className="flex-1 font-mono">
                      {analysisContent.data_summary}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {analysisContent.next_steps && (
                  <div className="flex gap-2 items-start">
                    <ArrowRightCircle className="h-3 w-3 mt-0.5 text-blue-400" />
                    <div className="flex-1 font-mono text-blue-400">
                      {analysisContent.next_steps}
                    </div>
                  </div>
                )}

                {/* API Calls */}
                {analysisContent.recommended_api_calls?.length > 0 && (
                  <div className="flex gap-2 items-start">
                    <Code2 className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {analysisContent.recommended_api_calls.map((api: any, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-secondary/20 text-[10px] font-mono"
                        >
                          {typeof api === 'string' 
                            ? api.replace('functions.', '')
                            : `${api.recipient_name?.replace('functions.', '')}(${api.parameters?.series_id || ''})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback for raw content */}
                {(!analysisContent.data_summary && 
                  !analysisContent.next_steps && 
                  !analysisContent.recommended_api_calls) && (
                  <div className="text-xs text-muted-foreground">
                    <pre className="mt-1 p-2 text-[10px] bg-muted/20 rounded overflow-auto">
                      {JSON.stringify(analysisContent, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        } catch (error) {
          console.error('Error rendering api analysis:', error);
          console.log('Analysis content that caused error:', currentStep.content);
          return (
            <div className="pl-3 border-l border-primary/20">
              <div className="text-xs text-red-400">
                <div>Error displaying analysis</div>
                <pre className="mt-1 p-2 text-[10px] bg-muted/20 rounded overflow-auto">
                  {typeof currentStep.content === 'string' 
                    ? currentStep.content 
                    : JSON.stringify(currentStep.content, null, 2)}
                </pre>
              </div>
            </div>
          );
        }

      case 'final_analysis':
        try {
          const content = typeof currentStep.content === 'string'
            ? currentStep.content
            : currentStep.content.content || JSON.stringify(currentStep.content);

          // Try to parse as JSON first
          try {
            const jsonContent = JSON.parse(content);
            return (
              <div className="text-xs text-muted-foreground">
                {/* Summary */}
                {jsonContent.summary && (
                  <div className="mb-3">
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(jsonContent.summary) }} />
                  </div>
                )}

                {/* Key Findings */}
                {jsonContent.key_findings?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium mb-2">Key Findings</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {jsonContent.key_findings.map((finding: string, idx: number) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: parseMarkdown(finding) }} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {jsonContent.recommendations?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {jsonContent.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: parseMarkdown(rec) }} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Details */}
                {jsonContent.details && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(jsonContent.details) }} />
                  </div>
                )}
              </div>
            );
          } catch (e) {
            // If not JSON, render as markdown
            return (
              <div className="text-xs text-muted-foreground">
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
              </div>
            );
          }
        } catch (error) {
          console.error('Error in final_analysis:', error);
          return null;
        }

      default:
        return null;
    }
  };

  return (
    <Card className="mb-2 border-primary/10 overflow-hidden">
      <CardHeader className="py-2 px-3">
        <div className="flex flex-col gap-2">
          {/* Logo and version */}
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold text-primary", michroma.className)}>ALFReD Agent</span>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-muted/50">alpha</Badge>
          </div>

          {/* Expand/collapse and title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-muted/50 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-sm font-medium"
                >
                  {(() => {
                    // Try to get title from first step
                    if (steps[0]?.content && typeof steps[0].content === 'object' && 'title' in steps[0].content) {
                      return steps[0].content.title;
                    }
                    return 'Economic Analysis Agent';
                  })()}
                </motion.span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-mono">
                  {filteredSteps.length} steps
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div>
            <ScrollArea 
              ref={scrollAreaRef}
              className="max-h-[400px] overflow-y-auto pr-4" 
              scrollHideDelay={75}
            >
              <CardContent className="py-2 px-3">
                {filteredSteps.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Analyzing request...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {filteredSteps.map((currentStep, index) => {
                        const isComplete = completedSteps.some(
                          s => s.id === currentStep.step_id
                        );
                        const isLastStep = index === filteredSteps.length - 1;
                        
                        return (
                          <motion.div
                            key={currentStep.step_id || index}
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="relative"
                            ref={isLastStep ? lastStepRef : undefined}
                          >
                            <div className="flex gap-3">
                              {/* Step number */}
                              <div className="flex-shrink-0 w-6">
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {(index + 1).toString().padStart(2, '0')}
                                </span>
                              </div>
                              
                              {/* Step content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span 
                                    className={cn(
                                      "text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
                                      !isComplete && currentStep.state === 'executing' && "bg-primary/10 text-primary",
                                      !isComplete && currentStep.state === 'planning' && "bg-blue-400/10 text-blue-400",
                                      isComplete && "bg-green-500/10 text-green-500"
                                    )}
                                  >
                                    {getStepTitle(currentStep.step_type)}
                                  </span>
                                  <div className="flex-shrink-0">
                                    {getStepStatus(currentStep)}
                                  </div>
                                </div>
                                <div className="pl-0">
                                  {renderStepContent(currentStep, isComplete)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Connector line */}
                            {index < filteredSteps.length - 1 && (
                              <div 
                                className="absolute left-[11px] top-6 bottom-0 w-px bg-border/50" 
                                style={{ height: 'calc(100% + 12px)' }}
                              />
                            )}
                          </motion.div>
                        );
                      })}

                      {/* Loading indicator for next step */}
                      {!completedSteps.some(s => s.id === filteredSteps[filteredSteps.length - 1]?.step_id) && 
                        filteredSteps[filteredSteps.length - 1]?.step_type !== 'final_analysis' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex gap-3 items-center"
                        >
                          <div className="flex-shrink-0 w-6">
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {(filteredSteps.length + 1).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing next step...</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Sources section */}
                    {sources.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-medium text-muted-foreground">Sources</span>
                          <div className="flex flex-wrap gap-2">
                            {sources.map((source, index) => (
                              <a
                                key={index}
                                href={SOURCE_URLS[source.type](source.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-secondary/20 hover:bg-secondary/30 transition-colors"
                              >
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[9px] px-1 py-0 h-4",
                                    SOURCE_COLORS[source.type]
                                  )}
                                >
                                  {source.type}
                                </Badge>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {source.id}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}