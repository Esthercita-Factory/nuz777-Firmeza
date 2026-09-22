import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    base: "/dist/",
    plugins: [tailwindcss()],
    build: {
        outDir: "wwwroot/dist",
        emptyOutDir: false,
        rollupOptions: {
            input: "Assets/main.js",
            output: {
                entryFileNames: "[name].js",
                assetFileNames: "[name][extname]"
            }
        }
    }
});
