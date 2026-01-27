import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';
import path from "path";

export default defineConfig({
    plugins: [
        react(), 
        tailwindcss(),
        cssInjectedByJs({
            // Inject CSS into a custom target (we'll handle Shadow DOM manually)
            injectCodeFunction: function(cssCode: string) {
                // Store CSS globally for Shadow DOM injection
                (window as any).__CALI_WIDGET_CSS__ = cssCode;
            }
        }),
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
    css: {
        // Ensure CSS is processed correctly
        postcss: {
            plugins: [],
        },
    },
    build: {
        outDir: path.resolve(__dirname, "../dist/"),  
        emptyOutDir: true,
        cssCodeSplit: false, // Bundle all CSS together
        lib: {
            entry: resolve(__dirname, "lib/cdn.ts"),
            name: "CaliChatWidget",
            fileName: (format) => {
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
                inlineDynamicImports: true,
                // Ensure CSS is inlined
                assetFileNames: (assetInfo) => {
                    return assetInfo.name || 'assets/[name]-[hash][extname]';
                },
            },
        },
        minify: 'terser',
        sourcemap: false,
    },
});
