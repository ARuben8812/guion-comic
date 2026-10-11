// ============================================
// Guion Comic — Service Worker
// ============================================

const VERSION = "v1.3";
const CACHE = "guion-comic-" + VERSION;

// Archivos que se cachean al instalar (el "esqueleto" de la app).
const ARCHIVOS_BASE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/estilos.css",
  "./js/app.js",
  "./js/almacen.js",
  "./js/proyectos.js",
  "./js/editor.js",
  "./js/exportar.js",
  "./js/portabilidad.js",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png"
];

// --------------------------------------------
// Instalación: guarda el esqueleto en caché.
// --------------------------------------------

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS_BASE))
  );
  // No activar inmediatamente, esperar a que el usuario confirme
  // (ver mensaje SKIP_WAITING más abajo).
});

// --------------------------------------------
// Activación: elimina cachés antiguas.
// --------------------------------------------

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => {
      return Promise.all(
        claves
          .filter((k) => k !== CACHE)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// --------------------------------------------
// Fetch: estrategia "cache primero, red después".
// Si no está en caché, lo busca en la red y lo guarda.
// --------------------------------------------

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  // No interceptar peticiones que no sean GET.
  if (peticion.method !== "GET") return;

  // No interceptar peticiones a otros dominios.
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(peticion).then((respuestaCache) => {
      if (respuestaCache) return respuestaCache;

      return fetch(peticion).then((respuestaRed) => {
        // Guardar en caché una copia para la próxima vez
        if (respuestaRed && respuestaRed.status === 200 && respuestaRed.type === "basic") {
          const copia = respuestaRed.clone();
          caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuestaRed;
      }).catch(() => {
        // Sin red y sin caché: si es navegación, devolver el index cacheado.
        if (peticion.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

// --------------------------------------------
// Mensajes desde la app (por ejemplo, para saltar la espera).
// --------------------------------------------

self.addEventListener("message", (evento) => {
  if (evento.data && evento.data.tipo === "SKIP_WAITING") {
    self.skipWaiting();
  }
});