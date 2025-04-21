// /lib/schema/api-manager.tsx

import { z } from 'zod';

export const apiManagerSchema = z.object({
  callAPI: z.boolean(),
  api: z.enum(['gov', 'fred']).optional(),
  endpoint: z.string().optional(),
  parameters: z.record(z.any()).optional()
}).strict();

export type APIManagerResult = z.infer<typeof apiManagerSchema>;