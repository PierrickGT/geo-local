import { useState } from 'react'

import type * as React from 'react'

import { cn } from '~/lib/utils'

function CopyIdButton({
	value,
	className,
	...props
}: React.ComponentProps<'button'> & { value: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			setCopied(false)
		}
	}

	return (
		<button
			type="button"
			data-slot="copy-id-button"
			className={cn(
				'inline-flex items-center justify-center p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
				className,
			)}
			onClick={handleCopy}
			aria-label={copied ? 'Copied' : 'Copy to clipboard'}
			{...props}
		>
			{copied ? (
				<svg
					width="11"
					height="11"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					role="img"
					aria-label="Copied"
					className="text-success"
				>
					<path d="M5 13l4 4L19 7" />
				</svg>
			) : (
				<svg
					width="11"
					height="11"
					viewBox="0 0 11 11"
					fill="none"
					stroke="currentColor"
					strokeWidth="1"
					strokeLinecap="round"
					strokeLinejoin="round"
					role="img"
					aria-label="Copy to clipboard"
				>
					<rect x="3" y="3" width="6.5" height="6.5" rx="1" />
					<path d="M1.5 7.5V2a.5.5 0 0 1 .5-.5h5.5" />
				</svg>
			)}
		</button>
	)
}

export { CopyIdButton }
