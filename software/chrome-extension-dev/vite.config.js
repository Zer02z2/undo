import { basename } from "path"
import fs from "fs"

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
      } else if (basename(id) === "face_mesh.js") {
        let code = fs.readFileSync(id, "utf-8")
        //code += "exports.FaceMesh = FaceMesh;"
        return { code }
      } else {
        return null
      }
    },
  }
}

export default {
  build: {
    assetsDir: "",
    rollupOptions: {
      plugins: [mediapipe_workaround()],
      input: {
        main: "/src/main.ts",
      },
      output: {
        dir: "../chrome-extension",
        entryFileNames: "content.js",
      },
    },
  },
}
