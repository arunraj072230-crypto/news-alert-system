
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "News Alert",
      body: event.data ? event.data.text() : "New news available!",
    };
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || "News Alert",
      {
        body: data.body || "A new article is available.",
        icon: "/vite.svg",
        data: { url: data.url || "/" },
      }
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  );
});
