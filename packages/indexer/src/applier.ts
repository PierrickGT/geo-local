import type pg from 'pg'
import type { Edit } from '@geoprotocol/grc-20'
import { createEntity } from './ops/create-entity.js'
import { updateEntity } from './ops/update-entity.js'
import { deleteEntity } from './ops/delete-entity.js'
import { restoreEntity } from './ops/restore-entity.js'
import { createRelation } from './ops/create-relation.js'
import { updateRelation } from './ops/update-relation.js'
import { deleteRelation } from './ops/delete-relation.js'
import { restoreRelation } from './ops/restore-relation.js'
import { createValueRef } from './ops/create-value-ref.js'

export async function applyEdit(client: pg.PoolClient, edit: Edit): Promise<void> {
	for (const op of edit.ops) {
		switch (op.type) {
			case 'createEntity':
				await createEntity(client, op)
				break
			case 'updateEntity':
				await updateEntity(client, op)
				break
			case 'deleteEntity':
				await deleteEntity(client, op)
				break
			case 'restoreEntity':
				await restoreEntity(client, op)
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
			case 'restoreRelation':
				await restoreRelation(client, op)
				break
			case 'createValueRef':
				await createValueRef(client, op)
				break
		}
	}
}
