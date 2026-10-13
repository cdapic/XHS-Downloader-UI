/** @type {import('tailwindcss').Config} */
// Tailwind v3 配置（FR-01：样式从 Play CDN 切到构建期编译）
// - content 覆盖所有用到 tailwind class 的源文件
// - theme.extend.colors.xhs 从原先 index.html 内的 inline tailwind.config 迁移过来
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./constants.ts",
    "./types.ts",
    "./*.ts",
    "./*.tsx",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        xhs: {
          red: "#ff2442",
          dark: "#1f2937",
        },
      },
    },
  },
  plugins: [],
};
