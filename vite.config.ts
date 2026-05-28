import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    appType: 'mpa',
    preview: {
        allowedHosts: ["bennet.tgreenhagen.com"]
    },
    build: {
        rolldownOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                editor: resolve(__dirname, 'editor/index.html')
            },
        }
    }
})