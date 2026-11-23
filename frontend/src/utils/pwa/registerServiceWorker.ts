export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.error("Erro ao registrar o Service Worker:", error);

    return null;
  }
}