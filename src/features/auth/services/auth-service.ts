import { supabase } from '@/lib/supabase/client';

export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  district: string;
}) {
  const { email, password, fullName, phone, district } = params;

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...(phone ? { phone } : {}),
        district,
      },
    },
  });
}

export async function signInWithPassword(params: { email: string; password: string }) {
  const { email, password } = params;
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Sends the password-reset email. With the project's "Reset Password" email template set to show
 * `{{ .Token }}`, the email carries a 6-digit code (no link, so no redirect URL is needed).
 */
export async function resetPasswordForEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email);
}

/** Confirms a new account with the 6-digit code from the sign-up email; on success the user is signed in. */
export async function verifySignupCode(params: { email: string; token: string }) {
  return supabase.auth.verifyOtp({ email: params.email, token: params.token, type: 'signup' });
}

/** Sends a fresh sign-up verification code to the same address. */
export async function resendSignupCode(email: string) {
  return supabase.auth.resend({ type: 'signup', email });
}

/** Checks the 6-digit code from the password-reset email; on success a recovery session lets the user set a new password. */
export async function verifyRecoveryCode(params: { email: string; token: string }) {
  return supabase.auth.verifyOtp({ email: params.email, token: params.token, type: 'recovery' });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function fetchOwnProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).single();
}
