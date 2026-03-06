import { useState } from 'react'

interface TruncateIdProps {
	id: string
	maxLength?: number
	className?: string
}

/**
 * Truncates a hex ID to show first N characters with ellipsis.
 * Includes a copy button to copy the full ID to clipboard.
 */
export function TruncateId({ id, maxLength = 8, className = '' }: TruncateIdProps) {
	const [copied, setCopied] = useState(false)

	const truncated = id.length > maxLength ? `${id.slice(0, maxLength)}...` : id

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(id)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			console.error('Failed to copy to clipboard')
		}
	}

	return (
		<span className={`inline-flex items-center gap-1 font-mono text-sm ${className}`}>
			<span className="text-gray-700" title={id}>
				{truncated}
			</span>
			<button
				type="button"
				onClick={handleCopy}
				className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
				title={copied ? 'Copied!' : 'Copy to clipboard'}
			>
				{copied ? (
					<svg
						className="w-4 h-4 text-green-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						role="img"
						aria-label="Copied"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				) : (
					<svg
						className="w-4 h-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						role="img"
						aria-label="Copy to clipboard"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				)}
			</button>
		</span>
	)
}
