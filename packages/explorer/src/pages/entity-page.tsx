import { useParams } from 'react-router'

export function EntityPage() {
	const { id } = useParams<{ id: string }>()

	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold text-gray-900 mb-4">Entity: {id}</h1>
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<p className="text-gray-500">Entity details will be implemented here.</p>
			</div>
		</div>
	)
}
