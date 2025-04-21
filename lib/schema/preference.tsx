import { z } from 'zod'

export const preferenceSchema = z.object({
  detected: z.boolean(),
  preference: z.string().optional(),
  description: z.string().optional()
}).strict() // This ensures no extra fields are allowed

export type PreferenceResult = z.infer<typeof preferenceSchema>