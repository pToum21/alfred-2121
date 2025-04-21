import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, streamObject } from 'ai'
import { PartialRelated, relatedSchema } from '@/lib/schema/related'
import SearchRelated from '@/components/search-related'
import { getOpenAIClient } from '../openai'

export async function querySuggestor(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  const openai = getOpenAIClient()
  if (!openai) {
    console.log('OpenAI client not available')
    return { items: [] }
  }

  const objectStream = createStreamableValue<PartialRelated>()
  uiStream.append(<SearchRelated relatedQueries={objectStream.value} />)

  const lastMessages = messages.slice(-1).map(message => ({
    ...message,
    role: 'user'
  })) as CoreMessage[]

  let finalRelatedQueries: PartialRelated = {}
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional web researcher. Your task is to generate a set of four queries that explore the subject matter more deeply, building upon the initial query and the information uncovered in its search results.

          Return your response as a JSON object in the following format:
          {
            "items": [
              {"query": "First follow-up question based on the user's query and search results?"},
              {"query": "Second follow-up question exploring implications or consequences?"},
              {"query": "Third follow-up question about a related or adjacent topic?"},
              {"query": "Fourth follow-up question about a fun/very enticing topic?"}
            ]
          }

          Aim to create queries that progressively delve into more specific aspects, implications, or adjacent topics related to the initial query. The goal is to anticipate the user's potential information needs and guide them towards a more comprehensive understanding of the subject matter.
          Please match the language of the response to the user's language.`
        },
        ...lastMessages.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        }))
      ],
      response_format: { type: "json_object" }
    })

    const result = relatedSchema.parse(JSON.parse(completion.choices[0].message.content || '{}'))
    objectStream.update(result)
    finalRelatedQueries = result
  } catch (error) {
    console.error('Error in querySuggestor:', error)
    objectStream.update({ items: [] })
  } finally {
    objectStream.done()
  }

  return finalRelatedQueries
}