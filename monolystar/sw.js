/**
 * PWA対応（仕様書9章）のためのアプリシェルキャッシュ用Service Worker。
 *
 * 方針: ナビゲーションリクエストのみ network-first、キャッシュはオフライン時の
 * フォールバック専用とする。常にネットワークを優先することで、バージョン管理・
 * ビルド時のキャッシュ名注入なしに「更新したのに古い画面が表示され続ける」事故を防ぐ。
 */
const CACHE_NAME = "monolystar-shell-v1";
const APP_SHELL_URL = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(APP_SHELL_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, responseClone));
        return response;
      })
      .catch(() => caches.match(APP_SHELL_URL)),
  );
});
