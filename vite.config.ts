import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// Vite copies public/ into the build wholesale, which would ship a locally
// generated public/data/evals-coverage.json with `npm run deploy`. Its reuse
// terms are unconfirmed (README, "Measured EDR detection"), so drop it from the
// output; `npm run dev` still serves it. Remove this plugin once reuse is cleared.
function keepEvalsDataOutOfBuild(): Plugin {
  return {
    name: 'keep-evals-data-out-of-build',
    apply: 'build',
    async writeBundle({ dir }) {
      if (dir) await rm(join(dir, 'data', 'evals-coverage.json'), { force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare(), keepEvalsDataOutOfBuild()],
})
