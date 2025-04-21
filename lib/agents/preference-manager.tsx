import { CoreMessage, generateObject } from 'ai'
import { preferenceSchema } from '../schema/preference'
import { getOpenAIClient } from '../openai'
import { getUserPreferences, saveUserPreference } from '../preference-manager'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { getAIState, getMutableAIState } from 'ai/rsc'
import { AIState } from '@/app/actions'

export async function preferenceManager(messages: CoreMessage[]) {
  console.log('PreferenceManager: Analyzing messages for preferences...');
  
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      console.log('OpenAI client not available');
      return { detected: false };
    }

    // Get token for preference operations
    const token = cookies().get('token')?.value;
    const aiState = getMutableAIState()
    const currentPreferences = (aiState.get() as AIState).userPreferences || [];
    
    console.log('Current preferences:', currentPreferences);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant responsible for identifying and saving specific user preferences that will enhance future interactions. Your task is to analyze the user's message and determine if they are explicitly expressing a preference about how they want you to communicate or behave.

          IMPORTANT: ALWAYS save a preference when the user:
          1. Uses words like "remember", "save", "note", or "keep in mind"
          2. Explicitly asks to store something as a preference
          3. Indicates they want something remembered for future interactions

          Examples of explicit save requests (ALWAYS SAVE THESE):
          - User: "Remember that I'm a data scientist"
            JSON: {
              "detected": true,
              "preference": "Professional background: Data scientist",
              "description": "User explicitly requested to remember their role"
            }
          
          - User: "Please save this as my preference: I want detailed explanations"
            JSON: {
              "detected": true,
              "preference": "Prefers detailed explanations",
              "description": "User explicitly requested to save communication preference"
            }
          
          - User: "Keep in mind that I'm using TypeScript for all my projects"
            JSON: {
              "detected": true,
              "preference": "TypeScript as primary development language",
              "description": "User explicitly asked to remember their tech stack preference"
            }

          Current user preferences:
          ${currentPreferences.map((pref, index) => `${index + 1}. ${pref}`).join('\n')}

          ONLY detect a preference if the user explicitly states personal information or communication preferences.

          Valid preference examples:
          1. Communication style preferences:
             - User: "I prefer concise, bullet-point responses"
               JSON: {
                 "detected": true,
                 "preference": "Prefers concise bullet-point responses",
                 "description": "User requested brief, structured communication style"
               }
             
             - User: "Please use more technical language in your explanations"
               JSON: {
                 "detected": true,
                 "preference": "Prefers technical language and terminology",
                 "description": "User requested advanced technical vocabulary in explanations"
               }
             
             - User: "Always include code examples in your answers"
               JSON: {
                 "detected": true,
                 "preference": "Requires code examples in explanations",
                 "description": "User learns better with practical code examples"
               }
             
             - User: "I want you to be more direct and skip the pleasantries"
               JSON: {
                 "detected": true,
                 "preference": "Prefers direct communication without small talk",
                 "description": "User requested straightforward responses without conversational elements"
               }
          
          2. Domain expertise/background:
             - User: "I'm a senior software engineer with 10 years of experience in React"
               JSON: {
                 "detected": true,
                 "preference": "Senior software engineer with 10 years React experience",
                 "description": "User has advanced expertise in React development"
               }
             
             - User: "Keep in mind that I'm new to programming"
               JSON: {
                 "detected": true,
                 "preference": "Beginner programmer, needs basic explanations",
                 "description": "User requires foundational explanations without assuming prior knowledge"
               }
             
             - User: "I work in commercial real estate focusing on retail properties"
               JSON: {
                 "detected": true,
                 "preference": "Commercial real estate professional specializing in retail",
                 "description": "User has domain expertise in retail commercial real estate"
               }
          
          3. Learning preferences:
             - User: "I learn better with visual examples"
               JSON: {
                 "detected": true,
                 "preference": "Prefers visual learning examples",
                 "description": "User learns best through visual representations and diagrams"
               }
             
             - User: "Please explain concepts using analogies"
               JSON: {
                 "detected": true,
                 "preference": "Prefers explanations with analogies",
                 "description": "User understands better through comparative examples and metaphors"
               }
             
             - User: "Break down complex topics into smaller steps"
               JSON: {
                 "detected": true,
                 "preference": "Prefers step-by-step breakdowns",
                 "description": "User learns better with incremental, structured explanations"
               }

          Invalid preference examples (DO NOT SAVE THESE - should return {"detected": false}):
          - General statements: "I like Python"
          - Questions: "Can you help me with JavaScript?"
          - Task requests: "Show me how to build an API"
          - One-time instructions: "For this question, use simple terms"
          - Technical preferences: "I use VS Code"

          Return your response as a JSON object in the following format:
          {
            "detected": boolean,
            "preference": string (optional),
            "description": string (optional)
          }

          RESPOND ONLY WITH THE JSON OBJECT. DO NOT INCLUDE ANY OTHER TEXT.
          
          DO NOT ADD OR UPDATE PREFERENCES THAT ALREADY EXIST.
          `
        },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        }))
      ],
      response_format: { type: "json_object" }
    });

    const result = preferenceSchema.parse(JSON.parse(completion.choices[0].message.content || '{}'));

    console.log('PreferenceManager: Generated result:', JSON.stringify(result, null, 2));

    if (result.detected && result.preference) {
      try {
        await saveUserPreference('general', result.preference, token);
        // Update the app state with new preference
        const updatedPreferences = [...currentPreferences, result.preference];
        aiState.update({
          ...(aiState.get() as AIState),
          userPreferences: updatedPreferences
        });
        console.log('PreferenceManager: New preference saved successfully');
      } catch (error) {
        console.error('PreferenceManager: Error saving preference:', error);
      }
    }

    return result;
  } catch (error) {
    console.error('PreferenceManager: Error occurred', error);
    return { detected: false };
  }
}