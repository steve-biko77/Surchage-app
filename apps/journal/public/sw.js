/* Service worker de Journal.
   Son seul rôle est de recevoir les notifications push et de les afficher :
   pas de mise en cache hors-ligne, pour ne pas servir de pages périmées. */

self.addEventListener("install", () => {
  // Pas d'attente : la nouvelle version remplace l'ancienne tout de suite.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let donnees = {};
  try {
    donnees = event.data ? event.data.json() : {};
  } catch {
    donnees = { corps: event.data ? event.data.text() : "" };
  }

  const titre = donnees.titre || "Journal";
  const options = {
    body: donnees.corps || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    lang: "fr",
    // Un seul rappel à la fois : un nouveau remplace le précédent plutôt que
    // d'empiler trois notifications identiques dans le centre de notifications.
    tag: donnees.tag || "journal-rappel",
    renotify: true,
    data: { url: donnees.url || "/jour" },
  };

  event.waitUntil(self.registration.showNotification(titre, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = (event.notification.data && event.notification.data.url) || "/jour";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      // Si l'app est déjà ouverte, on la ramène au premier plan au lieu
      // d'ouvrir un second onglet.
      for (const f of fenetres) {
        if ("focus" in f) {
          f.navigate(cible).catch(() => {});
          return f.focus();
        }
      }
      return self.clients.openWindow(cible);
    })
  );
});
