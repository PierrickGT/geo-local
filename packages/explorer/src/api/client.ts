/**
 * API Client for Knowledge Graph Explorer
 * Base fetch wrapper with typed request helper and ApiError class
 */

import type { ApiErrorResponse } from './types'

// ---------------------------------------------------------------------------
// ApiError Class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
	public readonly status: number
	public readonly data: ApiErrorResponse | unknown

	constructor(status: number, message: string, data: ApiErrorResponse | unknown = {}) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.data = data
	}

	/**
	 * Check if error has a specific API error message
	 */
	getApiMessage(): string | undefined {
		if (typeof this.data === 'object' && this.data !== null && 'error' in this.data) {
			return (this.data as ApiErrorResponse).error
		}
		return undefined
	}
}

// ---------------------------------------------------------------------------
// Request Helper
// ---------------------------------------------------------------------------

/**
 * Base URL for API requests. In development, Vite proxies /api to localhost:3002.
 */
const API_BASE = '/api'

/**
 * Make a typed API request.
 *
 * @param path - API path (e.g., '/entities', '/search?q=foo')
 * @param options - Fetch options (method, body, etc.)
 * @returns Parsed JSON response of type T
 * @throws ApiError on non-2xx responses
 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const url = `${API_BASE}${path}`

	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	})

	if (!response.ok) {
		let errorData: ApiErrorResponse | unknown = {}
		try {
			errorData = await response.json()
		} catch {
			// Response body isn't valid JSON, use empty object
		}

		const message = `API Error: ${response.status} ${response.statusText}`
		throw new ApiError(response.status, message, errorData)
	}

	return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Convenience Methods
// ---------------------------------------------------------------------------

/**
 * Make a GET request
 */
export function get<T>(path: string, options: RequestInit = {}): Promise<T> {
	return request<T>(path, { ...options, method: 'GET' })
}

/**
 * Make a POST request
 */
export function post<T>(path: string, body: unknown, options: RequestInit = {}): Promise<T> {
	return request<T>(path, {
		...options,
		method: 'POST',
		body: JSON.stringify(body),
	})
}
