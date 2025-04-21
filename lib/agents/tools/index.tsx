import { createStreamableUI } from 'ai/rsc'
import { retrieveTool } from './retrieve'
import { searchTool } from './search'
import { propertySearchTool } from './property-search'

export interface ToolProps {
  uiStream: ReturnType<typeof createStreamableUI>
  fullResponse: string
}

export const getTools = ({ uiStream, fullResponse }: ToolProps) => {
  const tools: any = {
    search: searchTool({
      uiStream,
      fullResponse
    }),
    retrieve: retrieveTool({
      uiStream,
      fullResponse
    }),
    searchProperties: propertySearchTool({
      uiStream,
      fullResponse
    })
  }

  return tools
}