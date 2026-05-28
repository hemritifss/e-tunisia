/**
 * Web Push Notification subscription helper.
 * Call initPushNotifications() after user login.
 */

const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)));
}

export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'your-vapid-public-key') return;

  try {
    // Register the push-specific SW alongside the Workbox PWA SW
    const registration = await navigator.serviceWorker.register('/push-sw.js', {
      scope: '/push-scope',
    });

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    const { api } = await import('./shared/api');
    await api.subscribePush(subscription as any);
  } catch {
    // Silently fail — push is optional
  }
}

export async function unsubscribePushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/push-scope');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      const { api } = await import('./shared/api');
      await api.unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch {
    // Silently fail
  }
}
