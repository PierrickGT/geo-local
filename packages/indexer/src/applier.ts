import type { Edit } from '@geoprotocol/grc-20'
import type pg from 'pg'
import { createEntity } from './ops/create-entity.js'
import { createRelation } from './ops/create-relation.js'
import { createValueRef } from './ops/create-value-ref.js'
import { deleteEntity } from './ops/delete-entity.js'
import { deleteRelation } from './ops/delete-relation.js'
import { updateEntity } from './ops/update-entity.js'
import { updateRelation } from './ops/update-relation.js'

export async function applyEdit(client: pg.PoolClient, edit: Edit, spaceId: string): Promise<void> {
	for (const op of edit.ops) {
		switch (op.type) {
			case 'createEntity':
				await createEntity(client, op, spaceId)
				break
			case 'updateEntity':
				await updateEntity(client, op, spaceId)
				break
			case 'deleteEntity':
				await deleteEntity(client, op)
				break
			case 'createRelation':
				await createRelation(client, op)
				break
			case 'updateRelation':
				await updateRelation(client, op)
				break
			case 'deleteRelation':
				await deleteRelation(client, op)
				break
			case 'createValueRef':
				await createValueRef(client, op)
				break
			case 'restoreEntity':
			case 'restoreRelation':
				break
		}
	}
}
