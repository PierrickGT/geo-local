import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts', 'src/db/migrate.ts'],
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	onSuccess: async () => {
		// Copy migration SQL files to dist
		const src = 'src/db/migrations'
		const dest = 'dist/db/migrations'
		mkdirSync(dest, { recursive: true })
		for (const f of readdirSync(src)) {
			if (f.endsWith('.sql')) copyFileSync(join(src, f), join(dest, f))
		}
	},
})
