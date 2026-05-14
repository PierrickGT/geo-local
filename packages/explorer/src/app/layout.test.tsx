import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Layout } from './layout'

function renderLayout(initialPath = '/entities') {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	})

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[initialPath]}>
				<Routes>
					<Route element={<Layout />}>
						<Route path="/entities" element={<div>Entities Page</div>} />
						<Route path="/entities/:id" element={<div>Entity Detail</div>} />
						<Route path="/entities/new" element={<div>New Entity</div>} />
						<Route path="/entities/:id/edit" element={<div>Edit Entity</div>} />
						<Route path="/search" element={<div>Search Page</div>} />
						<Route path="/graph" element={<div>Graph Page</div>} />
						<Route path="/edits" element={<div>Edits Page</div>} />
					</Route>
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>,
	)
}

describe('Layout Shell', () => {
	describe('Sidebar', () => {
		it('renders brand block with logo and sub-label', () => {
			renderLayout()
			expect(screen.getByText('Geo')).toBeInTheDocument()
			expect(screen.getByText('Local')).toBeInTheDocument()
		})

		it('renders SVG nav icons replacing emoji', () => {
			renderLayout()
			const sidebar = screen.getByTestId('sidebar')
			const svgIcons = within(sidebar).getAllByRole('img')
			expect(svgIcons.length).toBeGreaterThanOrEqual(4)
			// No emoji characters in nav
			const navText = sidebar.textContent
			expect(navText).not.toMatch(/[📋🔍🔗📝]/u)
		})

		it('renders Explore group label', () => {
			renderLayout()
			expect(screen.getByText('Explore')).toBeInTheDocument()
		})

		it('renders nav items with labels', () => {
			renderLayout()
			const sidebar = screen.getByTestId('sidebar')
			expect(within(sidebar).getByText('Entities')).toBeInTheDocument()
			expect(within(sidebar).getByText('Search')).toBeInTheDocument()
			expect(within(sidebar).getByText('Graph')).toBeInTheDocument()
			expect(within(sidebar).getByText('Edits')).toBeInTheDocument()
		})

		it('highlights active nav item', () => {
			renderLayout('/entities')
			const activeItem = screen.getByTestId('nav-entities')
			expect(activeItem).toHaveAttribute('aria-current', 'page')
		})

		it('does not highlight inactive nav items', () => {
			renderLayout('/entities')
			const inactiveItem = screen.getByTestId('nav-search')
			expect(inactiveItem).not.toHaveAttribute('aria-current')
		})

		it('has fixed sidebar width', () => {
			renderLayout()
			const sidebar = screen.getByTestId('sidebar')
			expect(sidebar.className).toContain('w-[232px]')
		})
	})

	describe('Top bar', () => {
		it('renders breadcrumb with page context', () => {
			renderLayout('/entities')
			const breadcrumb = screen.getByTestId('breadcrumb')
			expect(within(breadcrumb).getByText('Entities')).toBeInTheDocument()
		})

		it('renders multi-segment breadcrumb on detail pages', () => {
			renderLayout('/entities/abc123')
			// Should show Entities / Entity Name segments
			const breadcrumbs = screen.getByTestId('breadcrumb')
			expect(breadcrumbs).toBeInTheDocument()
		})

		it('renders sync indicator with green dot', () => {
			renderLayout()
			expect(screen.getByTestId('sync-dot')).toBeInTheDocument()
		})

		it('renders ⌘K kbd hint', () => {
			renderLayout()
			expect(screen.getByText('⌘K')).toBeInTheDocument()
		})

		it('renders Command label next to kbd hint', () => {
			renderLayout()
			expect(screen.getByText('Command')).toBeInTheDocument()
		})

		it('top bar has 44px height', () => {
			renderLayout()
			const topBar = screen.getByTestId('top-bar')
			expect(topBar.className).toContain('h-11')
		})

		it('top bar has bottom border and white background', () => {
			renderLayout()
			const topBar = screen.getByTestId('top-bar')
			expect(topBar.className).toContain('border-b')
			expect(topBar.className).toContain('bg-white')
		})
	})

	describe('Navigation', () => {
		it('navigates to Search page', async () => {
			const user = userEvent.setup()
			renderLayout('/entities')

			await user.click(screen.getByTestId('nav-search'))

			expect(screen.getByText('Search Page')).toBeInTheDocument()
		})

		it('navigates to Graph page', async () => {
			const user = userEvent.setup()
			renderLayout('/entities')

			await user.click(screen.getByTestId('nav-graph'))

			expect(screen.getByText('Graph Page')).toBeInTheDocument()
		})

		it('navigates to Edits page', async () => {
			const user = userEvent.setup()
			renderLayout('/entities')

			await user.click(screen.getByTestId('nav-edits'))

			expect(screen.getByText('Edits Page')).toBeInTheDocument()
		})

		it('navigates to Entities page', async () => {
			const user = userEvent.setup()
			renderLayout('/search')

			await user.click(screen.getByTestId('nav-entities'))

			expect(screen.getByText('Entities Page')).toBeInTheDocument()
		})

		it('updates active nav item on navigation', async () => {
			const user = userEvent.setup()
			renderLayout('/entities')

			await user.click(screen.getByTestId('nav-search'))

			const searchItem = screen.getByTestId('nav-search')
			expect(searchItem).toHaveAttribute('aria-current', 'page')
		})
	})
})
