import { z } from 'zod';

import { isTamilNaduDistrict } from '@/constants/tamil-nadu-districts';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z.string().optional().or(z.literal('')),
    district: z
      .string()
      .min(1, 'Select your district')
      .refine((value): boolean => isTamilNaduDistrict(value), 'Select a district from the list'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
