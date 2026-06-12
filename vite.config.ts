import { defineConfig } from "vite";

export default defineConfig({
    base: "./",
    root: "./",
    appType: 'mpa',
    server: {
        allowedHosts: ["bennet.tgreenhagen.com"]
    },
    preview: {
        allowedHosts: ["bennet.tgreenhagen.com"]
    }
})