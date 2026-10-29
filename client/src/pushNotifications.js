const API_URL = "https://news-alert-system-bgbm.onrender.com";
const VAPID_PUBLIC_KEY = "BBYcjwmqjiG6Azqnhq8ePX61lGjRDVH3WW1NOKA0meNAiwqVaQOwwTt5PnEePUGbMFUprbRr_DoxAtlFGRbcId8";
console.log("VAPID public key loaded:", Boolean(VAPID_PUBLIC_KEY));

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export async function enablePushNotifications() {
  try {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in first.");
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Push notifications are not supported by this browser.");
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error("VAPID public key is missing.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      throw new Error("Please allow notifications in your browser.");
    }

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to save push subscription.");
    }

    return "Push notifications enabled successfully!";
  } catch (error) {
    console.error("Enable push notifications error:", error);
    throw error;
  }
}
