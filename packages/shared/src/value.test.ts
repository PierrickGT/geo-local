import { createId } from '@geoprotocol/grc-20'
import type { EmbeddingSubType, Value } from '@geoprotocol/grc-20'
import { describe, expect, it } from 'vitest'
import { serializeValue } from './value.js'

const makeUnit = () => createId(new Uint8Array(16).fill(1))

describe('serializeValue', () => {
	it('serializes boolean true', () => {
		const v: Value = { type: 'boolean', value: true }
		expect(serializeValue(v)).toEqual({ type: 'boolean', payload: true })
	})

	it('serializes boolean false', () => {
		const v: Value = { type: 'boolean', value: false }
		expect(serializeValue(v)).toEqual({ type: 'boolean', payload: false })
	})

	it('serializes integer without unit', () => {
		const v: Value = { type: 'integer', value: 42n }
		expect(serializeValue(v)).toEqual({
			type: 'integer',
			payload: { value: '42', unit: undefined },
		})
	})

	it('serializes integer with unit', () => {
		const unit = makeUnit()
		const v: Value = { type: 'integer', value: -7n, unit }
		const result = serializeValue(v)
		expect(result.type).toBe('integer')
		expect(result.payload).toEqual({
			value: '-7',
			unit: Buffer.from(unit).toString('base64'),
		})
	})

	it('serializes float without unit', () => {
		const v: Value = { type: 'float', value: 3.14 }
		expect(serializeValue(v)).toEqual({
			type: 'float',
			payload: { value: 3.14, unit: undefined },
		})
	})

	it('serializes float with unit', () => {
		const unit = makeUnit()
		const v: Value = { type: 'float', value: -0.5, unit }
		const result = serializeValue(v)
		expect(result.type).toBe('float')
		expect(result.payload).toEqual({
			value: -0.5,
			unit: Buffer.from(unit).toString('base64'),
		})
	})

	it('serializes decimal with i64 mantissa', () => {
		const v: Value = {
			type: 'decimal',
			exponent: -2,
			mantissa: { type: 'i64', value: 9999n },
		}
		expect(serializeValue(v)).toEqual({
			type: 'decimal',
			payload: {
				exponent: -2,
				mantissa: { type: 'i64', value: '9999' },
				unit: undefined,
			},
		})
	})

	it('serializes decimal with big mantissa', () => {
		const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
		const v: Value = {
			type: 'decimal',
			exponent: 3,
			mantissa: { type: 'big', bytes },
		}
		expect(serializeValue(v)).toEqual({
			type: 'decimal',
			payload: {
				exponent: 3,
				mantissa: { type: 'big', bytes: Buffer.from(bytes).toString('base64') },
				unit: undefined,
			},
		})
	})

	it('serializes text without language', () => {
		const v: Value = { type: 'text', value: 'hello world' }
		expect(serializeValue(v)).toEqual({
			type: 'text',
			payload: { value: 'hello world', language: undefined },
		})
	})

	it('serializes text with language', () => {
		const lang = makeUnit()
		const v: Value = { type: 'text', value: 'bonjour', language: lang }
		const result = serializeValue(v)
		expect(result.type).toBe('text')
		expect(result.payload).toEqual({
			value: 'bonjour',
			language: Buffer.from(lang).toString('base64'),
		})
	})

	it('serializes bytes', () => {
		const data = new Uint8Array([1, 2, 3, 4])
		const v: Value = { type: 'bytes', value: data }
		expect(serializeValue(v)).toEqual({
			type: 'bytes',
			payload: Buffer.from(data).toString('base64'),
		})
	})

	it('serializes date', () => {
		const v: Value = { type: 'date', value: '2024-01-15' }
		expect(serializeValue(v)).toEqual({ type: 'date', payload: '2024-01-15' })
	})

	it('normalizes date with timezone suffix to YYYY-MM-DD', () => {
		const v: Value = { type: 'date', value: '2002-07-01Z' }
		expect(serializeValue(v)).toEqual({ type: 'date', payload: '2002-07-01' })
	})

	it('normalizes date with datetime format to YYYY-MM-DD', () => {
		const v: Value = { type: 'date', value: '2002-07-01T00:00:00Z' }
		expect(serializeValue(v)).toEqual({ type: 'date', payload: '2002-07-01' })
	})

	it('serializes time', () => {
		const v: Value = { type: 'time', value: '14:30:45Z' }
		expect(serializeValue(v)).toEqual({ type: 'time', payload: '14:30:45Z' })
	})

	it('serializes datetime', () => {
		const v: Value = { type: 'datetime', value: '2024-01-15T14:30:45Z' }
		expect(serializeValue(v)).toEqual({
			type: 'datetime',
			payload: '2024-01-15T14:30:45Z',
		})
	})

	it('serializes schedule', () => {
		const v: Value = { type: 'schedule', value: 'R5/2024-01-01T00:00:00Z/P1D' }
		expect(serializeValue(v)).toEqual({
			type: 'schedule',
			payload: 'R5/2024-01-01T00:00:00Z/P1D',
		})
	})

	it('serializes point without altitude', () => {
		const v: Value = { type: 'point', lat: 48.8566, lon: 2.3522 }
		expect(serializeValue(v)).toEqual({
			type: 'point',
			payload: { lat: 48.8566, lon: 2.3522, alt: undefined },
		})
	})

	it('serializes point with altitude', () => {
		const v: Value = { type: 'point', lat: 48.8566, lon: 2.3522, alt: 100 }
		expect(serializeValue(v)).toEqual({
			type: 'point',
			payload: { lat: 48.8566, lon: 2.3522, alt: 100 },
		})
	})

	it('serializes rect', () => {
		const v: Value = { type: 'rect', minLat: 1, minLon: 2, maxLat: 3, maxLon: 4 }
		expect(serializeValue(v)).toEqual({
			type: 'rect',
			payload: { minLat: 1, minLon: 2, maxLat: 3, maxLon: 4 },
		})
	})

	it('serializes embedding', () => {
		const data = new Uint8Array(8).fill(0xab)
		const v: Value = {
			type: 'embedding',
			subType: 0 as EmbeddingSubType,
			dims: 2,
			data,
		}
		expect(serializeValue(v)).toEqual({
			type: 'embedding',
			payload: {
				subType: 0,
				dims: 2,
				data: Buffer.from(data).toString('base64'),
			},
		})
	})

	it('throws on unknown value type at compile time (exhaustive check)', () => {
		const unknown = { type: 'unknown', value: 'bad' } as unknown as Value
		expect(() => serializeValue(unknown)).toThrow('Unknown value type: unknown')
	})
})
