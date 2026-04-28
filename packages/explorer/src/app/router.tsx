import { Navigate, createBrowserRouter } from 'react-router'
import { CreateEntityPage } from '~/pages/create-entity-page'
import { EditEntityPage } from '~/pages/edit-entity-page'
import { EditsPage } from '~/pages/edits-page'
import { EntitiesPage } from '~/pages/entities-page'
import { EntityPage } from '~/pages/entity-page'
import { GraphPageWithProvider as GraphPage } from '~/pages/graph-page'
import { SearchPage } from '~/pages/search-page'
import { Layout } from './layout'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{
				index: true,
				element: <Navigate to="/entities" replace />,
			},
			{
				path: 'entities',
				element: <EntitiesPage />,
			},
			{
				path: 'entities/new',
				element: <CreateEntityPage />,
			},
			{
				path: 'entities/:id/edit',
				element: <EditEntityPage />,
			},
			{
				path: 'entities/:id',
				element: <EntityPage />,
			},
			{
				path: 'search',
				element: <SearchPage />,
			},
			{
				path: 'graph',
				element: <GraphPage />,
			},
			{
				path: 'edits',
				element: <EditsPage />,
			},
		],
	},
])
