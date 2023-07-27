import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  build: {
    assetsDir: './',
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'app',
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          // react: 'React',
        },
      },
    },
  },
  plugins: [
    react(),
    createHtmlPlugin({
      minify: true,
      /**
       * Data that needs to be injected into the index.html ejs template
       */
      inject: {
        data: {
          title: 'hello',
        },
        // tags: [
        //   {
        //     injectTo: 'body-prepend',
        //     tag: 'div',
        //     attrs: {
        //       id: 'tag',
        //     },
        //   },
        // ],
      },
    }),
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
    'process.env': process.env,
  },
});
