import { z } from 'zod';

export const enquirySchema = z.object({
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Keep it under 500 characters'),
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;
