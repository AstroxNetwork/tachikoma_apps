import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
// import { createHtmlPlugin } from "vite-plugin-html";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  build: {
    assetsDir: "./",
    rollupOptions: {
      output: {
        format: "iife",
        name: "app",
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          // react: 'React',
        },
      },
    },
  },
  plugins: [
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ["path"],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      // exclude: [
      //   'http', // Excludes the polyfill for `http` and `node:http`.
      // ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // Override the default polyfills for specific modules.
      overrides: {
        // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
        fs: "memfs",
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
    react(),
    mkcert({
      force: true,
      autoUpgrade: false,
      savePath: path.resolve(__dirname, ".certs"),
    }),
    // createHtmlPlugin({
    //   minify: true,
    //   /**
    //    * Data that needs to be injected into the index.html ejs template
    //    */
    //   inject: {
    //     data: {
    //       title: 'hello',
    //     },
    //     // tags: [
    //     //   {
    //     //     injectTo: 'body-prepend',
    //     //     tag: 'div',
    //     //     attrs: {
    //     //       id: 'tag',
    //     //     },
    //     //   },
    //     // ],
    //   },
    // }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        // 支持内联 JavaScript
        javascriptEnabled: true,
      },
    },
  },
  define: {
    "process.env": process.env,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // process: "process/browser",
      // stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
      Buffer: "buffer",
    },
  },
  server: {
    https: true,
    // hmr: {
    //   protocol: 'ws',
    //   host: 'localhost',
    // },

    proxy: {
      "/mempool": {
        target: "https://mempool.space",
        changeOrigin: false,
      },
    },
  },
});
