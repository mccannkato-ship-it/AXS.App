import { getApp, getApps, initializeApp } from 'firebase/app'
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { supabase } from './supabase-browser.js'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

const firebase = config.apiKey && config.projectId && config.messagingSenderId && config.appId ? getApps().length ? getApp() : initializeApp(config) : null

export function firebaseNotificationsConfigured() { return Boolean(firebase && import.meta.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) }

export async function enablePushNotifications(userId) {
  if (!firebase || !supabase || !userId || !(await isSupported())) throw new Error('Push notifications are not available in this browser.')
  if (!('Notification' in window)) throw new Error('This device does not support browser notifications.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const token = await getToken(getMessaging(firebase), { vapidKey: import.meta.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })
  if (!token) throw new Error('Unable to register this device.')
  const { error } = await supabase.from('push_tokens').upsert({ user_id: userId, token, platform: 'web', updated_at: new Date().toISOString() }, { onConflict: 'token' })
  if (error) throw new Error('Unable to save notification settings.')
  return token
}

export async function disablePushNotifications(userId) {
  if (!firebase || !supabase || !userId || !(await isSupported())) return
  const messaging = getMessaging(firebase)
  const token = await getToken(messaging, { vapidKey: import.meta.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY }).catch(() => null)
  if (token) await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', token)
  await deleteToken(messaging).catch(() => {})
}

export async function listenForPushNotifications(callback) {
  if (!firebase || !(await isSupported())) return () => {}
  return onMessage(getMessaging(firebase), callback)
}
