interface SearchInputProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
}

/**
 * Search input component with icon.
 * Controlled component that calls onChange on each keystroke.
 */
export function SearchInput({
	value,
	onChange,
	placeholder = 'Search entities...',
	className = '',
}: SearchInputProps) {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onChange(event.target.value)
	}

	return (
		<div className="relative">
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg
					className="h-5 w-5 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					role="img"
					aria-label="Search"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<input
				type="search"
				aria-label="Search entities"
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
			/>
		</div>
	)
}
