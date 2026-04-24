import { env } from '@/env';
import { authClient } from '@/store/authClient';

const SW_URL = '/sw.js';
const ENABLED_KEY = 'webPushEnabled';

export type PushSupport =
  | 'unsupported'
  | 'blocked'
  | 'disabled'
  | 'enabled'
  | 'pending';

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getPushState(): Promise<PushSupport> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';

  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await reg?.pushManager.getSubscription();
  if (subscription && localStorage.getItem(ENABLED_KEY) === 'true') {
    return 'enabled';
  }
  return 'disabled';
}

async function authHeaders(): Promise<HeadersInit> {
  const token = authClient.getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchPublicKey(): Promise<string | null> {
  const res = await fetch(`${env.PUBLIC_SERVER_URL}/push/config`, {
    headers: await authHeaders(),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { publicKey: string | null };
  return data.publicKey;
}

async function postSubscription(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!p256dh || !auth) throw new Error('Subscription missing keys');

  const res = await fetch(`${env.PUBLIC_SERVER_URL}/push/subscribe`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ endpoint: sub.endpoint, p256dh, auth }),
  });
  if (!res.ok) throw new Error(`Subscribe failed: ${res.status}`);
}

async function postUnsubscribe(endpoint: string): Promise<void> {
  await fetch(`${env.PUBLIC_SERVER_URL}/push/unsubscribe`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ endpoint }),
  });
}

export async function enablePush(): Promise<PushSupport> {
  if (!isPushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return permission === 'denied' ? 'blocked' : 'disabled';
  }

  const publicKey = await fetchPublicKey();
  if (!publicKey) {
    throw new Error('Push notifications are not configured on this server');
  }

  const reg =
    (await navigator.serviceWorker.getRegistration(SW_URL)) ??
    (await navigator.serviceWorker.register(SW_URL, { scope: '/' }));

  // If an old subscription exists (e.g. VAPID key changed), drop it first.
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    const existingKey = arrayBufferToBase64Url(existing.options.applicationServerKey);
    if (existingKey !== publicKey) {
      await postUnsubscribe(existing.endpoint).catch(() => {});
      await existing.unsubscribe();
    }
  }

  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    }));

  await postSubscription(subscription);
  localStorage.setItem(ENABLED_KEY, 'true');
  return 'enabled';
}

export async function disablePush(): Promise<void> {
  localStorage.removeItem(ENABLED_KEY);
  if (!isPushSupported()) return;

  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await reg?.pushManager.getSubscription();
  if (subscription) {
    await postUnsubscribe(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  }
}
