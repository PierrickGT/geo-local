import { NIL_ID, createId } from '@geoprotocol/grc-20'
import { describe, expect, it } from 'vitest'
import { hexToId, idToHex } from './id.js'

describe('idToHex', () => {
	it('converts a nil ID to all-zeros hex', () => {
		expect(idToHex(NIL_ID)).toBe('00000000000000000000000000000000')
	})

	it('converts a custom ID to 32-char lowercase hex', () => {
		const bytes = new Uint8Array(16)
		bytes[0] = 0xab
		bytes[15] = 0xcd
		const id = createId(bytes)
		expect(idToHex(id)).toBe('ab0000000000000000000000000000cd')
	})

	it('always produces a 32-char string', () => {
		const bytes = new Uint8Array(16).fill(0xff)
		const id = createId(bytes)
		const hex = idToHex(id)
		expect(hex).toHaveLength(32)
		expect(hex).toMatch(/^[0-9a-f]{32}$/)
	})
})

describe('hexToId', () => {
	it('round-trips a nil ID', () => {
		const hex = idToHex(NIL_ID)
		const id = hexToId(hex)
		expect(idToHex(id)).toBe(hex)
	})

	it('round-trips a custom ID', () => {
		const bytes = new Uint8Array(16)
		bytes[0] = 0x12
		bytes[7] = 0x34
		bytes[15] = 0x56
		const original = createId(bytes)
		const hex = idToHex(original)
		const restored = hexToId(hex)
		expect(idToHex(restored)).toBe(hex)
	})

	it('throws on invalid hex string', () => {
		expect(() => hexToId('not-a-valid-id')).toThrow()
	})

	it('throws on empty string', () => {
		expect(() => hexToId('')).toThrow()
	})

	it('throws on too-short hex', () => {
		expect(() => hexToId('0123456789ab')).toThrow()
	})
})
