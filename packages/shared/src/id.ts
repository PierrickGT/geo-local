import { type Id as GrcId, formatId, parseId } from '@geoprotocol/grc-20'

export type { GrcId }

/** Convert a grc-20 Id (Uint8Array) to a 32-char hex string for DB storage. */
export function idToHex(id: GrcId): string {
	return formatId(id)
}

/** Convert a 32-char hex string from the DB to a grc-20 Id (Uint8Array). */
export function hexToId(hex: string): GrcId {
	const id = parseId(hex)
	if (!id) {
		throw new Error(`Invalid hex ID: ${hex}`)
	}
	return id
}

export { formatId, parseId }
