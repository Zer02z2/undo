import { basename } from "path"
import fs from "fs"
import { optimizeDeps } from "vite"

function mediapipe_workaround() {
  return {
    name: "mediapipe_workaround",
    load(id) {
      if (basename(id) === "selfie_segmentation.js") {
        let code = fs.readFileSync(id, "utf-8")
        code += "exports.SelfieSegmentation = SelfieSegmentation;"
        return { code }
      } else if (basename(id) === "hands.js") {
        let code = fs.readFileSync(id, "utf-8")
        code += "exports.Hands = Hands;"
        return { code }
      }
      // else if (basename(id) === "vision_wasm_internal.js") {
      //   let code = fs.readFileSync(id, "utf-8")
      //   code += "exports.ModuleFactory = ModuleFactory;"
      //   return { code }
      // } else if (basename(id) === "vision_wasm_nosimd_internal.js") {
      //   let code = fs.readFileSync(id, "utf-8")
      //   code += "exports.ModuleFactory = ModuleFactory;"
      //   return { code }
      // }
      else {
        return null
      }
    },
  }
}

export default {
  build: {
    assetsDir: "",
    rollupOptions: {
      //plugins: [mediapipe_workaround()],
      input: {
        main: "/index.html",
        inject: "/src/inject.ts",
        background: "/src/background.ts",
        content: "/src/content.ts",
      },
      output: {
        dir: "../chrome-extension",
        entryFileNames: "[name].js",
      },
    },
  },
}
