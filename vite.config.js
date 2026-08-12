import { defineConfig } from "vite";
2
import react from "@vitejs/plugin-react";
3
 
4
export default defineConfig({
5
plugins: [react()],
6
base: "/office-inventory/",
7
});
