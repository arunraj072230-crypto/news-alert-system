const API_URL = import.meta.env.VITE_API_URL;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

function getToken() {
  const token = sessionStorage.getItem("token");
  if (!token) throw new Error("Please log in first.");
  return token;
}

function ensureConfiguration() {
  if (!API_URL) throw new Error("API URL is not configured. Check your client environment file.");
  if (!VAPID_PUBLIC_KEY) throw new Error("VAPID public key is missing. Set VITE_VAPID_PUBLIC_KEY.");
}

export async function enablePushNotifications() {
  try {
    ensureConfiguration();
    const token = getToken();

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      throw new Error("Push notifications are not supported by this browser.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Please allow notifications in your browser.");

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to save push subscription.");
    return data.message || "Push notifications enabled successfully!";
  } catch (error) {
    console.error("Enable push notifications error:", error);
    throw error;
  }
}

export async function disablePushNotifications() {
  ensureConfiguration();
  const token = getToken();
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  if (subscription) {
    const response = await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not remove push subscription from the server.");
    await subscription.unsubscribe();
  }
}
