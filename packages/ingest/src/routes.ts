import { config, createLogger, getPool, idToHex } from '@geo-runtime/shared'
import { Graph, IdUtils } from '@geoprotocol/geo-sdk'
import { createEdit, decodeEdit, encodeEdit, formatId } from '@geoprotocol/grc-20'
import express, { Router } from 'express'

import type {
	DeleteRelationParams,
	EntityParams,
	RelationParams,
	UpdateEntityParams,
} from '@geoprotocol/geo-sdk'
import type { Op } from '@geoprotocol/grc-20'
import type { Request, Response } from 'express'

const log = createLogger('ingest:routes')

interface BuildBody {
	name?: string
	author?: string
	mutations: Array<
		| { type: 'createEntity'; params: EntityParams }
		| { type: 'createRelation'; params: RelationParams }
		| { type: 'updateEntity'; params: UpdateEntityParams }
		| { type: 'deleteRelation'; params: DeleteRelationParams }
	>
}

const MUTATION_HANDLERS = {
	createEntity: Graph.createEntity,
	createRelation: Graph.createRelation,
	updateEntity: Graph.updateEntity,
	deleteRelation: Graph.deleteRelation,
} as const

type MutationType = keyof typeof MUTATION_HANDLERS

function resolveSpaceId(req: Request): string {
	return (req.headers['x-space-id'] as string | undefined) ?? config.spaceId
}

async function insertEdit(
	id: string,
	spaceId: string,
	author: string,
	name: string,
	blob: Uint8Array,
	opCount: number,
): Promise<void> {
	const pool = getPool()
	await pool.query(
		`INSERT INTO edits (id, space_id, author, name, blob, op_count, status)
		 VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
		[id, spaceId, author, name, Buffer.from(blob), opCount],
	)
}

export function createRouter(): Router {
	const router = Router()

	// POST /edits — accept pre-encoded binary blob
	router.post(
		'/',
		express.raw({ type: 'application/octet-stream', limit: '10mb' }),
		async (req: Request, res: Response) => {
			try {
				const blob = req.body as Buffer
				if (!blob || blob.length === 0) {
					res.status(400).json({ error: 'Empty body' })
					return
				}

				const edit = decodeEdit(new Uint8Array(blob))
				const id = idToHex(edit.id)
				const name = edit.name ?? ''
				const author = edit.authors.length > 0 ? idToHex(edit.authors[0]) : ''
				const opCount = edit.ops.length
				const spaceId = resolveSpaceId(req)

				await insertEdit(id, spaceId, author, name, blob, opCount)

				log.info({ id, name, opCount }, 'Edit ingested (binary)')
				res.status(201).json({ id, name, opCount })
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Unknown error'
				log.error({ err }, 'Failed to ingest binary edit')
				res.status(400).json({ error: message })
			}
		},
	)

	// POST /edits/build — accept JSON mutations, build edit server-side
	router.post('/build', express.json({ limit: '10mb' }), async (req: Request, res: Response) => {
		try {
			const body = req.body as BuildBody
			if (!body.mutations || !Array.isArray(body.mutations) || body.mutations.length === 0) {
				res.status(400).json({ error: 'mutations array is required and must not be empty' })
				return
			}

			const allOps: Op[] = []
			const entityIds: string[] = []

			for (const mutation of body.mutations) {
				const handler = MUTATION_HANDLERS[mutation.type as MutationType]
				if (!handler) {
					res.status(400).json({ error: `Unknown mutation type: ${mutation.type}` })
					return
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const result = (handler as any)(mutation.params)
				allOps.push(...result.ops)
				entityIds.push(result.id)
			}

			const authors = body.author ? [IdUtils.toGrcId(body.author)] : []

			const edit = createEdit({
				name: body.name,
				authors,
				ops: allOps,
			})

			const blob = encodeEdit(edit)
			const id = idToHex(edit.id)
			const name = edit.name ?? ''
			const author = authors.length > 0 ? formatId(authors[0]) : ''
			const opCount = edit.ops.length
			const spaceId = resolveSpaceId(req)

			await insertEdit(id, spaceId, author, name, blob, opCount)

			log.info({ id, name, opCount, entityCount: entityIds.length }, 'Edit ingested (build)')
			res.status(201).json({ id, name, opCount, entityIds })
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error'
			log.error({ err }, 'Failed to build edit')
			res.status(400).json({ error: message })
		}
	})

	return router
}
