import { getPool } from '@geo-runtime/shared'
import { Router } from 'express'
import type { Request, Response } from 'express'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Trim space-padded char(32) fields from postgres. */
function trimRow<T extends Record<string, unknown>>(row: T): T {
	const out = {} as Record<string, unknown>
	for (const [k, v] of Object.entries(row)) {
		out[k] = typeof v === 'string' ? v.trim() : v
	}
	return out as T
}

/** snake_case → camelCase key mapping for a single row. */
function camelRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(row)) {
		const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
		out[camel] = v
	}
	return out
}

/** Trim + camelCase a row. */
function formatRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
	return camelRow(trimRow(row))
}

/** Clamp a numeric query param. */
function clampInt(raw: unknown, defaultVal: number, max: number): number {
	const n = Number(raw)
	if (!Number.isFinite(n) || n < 0) return defaultVal
	return Math.min(Math.floor(n), max)
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function createRouter(): Router {
	const router = Router()

	// GET /entities
	router.get('/entities', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const typeId = typeof req.query.type === 'string' ? req.query.type.trim() : undefined
			const limit = clampInt(req.query.limit, 20, 100)
			const offset = clampInt(req.query.offset, 0, Number.MAX_SAFE_INTEGER)

			const params: string[] = []
			let idx = 0

			let countQuery: string
			let selectQuery: string

			if (typeId) {
				params.push(typeId)
				idx++
				countQuery = `
					SELECT count(*)::int AS total
					FROM entities e
					INNER JOIN relations r
						ON r.from_id = e.id AND r.to_id = $${idx} AND r.status = 'alive'
					WHERE e.status = 'alive'`
				selectQuery = `
					SELECT e.id, e.status, e.created_at, e.updated_at,
						(SELECT t.value->>'value' FROM triples t
						 WHERE t.entity_id = e.id AND t.value_type = 'text'
						 ORDER BY t.property_id LIMIT 1) AS properties_text
					FROM entities e
					INNER JOIN relations r
						ON r.from_id = e.id AND r.to_id = $${idx} AND r.status = 'alive'
					WHERE e.status = 'alive'
					ORDER BY e.created_at DESC
					LIMIT $${idx + 1} OFFSET $${idx + 2}`
				params.push(String(limit), String(offset))
			} else {
				countQuery = `
					SELECT count(*)::int AS total
					FROM entities e
					WHERE e.status = 'alive'`
				selectQuery = `
					SELECT e.id, e.status, e.created_at, e.updated_at,
						(SELECT t.value->>'value' FROM triples t
						 WHERE t.entity_id = e.id AND t.value_type = 'text'
						 ORDER BY t.property_id LIMIT 1) AS properties_text
					FROM entities e
					WHERE e.status = 'alive'
					ORDER BY e.created_at DESC
					LIMIT $${idx + 1} OFFSET $${idx + 2}`
				params.push(String(limit), String(offset))
			}

			const [countRes, entitiesRes] = await Promise.all([
				pool.query(countQuery, typeId ? [params[0]] : []),
				pool.query(selectQuery, params),
			])

			res.json({
				entities: entitiesRes.rows.map(formatRow),
				total: countRes.rows[0]?.total ?? 0,
				limit,
				offset,
			})
		} catch (err) {
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /entities/:id
	router.get('/entities/:id', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const { id } = req.params

			const entityRes = await pool.query(
				'SELECT id, status, created_at, updated_at FROM entities WHERE id = $1',
				[id],
			)
			if (entityRes.rows.length === 0) {
				res.status(404).json({ error: 'Entity not found' })
				return
			}

			const [triplesRes, outgoingRes, incomingRes] = await Promise.all([
				pool.query(
					'SELECT entity_id, property_id, value_type, value, language FROM triples WHERE entity_id = $1',
					[id],
				),
				pool.query("SELECT * FROM relations WHERE from_id = $1 AND status = 'alive'", [id]),
				pool.query("SELECT * FROM relations WHERE to_id = $1 AND status = 'alive'", [id]),
			])

			res.json({
				entity: {
					...formatRow(entityRes.rows[0]),
					triples: triplesRes.rows.map(formatRow),
					outgoing: outgoingRes.rows.map(formatRow),
					incoming: incomingRes.rows.map(formatRow),
				},
			})
		} catch (err) {
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /entities/:id/relations
	router.get('/entities/:id/relations', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const { id } = req.params
			const direction = req.query.direction === 'in' ? 'in' : 'out'
			const relationType = typeof req.query.type === 'string' ? req.query.type.trim() : undefined

			const dirColumn = direction === 'out' ? 'from_id' : 'to_id'
			const params: string[] = [id]
			let query = `SELECT * FROM relations WHERE ${dirColumn} = $1 AND status = 'alive'`

			if (relationType) {
				params.push(relationType)
				query += ` AND relation_type = $${params.length}`
			}

			query += ' ORDER BY created_at DESC'

			const result = await pool.query(query, params)
			res.json({ relations: result.rows.map(formatRow) })
		} catch (err) {
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /search
	router.get('/search', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
			if (!q) {
				res.status(400).json({ error: 'Query parameter "q" is required' })
				return
			}

			const limit = clampInt(req.query.limit, 20, 100)

			const result = await pool.query(
				`SELECT entity_id, property_id, value, language
				 FROM triples
				 WHERE value_type = 'text'
				   AND value->>'value' ILIKE '%' || $1 || '%'
				 LIMIT $2`,
				[q, limit],
			)

			res.json({
				results: result.rows.map(formatRow),
			})
		} catch (err) {
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /edits
	router.get('/edits', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const status = typeof req.query.status === 'string' ? req.query.status.trim() : undefined
			const limit = clampInt(req.query.limit, 20, 100)

			const params: string[] = []
			let query = `SELECT id, space_id, author, name, status, op_count, created_at, applied_at, error_msg FROM edits`

			if (status) {
				params.push(status)
				query += ` WHERE status = $${params.length}`
			}

			query += ' ORDER BY created_at DESC'
			params.push(String(limit))
			query += ` LIMIT $${params.length}`

			const result = await pool.query(query, params)
			res.json({ edits: result.rows.map(formatRow) })
		} catch (err) {
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	return router
}
