import { createLogger, getPool } from '@geo-local/shared'
import { Router } from 'express'
import type { Request, Response } from 'express'

const log = createLogger('api:routes')

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

type SortColumn = 'updated_at' | 'created_at' | 'properties_text'
type SortOrder = 'asc' | 'desc'

const VALID_SORT_COLUMNS: readonly string[] = ['updated_at', 'created_at', 'properties_text']
const VALID_SORT_ORDERS: readonly string[] = ['asc', 'desc']

function parseSortParam(raw: unknown): SortColumn {
	return typeof raw === 'string' && VALID_SORT_COLUMNS.includes(raw)
		? (raw as SortColumn)
		: 'updated_at'
}

function parseOrderParam(raw: unknown): SortOrder {
	return typeof raw === 'string' && VALID_SORT_ORDERS.includes(raw) ? (raw as SortOrder) : 'desc'
}

function buildOrderBy(sort: SortColumn, order: SortOrder): string {
	const direction = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
	if (sort === 'properties_text') {
		return `ORDER BY properties_text ${direction} NULLS LAST, e.id`
	}
	return `ORDER BY e.${sort} ${direction}, e.id`
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
			const sort = parseSortParam(req.query.sort)
			const order = parseOrderParam(req.query.order)
			const orderByClause = buildOrderBy(sort, order)

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
						ON r.from_id = e.id AND r.to_id = $${idx}`
				selectQuery = `
					SELECT e.id, e.created_at, e.updated_at,
						(SELECT t.value->>'value' FROM triples t
						 WHERE t.entity_id = e.id AND t.value_type = 'text'
						 ORDER BY (t.property_id = 'a126ca530c8e48d5b88882c734c38935') DESC, t.property_id LIMIT 1) AS properties_text
					FROM entities e
					INNER JOIN relations r
						ON r.from_id = e.id AND r.to_id = $${idx}
					GROUP BY e.id
					${orderByClause}
					LIMIT $${idx + 1} OFFSET $${idx + 2}`
			} else {
				countQuery = 'SELECT count(*)::int AS total FROM entities'
				selectQuery = `
					SELECT e.id, e.created_at, e.updated_at,
						(SELECT t.value->>'value' FROM triples t
						 WHERE t.entity_id = e.id AND t.value_type = 'text'
						 ORDER BY (t.property_id = 'a126ca530c8e48d5b88882c734c38935') DESC, t.property_id LIMIT 1) AS properties_text
					FROM entities e
					${orderByClause}
					LIMIT $1 OFFSET $2`
			}

			params.push(String(limit), String(offset))
			const [countResult, entitiesResult] = await Promise.all([
				pool.query(countQuery, params.slice(0, idx)),
				pool.query(selectQuery, params),
			])

			res.json({
				total: countResult.rows[0].total,
				entities: entitiesResult.rows.map(formatRow),
			})
		} catch (err) {
			log.error({ err }, 'GET /entities failed')
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /entities/:id
	router.get('/entities/:id', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const { id } = req.params

			const entityRes = await pool.query(
				'SELECT id, created_at, updated_at FROM entities WHERE id = $1',
				[id],
			)
			if (entityRes.rows.length === 0) {
				res.status(404).json({ error: 'Entity not found' })
				return
			}

			const [triplesRes, outgoingRes, incomingRes] = await Promise.all([
				pool.query(
					'SELECT property_id, value_type, value, language FROM triples WHERE entity_id = $1',
					[id],
				),
				pool.query('SELECT id, relation_type, to_id, position FROM relations WHERE from_id = $1', [
					id,
				]),
				pool.query('SELECT id, relation_type, from_id, position FROM relations WHERE to_id = $1', [
					id,
				]),
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
			log.error({ err }, 'GET /entities/:id failed')
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /entities/:id/relations
	router.get('/entities/:id/relations', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const { id } = req.params
			const dir = req.query.dir === 'incoming' ? 'incoming' : 'outgoing'
			const limit = clampInt(req.query.limit, 20, 100)
			const offset = clampInt(req.query.offset, 0, Number.MAX_SAFE_INTEGER)

			const column = dir === 'incoming' ? 'to_id' : 'from_id'
			const query = `
				SELECT id, relation_type, from_id, to_id, position
				FROM relations
				WHERE ${column} = $1
				ORDER BY updated_at DESC
				LIMIT $2 OFFSET $3`
			const result = await pool.query(query, [id, limit, offset])
			res.json({ relations: result.rows.map(formatRow) })
		} catch (err) {
			log.error({ err }, 'GET /entities/:id/relations failed')
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
			const sort = parseSortParam(req.query.sort)
			const order = parseOrderParam(req.query.order)
			const orderByClause = buildOrderBy(sort, order)

			const entitySelect = `SELECT e.id, e.created_at, e.updated_at,
				(SELECT t.value->>'value' FROM triples t
				 WHERE t.entity_id = e.id AND t.value_type = 'text'
				 ORDER BY (t.property_id = 'a126ca530c8e48d5b88882c734c38935') DESC, t.property_id LIMIT 1) AS properties_text`

			// Text search: find distinct entity IDs whose triples match, then fetch full data
			const triplesPromise = pool.query(
				`WITH matching_ids AS (
					SELECT DISTINCT e.id
					FROM entities e
					INNER JOIN triples tr ON tr.entity_id = e.id
					WHERE tr.value_type = 'text'
					  AND tr.value->>'value' ILIKE '%' || $1 || '%'
				)
				${entitySelect}
				FROM entities e
				INNER JOIN matching_ids m ON m.id = e.id
				${orderByClause}
				LIMIT $2`,
				[q, limit],
			)

			// Entity ID search (exact or prefix match on 32-char hex IDs)
			const entityPromise =
				q.length >= 4
					? pool.query(
							`${entitySelect}
							 FROM entities e
							 WHERE e.id ILIKE '%' || $1 || '%'
							 ${orderByClause}
							 LIMIT $2`,
							[q, limit],
						)
					: Promise.resolve({ rows: [] })

			const [triplesResult, entityResult] = await Promise.all([triplesPromise, entityPromise])

			// Deduplicate: entity ID matches and triple matches may overlap
			const seen = new Set<string>()
			const entities: Record<string, unknown>[] = []
			for (const row of [...entityResult.rows, ...triplesResult.rows]) {
				const id = row.id as string
				if (!seen.has(id)) {
					seen.add(id)
					entities.push(formatRow(row))
				}
			}

			res.json({ entities })
		} catch (err) {
			log.error({ err }, 'GET /search failed')
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
			let query =
				'SELECT id, space_id, author, name, status, op_count, created_at, applied_at, error_msg, decoded_ops FROM edits'

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
			log.error({ err }, 'GET /edits failed')
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /edits/:id — must be registered AFTER GET /edits to prevent shadowing
	router.get('/edits/:id', async (req: Request, res: Response) => {
		try {
			const pool = getPool()
			const { id } = req.params

			const result = await pool.query(
				'SELECT id, space_id, author, name, status, op_count, created_at, applied_at, error_msg, decoded_ops FROM edits WHERE id = $1',
				[id],
			)

			if (result.rows.length === 0) {
				res.status(404).json({ error: 'Edit not found' })
				return
			}

			const edit = formatRow(result.rows[0])
			res.json(edit)
		} catch (err) {
			log.error({ err }, 'GET /edits/:id failed')
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	// GET /types
	router.get('/types', async (_req: Request, res: Response) => {
		try {
			const pool = getPool()

			const result = await pool.query(`
				SELECT DISTINCT r.to_id AS id,
					(SELECT t.value->>'value' FROM triples t
					 WHERE t.entity_id = r.to_id AND t.value_type = 'text'
					 ORDER BY (t.property_id = 'a126ca530c8e48d5b88882c734c38935') DESC, t.property_id LIMIT 1) AS name
				FROM relations r
				WHERE r.relation_type = '8f151ba4de204e3c9cb499ddf96f48f1'
				ORDER BY id
			`)

			res.json(result.rows.map(formatRow))
		} catch (err) {
			log.error({ err }, 'GET /types failed')
			res.status(500).json({ error: 'Internal server error' })
		}
	})

	return router
}
