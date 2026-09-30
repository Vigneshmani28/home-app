import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_URL is required'),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required'),
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(
      `Invalid environment configuration. Copy .env.example to .env and fill in the values:\n${issues.join('\n')}`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
