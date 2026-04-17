import type { Value } from '@geoprotocol/grc-20'

/** Serialized form stored in JSONB. */
export interface StoredValue {
	type: string
	payload: unknown
}

/** Serialize a grc-20 Value to a JSON-safe structure for JSONB storage. */
export function serializeValue(v: Value): StoredValue {
	switch (v.type) {
		case 'boolean':
			return { type: 'boolean', payload: v.value }
		case 'integer':
			return {
				type: 'integer',
				payload: { value: v.value.toString(), unit: v.unit ? bufToBase64(v.unit) : undefined },
			}
		case 'float':
			return {
				type: 'float',
				payload: { value: v.value, unit: v.unit ? bufToBase64(v.unit) : undefined },
			}
		case 'decimal':
			return {
				type: 'decimal',
				payload: {
					exponent: v.exponent,
					mantissa:
						v.mantissa.type === 'i64'
							? { type: 'i64', value: v.mantissa.value.toString() }
							: { type: 'big', bytes: bufToBase64(v.mantissa.bytes) },
					unit: v.unit ? bufToBase64(v.unit) : undefined,
				},
			}
		case 'text':
			return {
				type: 'text',
				payload: { value: v.value, language: v.language ? bufToBase64(v.language) : undefined },
			}
		case 'bytes':
			return { type: 'bytes', payload: bufToBase64(v.value) }
		case 'date': {
			const raw = String(v.value)
			const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
				? raw
				: new Date(raw).toISOString().slice(0, 10)
			return { type: 'date', payload: normalized }
		}
		case 'time':
		case 'datetime':
		case 'schedule':
			return { type: v.type, payload: v.value }
		case 'point':
			return { type: 'point', payload: { lat: v.lat, lon: v.lon, alt: v.alt } }
		case 'rect':
			return {
				type: 'rect',
				payload: { minLat: v.minLat, minLon: v.minLon, maxLat: v.maxLat, maxLon: v.maxLon },
			}
		case 'embedding':
			return {
				type: 'embedding',
				payload: { subType: v.subType, dims: v.dims, data: bufToBase64(v.data) },
			}
		default: {
			const _exhaustive: never = v
			throw new Error(`Unknown value type: ${(_exhaustive as Value).type}`)
		}
	}
}

function bufToBase64(buf: Uint8Array): string {
	return Buffer.from(buf).toString('base64')
}
