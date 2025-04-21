"use server";

import 'server-only';
import { StreamableValue, createAI, createStreamableUI, createStreamableValue, getAIState, getMutableAIState } from 'ai/rsc'
import { CoreMessage, generateId, ToolResultPart } from 'ai'
import { Section } from '@/components/section'
import { FollowupPanel } from '@/components/followup-panel'
import { researcher, querySuggestor } from '@/lib/agents'
import { preferenceManager } from '@/lib/agents/preference-manager'
import { fredAgent } from '@/lib/agents/fred-agent'
import { saveChat } from '@/lib/actions/chat'
import { WebSearchResult, Chat } from '@/lib/types'
import { AIMessage } from '@/lib/types'
import { UserMessage } from '@/components/user-message'
import { SearchSection } from '@/components/search-section'
import SearchRelated from '@/components/search-related'
import { CopilotDisplay } from '@/components/copilot-display'
import RetrieveSection from '@/components/retrieve-section'
import { transformToolMessages } from '@/lib/utils'
import { AnswerSection } from '@/components/answer-section'
import { ErrorCard } from '@/components/error-card'
import { saveUserPreference, getUserPreferences } from '@/lib/preference-manager'
import { PreferenceNotification } from '@/components/preference-notification'
import { PreferenceResult } from '@/lib/schema/preference'
import { useAppState } from '@/lib/utils/app-state'
import { FREDChart } from '@/components/fred-chart'
import { queryPineconeIndex } from '@/lib/utils/pinecone-utils'
import { FREDSeries } from '@/lib/utils/pinecone-utils'
import { Spinner } from '@/components/ui/spinner'
import { ChatSpinner } from '@/components/ui/spinner'
import Logger from '@/lib/utils/logging';
import { ThinkingMessage } from '@/components/thinking-message'
import { ApiAgentDisplay, ApiAgentStep } from '@/components/api-agent-display'
import { getCurrentUserFromRequestToken } from '@/lib/auth/auth';
import { cookies } from 'next/headers';
import { EconAnalysisChoice } from '@/components/econ-analysis-choice';
import { EconomicChoiceForm } from '@/components/economic-choice-form'
import { debounce } from 'lodash';
import { handleChoice, waitForChoice } from '@/lib/utils/choice-state';
import { revalidatePath } from 'next/cache'
import { getRedirectUrlForQuery } from '@/lib/services/chat-navigation'

type DataSource = 'FRED' | 'BLS';

interface ChartData {
  data: any;
  series: string;
  dataSource: DataSource;
  seriesExplanation?: string;
  seriesTitle: string;
  sourceUrl?: string;
}

interface EconomicAnalysisSteps {
  type: 'economic_analysis';
  userQuery: string;
  steps: ApiAgentStep[];
  chartData: ChartData[];
  apiSourceUrls: {
    FRED: string;
    BLS: string;
    CFPB: string;
    HMDA: string;
    SEC: string;
  };
}

interface LegacyFREDData {
  needsEconomicData: boolean;
  data: any;
  series?: string;
  dataSource?: DataSource;
  seriesExplanation?: string;
  seriesTitle?: string;
}

function isPreferenceDetected(
  result: PreferenceResult
): result is PreferenceResult & { detected: true } {
  return result.detected === true
}

interface UserMessage {
  input: string;
}

interface MessageContent {
  input?: string;
  [key: string]: any;
}

interface ApiStep {
  step_id: string;
  step_type: string;
  content: any;
  state: 'error' | 'planning' | 'executing' | 'complete' | 'loading';
}

interface FredAgentStep {
  needsEconomicData: boolean;
  apiStream?: boolean;
  data?: {
    step_id: string;
    step_type: string;
    content: any;
    state: string;
  };
  error?: string;
}

interface FredAgentResponse {
  value?: FredAgentStep;
  done: boolean;
}

// Define the form state type
export type FormState = {
  choice: boolean | null;
  error?: string;
};

// Server action for useFormState
export async function handleEconomicChoiceAction(state: FormState, formData: FormData): Promise<FormState> {
  'use server'
  return processChoice(formData);
}

// Server action for inline forms
export async function handleInlineChoice(formData: FormData) {
  'use server'
  const choice = formData.get('choice') === 'true';
  const chatId = formData.get('chatId') as string;
  
  if (!chatId) {
    throw new Error('Missing chatId');
  }

  await handleChoice(chatId, choice);
  return { choice };
}

