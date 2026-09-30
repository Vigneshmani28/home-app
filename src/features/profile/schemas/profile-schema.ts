import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120, 'Keep it under 120 characters'),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-]{10,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  district: z.string().min(1, 'Select your district').max(80),
  locality: z.string().max(120).optional().or(z.literal('')),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')
    .optional()
    .or(z.literal('')),
  showPhonePublicly: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
