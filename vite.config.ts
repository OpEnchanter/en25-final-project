import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    // "/" (not "./") so the service worker can take root scope and control the
    // whole origin. The HTML already uses absolute paths (e.g. /src/main.ts).
    base: "/",
    root: "./",
    appType: 'mpa',
    server: {
        allowedHosts: ["bennet.tgreenhagen.com"]
    },
    preview: {
        allowedHosts: ["bennet.tgreenhagen.com"]
    },
    plugins: [
        VitePWA({
            // Ship a new SW automatically whenever the build changes.
            registerType: "autoUpdate",
            // Generate sw.js + the precache manifest from the build output.
            workbox: {
                // Precache the static shell that Vite emits: code, styles, font.
                // The campaign level JSON is bundled into the JS, so it rides along.
                globPatterns: ["**/*.{js,css,html}"],
                runtimeCaching: [
                    // Sprites/fonts are copied into dist/assets *after* the Vite
                    // build (see build.sh), so they can't be precached. Instead,
                    // cache each one on first request and serve it from disk on
                    // every later load; refresh in the background so updated art
                    // propagates on the next visit (filenames aren't hashed).
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "game-assets",
                            expiration: { maxEntries: 300 },
                        },
                    },
                    // Future user-generated-level backend: always hit the network
                    // for level data, falling back to the last cached copy offline.
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith("/api/levels"),
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "ugc-levels",
                            expiration: { maxEntries: 50 },
                        },
                    },
                ],
            },
            // Show DevTools-visible behavior while running `vite dev`, too.
            devOptions: { enabled: true },
        }),
    ],
})