import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'fix-liveness-hash-table-import-method',
      enforce: 'pre',
      apply: 'serve',
      transform(code, id) {
        if (!id.replaceAll('\\', '/').includes('/node_modules/.vite/deps/@aws-amplify_ui-react-liveness.js')) return
        // Vite mistakes TensorFlow's method named import for a dynamic import in dev mode.
        return code.replace('async import(keys, values)', 'async ["import"](keys, values)')
      },
    },
    react(),
    tailwindcss(),
  ],
});