// Helper function to process the choice
async function processChoice(formData: FormData) {
  try {
    const choice = formData.get('choice') === 'true';
    
    Logger.debug('handleEconomicChoice', 'Processing choice', { 
      choice,
      formDataEntries: Object.fromEntries(formData.entries())
    });

    return { choice, error: undefined };
  } catch (error) {
    Logger.error('handleEconomicChoice', 'Error processing choice', { error });
    return { choice: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function submit(
  formData?: FormData,
  skip?: boolean,
  retryMessages?: AIMessage[]
) {
  'use server'
  
  // Get the current user ID from the session
  const cookieStore = cookies();
  const request = {
    cookies: {
      get: (name: string) => cookieStore.get(name)
    }
  } as any;
  
  const user = await getCurrentUserFromRequestToken(request);
  const userId = user?.id || 'anonymous';
  const token = cookieStore.get('token')?.value;

  Logger.debug('submit', 'Starting submit function', { 
    hasFormData: !!formData, 
    skip, 
    hasRetryMessages: !!retryMessages 
  });

  console.log('Submit function called with params:', {
    formData: formData ? 'present' : 'undefined',
    skip,
    retryMessages: retryMessages ? 'present' : 'undefined'
  })

  const aiState = getMutableAIState<typeof AI>()
  const uiStream = createStreamableUI()
  const isGenerating = createStreamableValue(true)
  const isCollapsed = createStreamableValue(false)

  const aiMessages = [...(retryMessages ?? aiState.get().messages)]
  
  // Only fetch preferences if this is the first message
  if (aiMessages.length === 0) {
    Logger.debug('submit', 'Initial chat - loading preferences');
    const initialPreferences = await getUserPreferences(token);
    aiState.update({
      ...aiState.get(),
      userPreferences: initialPreferences
    });
  }

  Logger.debug('submit', 'Initial aiMessages', {
    count: aiMessages.length,
    lastMessage: aiMessages[aiMessages.length - 1]?.role
  });

  const messages: CoreMessage[] = aiMessages
    .filter(
      message =>
        message.role !== 'tool' &&
        message.type !== 'followup' &&
        message.type !== 'related' &&
        message.type !== 'end'
    )
    .map(message => {
      const { role, content } = message
      return { role, content } as CoreMessage
    })
  
  Logger.debug('submit', 'After filtering messages', {
    originalCount: aiMessages.length,
    filteredCount: messages.length,
    lastMessageRole: messages[messages.length - 1]?.role
  });

  const groupId = generateId()
  const useSpecificAPI = process.env.USE_SPECIFIC_API_FOR_WRITER === 'true'
  const useOllamaProvider = !!(
    process.env.OLLAMA_MODEL && process.env.OLLAMA_BASE_URL
  )
  const maxMessages = useSpecificAPI ? 5 : useOllamaProvider ? 1 : 10
  messages.splice(0, Math.max(messages.length - maxMessages, 0))

  let content: string | null = null
  let type: AIMessage['type'] | undefined

  if (skip) {
    content = `{"action": "skip"}`
    type = 'skip'
  } else if (formData) {
    const userInput = formData.get('input') as string
    content = JSON.stringify(Object.fromEntries(formData))
    type = formData.has('input') ? 'input' : formData.has('related_query') ? 'input_related' : 'inquiry'
  }

  if (content) {
    const newMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content,
      type: type || 'input'
    }
    Logger.debug('submit', 'Adding new message', { newMessage });
    aiState.update({
      ...aiState.get(),
      messages: [...aiState.get().messages, newMessage]
    })
    messages.push({
      role: 'user',
      content
    })
    Logger.logMessages('submit', messages);

    // Add initial loading state AFTER the message is added
    uiStream.append(
      <div className="flex items-center space-x-2 py-2 pl-4">
        <ChatSpinner />
        <span 
          className="text-sm font-medium text-muted-foreground"
        >
          Processing your request...
        </span>
      </div>
    )
  }

  async function processEvents() {
    if (!skip) {
      Logger.debug('processEvents', 'Starting message processing');
      Logger.logMessages('processEvents', messages);

      // Clear the initial loading spinner
      uiStream.update(null)

      console.log('Checking for economic data requirement...')
      const economicResult = fredAgent(messages, userId);
      const firstStep = await economicResult[Symbol.asyncIterator]().next() as FredAgentResponse;
      
      if (firstStep.value?.needsEconomicData && firstStep.value?.data) {
        Logger.debug('processEvents', 'Economic data analysis required');
        
        try {
          // Clear any existing UI first
          uiStream.update(null);
          
          const chatId = aiState.get().chatId;
          
          Logger.debug('processEvents', 'Showing economic choice UI');
          
          // Show the choice UI with chatId
          uiStream.append(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
              <div className="bg-background p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-border/10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Enhanced Analysis Available
                    </h3>
                    <div className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        Your query could benefit from our advanced API Agent analysis. This comprehensive approach provides deeper insights using authoritative data sources including:
                      </p>
                      <ul className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>Federal Reserve Economic Data (FRED)</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span>SEC Filings & Reports</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          <span>Bureau of Labor Statistics</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>CFPB Databases</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>HMDA Reports</span>
                        </li>
                      </ul>
                      <p className="text-sm text-muted-foreground/80 italic">
                        Note: This analysis may take longer but provides richer, data-driven insights.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-end pt-2">
                    <form action={handleInlineChoice}>
                      <input type="hidden" name="choice" value="false" />
                      <input type="hidden" name="chatId" value={chatId} />
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium bg-secondary/80 text-secondary-foreground hover:bg-secondary/90 rounded-lg transition-colors"
                      >
                        Skip Enhanced Analysis
                      </button>
                    </form>
                    <form action={handleInlineChoice}>
                      <input type="hidden" name="choice" value="true" />
                      <input type="hidden" name="chatId" value={chatId} />
                      <button
                        type="submit"
                        className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                      >
                        Enable Enhanced Analysis
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );

          Logger.debug('processEvents', 'Waiting for user choice');
          const userWantsAnalysis = await waitForChoice(chatId);
          Logger.debug('processEvents', 'User choice received', { userWantsAnalysis });

          // Clear the UI after choice is made
          uiStream.update(null);

          if (userWantsAnalysis) {
            Logger.debug('processEvents', 'Starting economic analysis');
            
            // Create a single instance of ApiAgentDisplay
            const agentId = generateId();
            let allSteps: ApiStep[] = [];

            // Get the user's query from the last message
            let userQuery = '';
            const lastMessage = messages[messages.length - 1];
            
            try {
              if (typeof lastMessage.content === 'string') {
                const parsed = JSON.parse(lastMessage.content) as UserMessage;
                userQuery = parsed.input;
              } else if (typeof lastMessage.content === 'object' && lastMessage.content !== null) {
                const content = lastMessage.content as MessageContent;
                if (content.input) {
                  userQuery = content.input;
                }
              }
            } catch (error) {
              console.error('Error parsing user query:', error);
              userQuery = 'Error parsing query';
            }

            // Initialize with the first step from fred-agent
            allSteps = [{
              step_id: firstStep.value.data.step_id || generateId(),
              step_type: firstStep.value.data.step_type,
              content: firstStep.value.data.content,
              state: mapStepState(firstStep.value.data.state)
            }];

            // Create the ApiAgentDisplay with steps prop
            uiStream.append(
              <ApiAgentDisplay 
                key={agentId}
                steps={allSteps}
                currentStep={allSteps.length}
                totalSteps={6}
              />
            );

            // Add logging for steps processing
            Logger.debug('processEvents', 'Starting steps processing', {
              initialStepCount: allSteps.length,
              firstStep: {
                type: firstStep.value.data.step_type,
                state: firstStep.value.data.state,
                contentType: typeof firstStep.value.data.content
              }
            });

            // Collect all steps before adding to messages
            let economicAnalysisSteps: EconomicAnalysisSteps = {
              type: 'economic_analysis',
              userQuery,
              steps: [{
                step_id: firstStep.value.data.step_id || generateId(),
                step_type: firstStep.value.data.step_type,
                content: firstStep.value.data.content,
                state: mapStepState(firstStep.value.data.state)
              }],
              chartData: [],
              apiSourceUrls: {
                FRED: 'https://fred.stlouisfed.org/series/',
                BLS: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
                CFPB: 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/',
                HMDA: 'https://ffiec.cfpb.gov/data-browser/',
                SEC: 'https://www.sec.gov/edgar/search/'
              }
            };

            // Process remaining steps
            for await (const step of economicResult) {
              if (step.needsEconomicData && step.apiStream && step.data) {
                Logger.debug('processEvents', 'Processing API stream step', {
                  stepType: step.data.step_type,
                  state: step.data.state,
                  contentType: typeof step.data.content,
                  hasResponse: step.data.content?.response !== undefined,
                  responseType: typeof step.data.content?.response
                });
                
                // Skip if this is another user query step
                if (step.data.step_type === 'user_query') {
                  continue;
                }

                // Add step to the collection with source URL if it's a search response
                const stepContent = step.data.content;
                let messageStepContent = stepContent;

                // Format search-related step content
                if (step.data.step_type === 'api_call') {
                  Logger.debug('processEvents', 'API Call Content', {
                    function: stepContent?.function,
                    parameters: stepContent?.parameters,
                    fullContent: stepContent
                  });

                  if (stepContent?.function === 'search_time_series') {
                    messageStepContent = {
                      function: 'search_time_series',
                      parameters: {
                        query: stepContent.parameters.query,
                        source_filter: stepContent.parameters.source_filter || 'FRED'
                      }
                    };
                  } else if (stepContent?.function === 'search_sec_filings') {
                    messageStepContent = {
                      function: 'search_sec_filings',
                      parameters: {
                        company_name: stepContent.parameters.company_name,
                        cik: stepContent.parameters.cik,
                        form_type: stepContent.parameters.form_type,
                        query: stepContent.parameters.query,
                        filters: stepContent.parameters.filters
                      }
                    };
                  } else if (stepContent?.function === 'search_state_regulations') {
                    Logger.debug('processEvents', 'State Regulations API Call', {
                      parameters: stepContent.parameters,
                      environment: process.env.NODE_ENV,
                      vercelEnv: process.env.VERCEL_ENV,
                      apiUrl: process.env.NEXT_PUBLIC_API_URL,
                      step: {
                        id: step.data.step_id,
                        type: step.data.step_type,
                        needsEconomicData: step.needsEconomicData,
                        apiStream: step.apiStream
                      }
                    });
                    
                    // Keep original message content
                    messageStepContent = stepContent;
                  }
                } else if (step.data.step_type === 'api_response') {
                  Logger.debug('processEvents', 'Raw API Response Step', {
                    stepData: step.data,
                    hasContent: !!step.data.content,
                    contentType: typeof step.data.content,
                    apiStream: step.apiStream,
                    needsEconomicData: step.needsEconomicData
                  });

                  Logger.debug('processEvents', 'API Response', {
                    function: stepContent?.function,
                    hasResults: !!stepContent?.response?.results,
                    resultCount: stepContent?.response?.results?.length,
                    firstResult: stepContent?.response?.results?.[0],
                    query: stepContent?.response?.query,
                    state_filter: stepContent?.response?.state_filter,
                    environment: process.env.NODE_ENV,
                    vercelEnv: process.env.VERCEL_ENV,
                    fullResponse: stepContent?.response,
                    responseKeys: stepContent?.response ? Object.keys(stepContent.response) : []
                  });

                  if (stepContent?.function === 'search_state_regulations') {
                    Logger.debug('processEvents', 'Processing State Regulations Response', {
                      rawResponse: stepContent.response,
                      hasResults: !!stepContent.response?.results,
                      resultCount: stepContent.response?.results?.length,
                      environment: process.env.NODE_ENV,
                      vercelEnv: process.env.VERCEL_ENV,
                      stepMetadata: {
                        id: step.data.step_id,
                        type: step.data.step_type,
                        state: step.data.state
                      }
                    });

                    // Add validation and debugging for response structure
                    if (!stepContent.response) {
                      Logger.error('processEvents', 'Missing response in state regulations step', {
                        content: stepContent
                      });
                    } else if (!Array.isArray(stepContent.response.results)) {
                      Logger.error('processEvents', 'Results is not an array in state regulations response', {
                        resultsType: typeof stepContent.response.results,
                        response: stepContent.response
                      });
                    }

                    // Pass through the exact structure we receive
                    messageStepContent = {
                      function: 'search_state_regulations',
                      response: {
                        query: stepContent.response.query,
                        state_filter: stepContent.response.state_filter,
                        effective_date_filter: stepContent.response.effective_date_filter,
                        results: Array.isArray(stepContent.response.results) ? stepContent.response.results : []
                      }
                    };

                    Logger.debug('processEvents', 'Final State Regulations Content', {
                      messageContent: messageStepContent,
                      hasResults: !!messageStepContent.response?.results,
                      resultCount: messageStepContent.response?.results?.length,
                      resultsArray: Array.isArray(messageStepContent.response?.results)
                    });
                  }
                }

                // Add full content to UI steps with the processed message content
                allSteps = [
                  ...allSteps,
                  {
                    step_id: generateId(),
                    step_type: step.data.step_type,
                    content: messageStepContent || stepContent,
                    state: step.data.state
                  }
                ];

                // Add simplified content to economic analysis steps
                economicAnalysisSteps.steps.push({
                  step_id: generateId(),
                  step_type: step.data.step_type,
                  content: messageStepContent,
                  state: step.data.state
                });

                // Update the component with the complete steps array
                uiStream.update(
                  <ApiAgentDisplay 
                    key={agentId}
                    steps={allSteps}
                    currentStep={allSteps.length}
                    totalSteps={6}
                  />
                );
              } else if ('data' in step && !step.apiStream) {
                // Handle legacy FRED data format
                const legacyData = step as LegacyFREDData;

                if (legacyData.data && legacyData.series && legacyData.dataSource) {
                  Logger.debug('processEvents', 'Economic data found', {
                    dataSource: legacyData.dataSource,
                    series: legacyData.series
                  });
                  
                  // Add chart data to the collection with source URL
                  const sourceUrl = legacyData.dataSource === 'FRED'
                    ? `https://fred.stlouisfed.org/series/${legacyData.series}`
                    : legacyData.dataSource === 'BLS'
                    ? `https://api.bls.gov/publicAPI/v2/timeseries/data/${legacyData.series}`
                    : undefined;

                  economicAnalysisSteps.chartData.push({
                    data: legacyData.data,
                    series: legacyData.series,
                    dataSource: legacyData.dataSource,
                    seriesExplanation: legacyData.seriesExplanation,
                    seriesTitle: legacyData.seriesTitle || legacyData.series,
                    sourceUrl
                  });
                  
                  uiStream.append(
                    <FREDChart 
                      data={legacyData.data} 
                      series={legacyData.series} 
                      dataSource={legacyData.dataSource} 
                      seriesExplanation={legacyData.seriesExplanation}
                      seriesTitle={legacyData.seriesTitle || legacyData.series}
                    />
                  );
                }
              }
            }

            // Add single combined message for all economic analysis steps
            messages.push({
              role: 'user',
              content: `<API_Agent_Research>\n${JSON.stringify(economicAnalysisSteps, null, 2)}\n</API_Agent_Research>`
            });

          } else {
            Logger.debug('processEvents', 'User skipped economic analysis');
          }
        } catch (error) {
          Logger.error('processEvents', 'Error in economic analysis', { error });
          uiStream.update(null);
        }
      } else {
        // If economic data is not needed, continue with normal processing
        Logger.debug('processEvents', 'No economic data analysis required');
        for await (const step of economicResult) {
          if ('data' in step && !step.apiStream) {
            // Handle any non-API stream data
            const legacyData = step as LegacyFREDData;
            if (legacyData.data && legacyData.series && legacyData.dataSource) {
              uiStream.append(
                <FREDChart 
                  data={legacyData.data} 
                  series={legacyData.series} 
                  dataSource={legacyData.dataSource} 
                  seriesExplanation={legacyData.seriesExplanation}
                  seriesTitle={legacyData.seriesTitle || legacyData.series}
                />
              );
            }
          }
        }
      }
      
    }
    
    isCollapsed.done(true)
    let answer = ''
    let stopReason = ''
    let toolOutputs: ToolResultPart[] = []
    let errorOccurred = false
    const streamText = createStreamableValue<string>('')
    const thinkingState = createStreamableValue(true)

    // Add logging before researcher loop
    Logger.debug('processEvents', 'Starting researcher loop', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    while (
      useSpecificAPI
        ? toolOutputs.length === 0 && answer.length === 0 && !errorOccurred
        : stopReason !== 'stop' && !errorOccurred
    ) {
      // Add detailed logging before researcher call
      Logger.debug('processEvents', 'Pre-researcher state', {
        messageCount: messages.length,
        messageRoles: messages.map(m => m.role),
        lastMessage: {
          role: messages[messages.length - 1]?.role,
          contentPreview: typeof messages[messages.length - 1]?.content === 'string'
            ? (messages[messages.length - 1]?.content as string).substring(0, 50) + '...'
            : 'non-string content'
        }
      });

      const previousResponse = aiMessages
        .filter(message => message.role === 'assistant' && message.type === 'answer')
        .pop()?.content || ''

      const { fullResponse, hasError, toolResponses, finishReason } =
        await researcher(
          uiStream,
          streamText,
          messages,
          previousResponse
        )

      // Add detailed logging after researcher response
      Logger.debug('processEvents', 'Post-researcher state', {
        hasError,
        finishReason,
        toolResponseCount: toolResponses.length,
        messageCount: messages.length,
        lastMessageRole: messages[messages.length - 1]?.role
      });

      stopReason = finishReason || ''
      answer = fullResponse
      toolOutputs = toolResponses
      errorOccurred = hasError

      // Add logging before any message modifications
      if (toolOutputs.length > 0) {
        Logger.debug('processEvents', 'Pre-tool output processing', {
          toolCount: toolOutputs.length,
          messageCount: messages.length,
          lastMessageRole: messages[messages.length - 1]?.role
        });
        toolOutputs.forEach((output, index) => {
          Logger.debug('processEvents', `Adding tool output ${index + 1}/${toolOutputs.length}`, {
            toolName: output.toolName
          });
          
          aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: groupId,
                role: 'tool',
                content: JSON.stringify(output.result),
                name: output.toolName,
                type: 'tool'
              }
            ]
          })
        })
      }

      if (answer.includes('<ALFReD Answer>')) {
        Logger.debug('processEvents', 'Processing ALFReD Answer', {
          messageCount: messages.length,
          lastMessageRole: messages[messages.length - 1]?.role
        });
        thinkingState.update(false)
        const answerContent = answer.split('<ALFReD Answer>')[1].split('</ALFReD Answer>')[0]
        streamText.update(answerContent.trim())
      } else if (answer.includes('<ALFReD scratchpad>')) {
        const scratchpadContent = answer.split('<ALFReD scratchpad>')[1].split('</ALFReD scratchpad>')[0]
        streamText.update(scratchpadContent.trim())
      }

      Logger.debug('processEvents', 'Researcher response', {
        hasError,
        toolResponsesCount: toolResponses.length,
        finishReason
      });
    }
    if (useSpecificAPI && answer.length === 0 && !errorOccurred) {
      Logger.debug('processEvents', 'Starting response flow', {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]
      });
      
      const modifiedMessages = transformToolMessages(messages)
      
      Logger.debug('processEvents', 'After transform', {
        originalCount: messages.length,
        modifiedCount: modifiedMessages.length,
        lastModifiedMessage: modifiedMessages[modifiedMessages.length - 1]
      });
      
      const latestMessages = modifiedMessages.slice(maxMessages * -1)
      
      Logger.debug('processEvents', 'After slice', {
        slicedCount: latestMessages.length,
        lastSlicedMessage: latestMessages[latestMessages.length - 1]
      });
      
      messages.push({
        role: 'assistant',
        content: answer
      })
      
      Logger.debug('processEvents', 'After adding response', {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]
      });
    }
    if (!errorOccurred) {
      let processedMessages = messages
      thinkingState.done(false)
      streamText.done()
      aiState.update({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: groupId,
            role: 'assistant',
            content: answer,
            type: 'answer'
          }
        ]
      })
      const relatedQueries = await querySuggestor(uiStream, processedMessages)
      uiStream.append(
        <Section title="Follow-up">
          <FollowupPanel />
        </Section>
      )
      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: groupId,
            role: 'assistant',
            content: JSON.stringify(relatedQueries),
            type: 'related'
          },
          {
            id: groupId,
            role: 'assistant',
            content: 'followup',
            type: 'followup'
          }
        ]
      })
    } else {
      aiState.done(aiState.get())
      thinkingState.done(false)
      streamText.done()
      uiStream.append(
        <ErrorCard
          errorMessage={answer || 'An error occurred. Please try again.'}
        />
      )
    }
    isGenerating.done(false)
    uiStream.done()

    // Log final message state
    Logger.debug('processEvents', 'Final message state', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1],
      lastMessageRole: messages[messages.length - 1]?.role
    });
  }
  processEvents()
  return {
    id: generateId(),
    isGenerating: isGenerating.value,
    component: uiStream.value,
    isCollapsed: isCollapsed.value
  }
}

