import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  appType: "mpa",
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input:
        "plugins/Muse/skills/muse/templates/interactive-plan-shell.html",
    },
  },
});
