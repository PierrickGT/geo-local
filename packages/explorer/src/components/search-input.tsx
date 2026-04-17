import { Search } from 'lucide-react'

import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

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
	className,
}: SearchInputProps) {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onChange(event.target.value)
	}

	return (
		<div className="relative">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
			<Input
				type="search"
				aria-label="Search entities"
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				className={cn('pl-10', className)}
			/>
		</div>
	)
}
