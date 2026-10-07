import { z } from 'zod';

import { normalizeIndianPhone } from '@/features/enquiries/utils/phone';

/** Smallest total price a listing may have, in rupees. */
export const MIN_PRICE = 100;

/** Shortest material name / title that still says something useful ("Sand", "Red clay bricks for sale"). */
export const MIN_MATERIAL_NAME_LENGTH = 3;
export const MIN_TITLE_LENGTH = 10;

/** Rejects entries like "!!!!!!" or "1234567890": there must be at least one letter (any script, e.g. Tamil). */
const hasLetter = (value: string) => /\p{L}/u.test(value);

const LISTING_CONDITIONS = ['unused', 'like_new', 'good', 'used'] as const;

export const listingSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  materialName: z
    .string()
    .trim()
    .min(1, 'Material name is required')
    .min(MIN_MATERIAL_NAME_LENGTH, `Enter at least ${MIN_MATERIAL_NAME_LENGTH} characters, e.g. "Cement"`)
    .max(120, 'Keep it under 120 characters')
    .refine(hasLetter, 'Material name must contain letters'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .min(MIN_TITLE_LENGTH, `Make the title at least ${MIN_TITLE_LENGTH} characters, e.g. "10 bags of UltraTech cement"`)
    .max(150, 'Keep it under 150 characters')
    .refine(hasLetter, 'Title must contain letters'),
  description: z.string().max(2000, 'Keep it under 2000 characters').optional().or(z.literal('')),
  quantity: z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required').max(30),
  /** Total price for the whole quantity being sold (not per unit). */
  price: z
    .number({ message: 'Price is required' })
    .min(MIN_PRICE, `Price must be at least ₹${MIN_PRICE}`),
  /** Total original price for the same quantity, to show a discount. */
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
