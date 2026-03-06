import '@testing-library/jest-dom/vitest'

// Polyfill ResizeObserver for ReactFlow tests
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock
