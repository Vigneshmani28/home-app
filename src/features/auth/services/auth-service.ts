import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase/client';

/**
 * Deep link back into the app for the password-recovery flow. Supabase
 * redirects the user's browser here (with recovery tokens in the URL) after
 * they tap the "reset password" email link. The app scheme is
 * `constructionmarketplace` (see app.json), so this resolves to something
 * like `constructionmarketplace://reset-password` in a standalone build, or
 * the equivalent Expo Go / dev client URL during development.
 */
export function getResetPasswordRedirectUrl() {
  return Linking.createURL('/reset-password');
}

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

export async function resetPasswordForEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getResetPasswordRedirectUrl(),
  });
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
