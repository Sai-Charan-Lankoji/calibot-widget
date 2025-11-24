import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import path from "path"

export default defineConfig({
    plugins: [
        react(), 
        tailwindcss(),
        cssInjectedByJsPlugin(), // This injects CSS into JS
        dts({ rollupTypes: true, tsconfigPath: resolve(__dirname, "tsconfig.lib.json") }), 
        tsconfigPaths()
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./lib"),
        },
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        outDir: path.resolve(__dirname, "../dist/"),  
        emptyOutDir: true,
        lib: {
            entry: resolve(__dirname, "lib/cdn.ts"),
            name: "CaliChatWidget",
            fileName: (format) => {
                // Use .js extension for both UMD and ES formats
                if (format === 'umd') {
                    return 'cali-chat-widget.umd.js';
                }
                return 'cali-chat-widget.js';
            },
            formats: ["umd", "es"],
        },
        rollupOptions: {
            external: [],
            output: {
                exports: 'named',
                globals: {},
                inlineDynamicImports: false,
            },
        },
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
                drop_debugger: true,
            },
            format: {
                comments: false,
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
});
