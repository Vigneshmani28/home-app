import { z } from 'zod';

import { normalizeIndianPhone } from '@/features/enquiries/utils/phone';

const LISTING_CONDITIONS = ['unused', 'like_new', 'good', 'used'] as const;

export const listingSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  materialName: z
    .string()
    .min(1, 'Material name is required')
    .max(120, 'Keep it under 120 characters'),
  title: z.string().min(1, 'Title is required').max(150, 'Keep it under 150 characters'),
  description: z.string().max(2000, 'Keep it under 2000 characters').optional().or(z.literal('')),
  quantity: z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required').max(30),
  price: z.number({ message: 'Price is required' }).min(0, 'Price cannot be negative'),
  originalPrice: z.number().min(0).optional().nullable(),
  condition: z.enum(LISTING_CONDITIONS),
  brand: z.string().max(100).optional().or(z.literal('')),
  manufactureDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  district: z.string().min(1, 'District is required'),
  locality: z.string().min(1, 'Locality is required').max(120),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')
    .optional()
    .or(z.literal('')),
  /** Number buyers call / WhatsApp for this listing. Required — it is the only way buyers reach the seller. */
  contactPhone: z
    .string()
    .min(1, 'Enter a contact number')
    .refine((value): boolean => normalizeIndianPhone(value) !== null, 'Enter a valid 10-digit mobile number'),
  pickupAvailable: z.boolean(),
  deliveryAvailable: z.boolean(),
});

export type ListingFormValues = z.infer<typeof listingSchema>;
