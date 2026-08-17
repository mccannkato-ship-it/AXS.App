import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null
export function hasSupabaseConfig() { return Boolean(supabase) }
export async function getSupabaseSession() { if (!supabase) return null; const { data } = await supabase.auth.getSession(); return data.session }
export async function getSupabaseProfile(userId) { if (!supabase || !userId) return null; const { data } = await supabase.from('profiles').select('email,is_admin,approved,service_code').eq('id', userId).maybeSingle(); return data }
export async function updateSupabaseProfile(userId, values) { if (!supabase || !userId) return { error: new Error('Supabase Auth is not configured.') }; return supabase.from('profiles').update(values).eq('id', userId) }
export async function signInWithSupabase(email, password) { if (!supabase) return { data: null, error: new Error('Supabase Auth is not configured.') }; return supabase.auth.signInWithPassword({ email, password }) }
const DEPLOYED_APP_URL = 'https://axs-app-f6hy.vercel.app'
export async function signUpWithSupabase(email, password) { if (!supabase) return { data: null, error: new Error('Supabase Auth is not configured.') }; const redirectTo = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? DEPLOYED_APP_URL : `${window.location.origin}/`; return supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } }) }
export async function completeSupabaseConfirmation() { if (!supabase) return null; const code = new URLSearchParams(window.location.search).get('code'); if (!code) return null; const { data, error } = await supabase.auth.exchangeCodeForSession(code); if (!error) window.history.replaceState({}, document.title, '/'); return { data, error } }
export async function signOutSupabase() { if (supabase) await supabase.auth.signOut() }
export function authErrorMessage(error) { const message = String(error?.message || '').toLowerCase(); if (message.includes('email not confirmed')) return 'Please confirm your email before signing in.'; if (message.includes('password') || message.includes('invalid login credentials') || message.includes('user not found')) return 'Invalid email or password.'; if (message.includes('rate limit')) return 'Too many attempts. Please try again later.'; return 'Unable to continue right now. Please try again.' }
