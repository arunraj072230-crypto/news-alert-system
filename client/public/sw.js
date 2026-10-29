
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

  const targetUrl = new URL("/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then(async (windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.navigate(targetUrl);
          await client.focus();
          return;
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});