export type AIState = {
  messages: AIMessage[]
  chatId: string
  isSharePage?: boolean
  userPreferences?: string[]
}

export type UIState = {
  id: string
  component: React.ReactNode
  isGenerating?: StreamableValue<boolean>
  isCollapsed?: StreamableValue<boolean>
}[]

const initialAIState: AIState = {
  chatId: generateId(),
  messages: []
}

const initialUIState: UIState = []

export const AI = createAI<AIState, UIState>({
  actions: {
    submit
  },
  initialUIState,
  initialAIState,
  onGetUIState: async () => {
    'use server'
    const aiState = getAIState()
    if (aiState) {
      const uiState = getUIStateFromAIState(aiState as Chat)
      return uiState
    } else {
      return
    }
  },
  onSetAIState: async ({ state, done }) => {
    'use server'
    try {
      if (!state.messages.some(e => e.type === 'answer')) {
        return
      }
      
      const { chatId, messages } = state
      
      if (!chatId || chatId === '0') {
        Logger.error('onSetAIState', 'Invalid chatId detected', { chatId });
        return;
      }
      
      Logger.debug('onSetAIState', 'Saving chat', { 
        chatId, 
        messageCount: messages.length,
        firstMessageType: messages[0]?.type
      });
      
      const createdAt = new Date()
      const userId = 'anonymous'
      const path = `/search/${chatId}`
      const title =
        messages.length > 0
          ? JSON.parse(messages[0].content)?.input?.substring(0, 100) ||
            'Untitled'
          : 'Untitled'
      
      const updatedMessages: AIMessage[] = [
        ...messages,
        {
          id: generateId(),
          role: 'assistant',
          content: `end`,
          type: 'end'
        }
      ]
      
      const chat: Chat = {
        id: chatId,
        createdAt,
        userId,
        path,
        title,
        messages: updatedMessages
      }
      
      await saveChat(chat)
      Logger.debug('onSetAIState', 'Chat saved successfully', { chatId });
    } catch (error) {
      Logger.error('onSetAIState', 'Error saving chat', { error });
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  const chatId = aiState.chatId
  const isSharePage = aiState.isSharePage
  return aiState.messages
    .map((message, index) => {
      const { role, content, id, type, name } = message
      if (
        !type ||
        type === 'end' ||
        (isSharePage && type === 'related') ||
        (isSharePage && type === 'followup')
      )
        return null
      switch (role) {
        case 'user':
          switch (type) {
            case 'input':
            case 'input_related':
              const json = JSON.parse(content)
              const value = json.input || json.related_query
              return {
                id,
                component: (
                  <UserMessage
                    message={value}
                    chatId={chatId}
                    showShare={index === 0 && !isSharePage}
                  />
                )
              }
          case 'inquiry':
            return {
              id,
              component: <CopilotDisplay content={content} />
            }
        }
      case 'assistant':
        const answer = createStreamableValue()
        const isThinking = createStreamableValue(true)
        const scratchpad = createStreamableValue('')
        
        switch (type) {
          case 'answer':
            // Parse out scratchpad and answer content
            const scratchpadMatch = content.match(/<ALFReD scratchpad>([\s\S]*?)<\/ALFReD scratchpad>/);
            const answerMatch = content.match(/<ALFReD Answer>([\s\S]*?)<\/ALFReD Answer>/);
            
            if (scratchpadMatch) {
              scratchpad.update(scratchpadMatch[1].trim());
            }
            
            // If we have an answer or the content includes the start of an answer tag
            const hasAnswerStarted = content.includes('<ALFReD Answer>');
            if (answerMatch) {
              answer.update(answerMatch[1].trim());
              isThinking.update(false);
            } else if (hasAnswerStarted) {
              // If answer tag started but not complete, get partial content
              const partialAnswer = content.split('<ALFReD Answer>')[1];
              if (partialAnswer) {
                answer.update(partialAnswer.trim());
              }
              isThinking.update(true);
            } else {
              isThinking.update(true);
            }
            
            return {
              id,
              component: (
                <>
                  <ThinkingMessage 
                    isThinking={isThinking.value}
                    scratchpad={scratchpad.value} 
                  />
                  {(answerMatch || hasAnswerStarted) && <AnswerSection result={answer.value} />}
                </>
              )
            }
          case 'related':
            const relatedQueries = createStreamableValue()
            relatedQueries.done(JSON.parse(content))
            return {
              id,
              component: (
                <SearchRelated relatedQueries={relatedQueries.value} />
              )
            }
          case 'followup':
            return {
              id,
              component: (
                <Section title="Follow-up" className="pb-8">
                  <FollowupPanel />
                </Section>
              )
            }
        }
      case 'tool':
        try {
          const toolOutput = JSON.parse(content)
          const isCollapsed = createStreamableValue()
          isCollapsed.done(true)
          const searchResults = createStreamableValue()
          searchResults.done(JSON.stringify(toolOutput))
          switch (name) {
            case 'search':
              return {
                id,
                component: <SearchSection result={searchResults.value} />,
                isCollapsed: isCollapsed.value
              }
            case 'retrieve':
              return {
                id,
                component: <RetrieveSection data={toolOutput} />,
                isCollapsed: isCollapsed.value
              }
            case 'fred':
              return {
                id,
                component: (
                  <FREDChart 
                    data={toolOutput.data} 
                    series={toolOutput.series} 
                    dataSource={toolOutput.dataSource || 'FRED'}
                    seriesExplanation={toolOutput.seriesExplanation}
                    seriesTitle={toolOutput.seriesTitle || toolOutput.series}
                  />
                ),
                isCollapsed: isCollapsed.value
              }
          }
        } catch (error) {
          return {
            id,
            component: null
          }
        }
      default:
        return {
          id,
          component: null
        }
    }
  })
  .filter(message => message !== null) as UIState
}

const processEconomicAnalysis = async (
  economicResult: AsyncIterable<any>,
  uiStream: ReturnType<typeof createStreamableUI>,
  totalSteps: number
) => {
  let allSteps: ApiAgentStep[] = [];

  try {
    Logger.debug('processEconomicAnalysis', 'Starting analysis', { totalSteps });

    // Show initial state
    try {
      uiStream.append(
        <div className="mt-4">
          <ApiAgentDisplay 
            steps={allSteps}
            currentStep={0}
            totalSteps={totalSteps}
          />
        </div>
      );
    } catch (error) {
      Logger.error('processEconomicAnalysis', 'Error updating initial UI', { error });
    }

    for await (const stepResult of economicResult) {
      Logger.debug('processEconomicAnalysis', 'Processing step result', { 
        hasData: !!stepResult?.data,
        stepType: stepResult?.data?.step_type,
        error: stepResult?.error 
      });

      if (!stepResult?.data) {
        Logger.warn('processEconomicAnalysis', 'Empty step result received');
        continue;
      }

      try {
        // Create step based on the dynamic data received
        const newStep: ApiAgentStep = {
          step_id: String(allSteps.length + 1).padStart(2, '0'),
          step_type: stepResult.data.step_type || 'Analysis Step',
          content: stepResult.data.content,
          state: stepResult.error ? 'error' : 'complete'
        };

        Logger.debug('processEconomicAnalysis', 'Created new step', { 
          step_id: newStep.step_id,
          step_type: newStep.step_type,
          state: newStep.state 
        });

        allSteps = [...allSteps, newStep];

        // Update UI with progress
        uiStream.append(
          <div className="mt-4">
            <ApiAgentDisplay 
              steps={allSteps}
              currentStep={allSteps.length}
              totalSteps={totalSteps}
            />
          </div>
        );

        // Small delay to prevent UI thrashing
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (stepError) {
        Logger.error('processEconomicAnalysis', 'Error processing step', { 
          stepError,
          stepData: stepResult.data 
        });
      }
    }

  } catch (error) {
    Logger.error('processEconomicAnalysis', 'Error in analysis', { error });
  } finally {
    Logger.debug('processEconomicAnalysis', 'Analysis complete', { 
      totalStepsProcessed: allSteps.length 
    });
    uiStream.done();
  }
};

// Add helper function at the top level
function mapStepState(state: string): 'planning' | 'executing' | 'complete' | 'error' | 'loading' {
  switch (state) {
    case 'complete':
      return 'complete';
    case 'error':
      return 'error';
    case 'planning':
      return 'planning';
    case 'loading':
      return 'loading';
    default:
      return 'executing';
  }
}

// Add this new server action for the home page
export async function submitMessage(message: string) {
  // Use our navigation service to create the redirect URL
  const redirectUrl = getRedirectUrlForQuery(message);
  return { 
    success: true,
    redirectUrl
  };
}