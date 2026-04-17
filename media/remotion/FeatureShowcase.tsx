import React from 'react'
import {
	AbsoluteFill,
	Sequence,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Img,
	staticFile,
} from 'remotion'

const BACKGROUND = '#0f172a'
const ACCENT = '#3b82f6'
const TEXT_PRIMARY = '#f8fafc'
const TEXT_SECONDARY = '#94a3b8'

const SlideIn: React.FC<{
	children: React.ReactNode
	delay: number
	direction?: 'left' | 'right' | 'bottom'
}> = ({ children, delay, direction = 'left' }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const progress = spring({
		frame: frame - delay,
		fps,
		config: { damping: 25, stiffness: 120 },
	})

	const translateX = direction === 'left'
		? interpolate(progress, [0, 1], [-100, 0])
		: direction === 'right'
			? interpolate(progress, [0, 1], [100, 0])
			: 0

	const translateY = direction === 'bottom'
		? interpolate(progress, [0, 1], [80, 0])
		: 0

	return (
		<div
			style={{
				transform: `translate(${translateX}px, ${translateY}px)`,
				opacity: progress,
			}}
		>
			{children}
		</div>
	)
}

const FadeIn: React.FC<{
	children: React.ReactNode
	delay: number
}> = ({ children, delay }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const progress = spring({
		frame: frame - delay,
		fps,
		config: { damping: 30 },
	})

	return (
		<div style={{ opacity: progress }}>
			{children}
		</div>
	)
}

const TitleScreen: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const titleScale = spring({
		frame,
		fps,
		config: { damping: 15, stiffness: 80 },
	})

	const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const glowOpacity = interpolate(frame, [0, 30, 60], [0, 0.6, 0.3], {
		extrapolateRight: 'clamp',
	})

	return (
		<AbsoluteFill
			style={{
				background: BACKGROUND,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					position: 'absolute',
					width: 600,
					height: 600,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)`,
					opacity: glowOpacity,
				}}
			/>
			<div style={{ transform: `scale(${titleScale})`, textAlign: 'center' }}>
				<div
					style={{
						fontSize: 64,
						fontWeight: 800,
						color: TEXT_PRIMARY,
						letterSpacing: -2,
					}}
				>
					Knowledge Graph
				</div>
				<div
					style={{
						fontSize: 64,
						fontWeight: 800,
						color: ACCENT,
						letterSpacing: -2,
					}}
				>
					Explorer
				</div>
			</div>
			<div
				style={{
					fontSize: 22,
					color: TEXT_SECONDARY,
					marginTop: 20,
					opacity: subtitleOpacity,
					textAlign: 'center',
				}}
			>
				Browse, search and visualize your knowledge graph
			</div>
		</AbsoluteFill>
	)
}

const SectionTitle: React.FC<{
	title: string
	subtitle: string
	number: string
}> = ({ title, subtitle, number }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const scale = spring({
		frame,
		fps,
		config: { damping: 20, stiffness: 100 },
	})

	const lineProgress = interpolate(frame, [5, 25], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	return (
		<AbsoluteFill
			style={{
				background: BACKGROUND,
				justifyContent: 'center',
				paddingLeft: 100,
			}}
		>
			<div style={{ transform: `scale(${scale})` }}>
				<div
					style={{
						fontSize: 120,
						fontWeight: 900,
						color: `${ACCENT}22`,
						position: 'absolute',
						top: -70,
						left: -20,
					}}
				>
					{number}
				</div>
				<div
					style={{
						fontSize: 48,
						fontWeight: 700,
						color: TEXT_PRIMARY,
						position: 'relative',
					}}
				>
					{title}
				</div>
				<div
					style={{
						width: 80 * lineProgress,
						height: 4,
						background: ACCENT,
						marginTop: 12,
						marginBottom: 12,
						borderRadius: 2,
					}}
				/>
				<div style={{ fontSize: 20, color: TEXT_SECONDARY }}>
					{subtitle}
				</div>
			</div>
		</AbsoluteFill>
	)
}

const ScreenshotShowcase: React.FC<{
	imageSrc: string
	caption: string
	description: string
}> = ({ imageSrc, caption, description }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const imageProgress = spring({
		frame,
		fps,
		config: { damping: 25, stiffness: 100 },
	})

	const captionOpacity = interpolate(frame, [15, 30], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	return (
		<AbsoluteFill
			style={{
				background: BACKGROUND,
				flexDirection: 'row',
			}}
		>
			<div
				style={{
					flex: 1,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					padding: 40,
				}}
			>
				<div
					style={{
						transform: `scale(${interpolate(imageProgress, [0, 1], [0.8, 1])})`,
						opacity: imageProgress,
						borderRadius: 12,
						overflow: 'hidden',
						boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px ${ACCENT}22`,
						border: `1px solid ${ACCENT}33`,
					}}
				>
					<Img src={staticFile(imageSrc)} style={{ width: '100%', display: 'block' }} />
				</div>
			</div>
			<div
				style={{
					width: 350,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					paddingRight: 60,
					opacity: captionOpacity,
				}}
			>
				<div style={{ fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>
					{caption}
				</div>
				<div style={{ fontSize: 16, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
					{description}
				</div>
			</div>
		</AbsoluteFill>
	)
}

const DualScreenshotShowcase: React.FC<{
	imageSrc1: string
	imageSrc2: string
	caption1: string
	caption2: string
	description: string
	activeIndex: number
}> = ({ imageSrc1, imageSrc2, caption1, caption2, description, activeIndex }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const progress = spring({
		frame,
		fps,
		config: { damping: 25, stiffness: 100 },
	})

	return (
		<AbsoluteFill
			style={{
				background: BACKGROUND,
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 40,
				gap: 30,
			}}
		>
			<div style={{
				fontSize: 18,
				color: TEXT_SECONDARY,
				textAlign: 'center',
				marginBottom: 10,
				opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: 'clamp' }),
			}}>
				{description}
			</div>
			<div style={{ display: 'flex', gap: 30, justifyContent: 'center' }}>
				<div style={{
					transform: `scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
					opacity: progress,
					borderRadius: 12,
					overflow: 'hidden',
					boxShadow: activeIndex === 0
						? `0 0 30px ${ACCENT}44, 0 25px 50px -12px rgba(0,0,0,0.5)`
						: '0 25px 50px -12px rgba(0,0,0,0.3)',
					border: `1px solid ${activeIndex === 0 ? ACCENT : `${ACCENT}33`}`,
					width: 540,
				}}>
					<Img src={staticFile(imageSrc1)} style={{ width: '100%', display: 'block' }} />
					<div style={{
						padding: '10px 16px',
						background: '#1e293b',
						fontSize: 14,
						color: activeIndex === 0 ? ACCENT : TEXT_SECONDARY,
						fontWeight: activeIndex === 0 ? 600 : 400,
						borderTop: `1px solid ${ACCENT}22`,
					}}>
						{caption1}
					</div>
				</div>
				<div style={{
					transform: `scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
					opacity: progress,
					borderRadius: 12,
					overflow: 'hidden',
					boxShadow: activeIndex === 1
						? `0 0 30px ${ACCENT}44, 0 25px 50px -12px rgba(0,0,0,0.5)`
						: '0 25px 50px -12px rgba(0,0,0,0.3)',
					border: `1px solid ${activeIndex === 1 ? ACCENT : `${ACCENT}33`}`,
					width: 540,
				}}>
					<Img src={staticFile(imageSrc2)} style={{ width: '100%', display: 'block' }} />
					<div style={{
						padding: '10px 16px',
						background: '#1e293b',
						fontSize: 14,
						color: activeIndex === 1 ? ACCENT : TEXT_SECONDARY,
						fontWeight: activeIndex === 1 ? 600 : 400,
						borderTop: `1px solid ${ACCENT}22`,
					}}>
						{caption2}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	)
}

const FullScreenshot: React.FC<{
	imageSrc: string
	delay?: number
}> = ({ imageSrc, delay = 0 }) => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const progress = spring({
		frame: frame - delay,
		fps,
		config: { damping: 25 },
	})

	return (
		<AbsoluteFill
			style={{
				background: BACKGROUND,
				justifyContent: 'center',
				alignItems: 'center',
				padding: 40,
			}}
		>
			<div
				style={{
					transform: `scale(${interpolate(progress, [0, 1], [0.92, 1])})`,
					opacity: progress,
					borderRadius: 12,
					overflow: 'hidden',
					boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px ${ACCENT}22`,
					border: `1px solid ${ACCENT}33`,
				}}
			>
				<Img src={staticFile(imageSrc)} style={{ width: 1200, display: 'block' }} />
			</div>
		</AbsoluteFill>
	)
}

const EndScreen: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const scale = spring({
		frame,
		fps,
		config: { damping: 15, stiffness: 80 },
	})

	const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	return (
		<AbsoluteFill
			style={{
				background: BACKGROUND,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
				<div style={{ fontSize: 48, fontWeight: 800, color: TEXT_PRIMARY }}>
					Knowledge Graph Explorer
				</div>
				<div
					style={{
						fontSize: 20,
						color: ACCENT,
						marginTop: 16,
						opacity: subtitleOpacity,
					}}
				>
					geo-local
				</div>
			</div>
		</AbsoluteFill>
	)
}

export const FeatureShowcase: React.FC = () => {
	return (
		<AbsoluteFill style={{ background: BACKGROUND }}>
			{/* Title screen: frames 0-89 (3s) */}
			<Sequence from={0} durationInFrames={90}>
				<TitleScreen />
			</Sequence>

			{/* Entities section title: frames 90-134 (1.5s) */}
			<Sequence from={90} durationInFrames={45}>
				<SectionTitle
					number="01"
					title="Entities"
					subtitle="Browse, filter, sort and select your graph entities"
				/>
			</Sequence>

			{/* Entities default view: frames 135-179 (1.5s) */}
			<Sequence from={135} durationInFrames={45}>
				<ScreenshotShowcase
					imageSrc="screenshots/01-entities-default.png"
					caption="Entity Browser"
					description="View all entities in a paginated table with their IDs, properties, and timestamps. Navigate through pages to explore the full graph."
				/>
			</Sequence>

			{/* Entities filter: frames 180-224 (1.5s) */}
			<Sequence from={180} durationInFrames={45}>
				<ScreenshotShowcase
					imageSrc="screenshots/02-entities-filter-type.png"
					caption="Filter by Type"
					description="Quickly narrow down entities using the type filter dropdown. Select from available entity types to focus on what matters."
				/>
			</Sequence>

			{/* Entities sort + multi-select: frames 225-269 (1.5s) */}
			<Sequence from={225} durationInFrames={45}>
				<DualScreenshotShowcase
					imageSrc1="screenshots/03-entities-sort-properties.png"
					imageSrc2="screenshots/04-entities-multi-select.png"
					caption1="Sortable Columns"
					caption2="Multi-Selection"
					description="Click column headers to sort entities. Select multiple rows using checkboxes for batch operations."
					activeIndex={0}
				/>
			</Sequence>

			{/* Search section title: frames 270-314 (1.5s) */}
			<Sequence from={270} durationInFrames={45}>
				<SectionTitle
					number="02"
					title="Search"
					subtitle="Find entities by name or ID instantly"
				/>
			</Sequence>

			{/* Search by name + ID: frames 315-359 (1.5s) */}
			<Sequence from={315} durationInFrames={45}>
				<DualScreenshotShowcase
					imageSrc1="screenshots/06-search-by-name.png"
					imageSrc2="screenshots/07-search-by-id.png"
					caption1="Search by Name"
					caption2="Search by ID"
					description="Search entities by their name properties or by their unique hex identifier. Results show matching triples with entity and property context."
					activeIndex={0}
				/>
			</Sequence>

			{/* Create & Edit section title: frames 360-404 (1.5s) */}
			<Sequence from={360} durationInFrames={45}>
				<SectionTitle
					number="03"
					title="Create & Edit"
					subtitle="Add new entities and modify existing ones"
				/>
			</Sequence>

			{/* Create entity form: frames 405-449 (1.5s) */}
			<Sequence from={405} durationInFrames={45}>
				<ScreenshotShowcase
					imageSrc="screenshots/12-create-entity-filled.png"
					caption="Create Entity"
					description="Fill in the name, description, types and custom properties. The form dynamically adds property fields as needed."
				/>
			</Sequence>

			{/* Entity detail + Edit entity: frames 450-494 (1.5s) */}
			<Sequence from={450} durationInFrames={45}>
				<DualScreenshotShowcase
					imageSrc1="screenshots/14-entity-detail.png"
					imageSrc2="screenshots/13-edit-entity.png"
					caption1="Entity Detail"
					caption2="Edit Entity"
					description="View an entity's full details including properties and relations, then click Edit to modify its name, description, types and values."
					activeIndex={0}
				/>
			</Sequence>

			{/* Graph section title: frames 495-539 (1.5s) */}
			<Sequence from={495} durationInFrames={45}>
				<SectionTitle
					number="04"
					title="Graph"
					subtitle="Visualize and explore entity relationships interactively"
				/>
			</Sequence>

			{/* Graph default: frames 540-569 (1s) */}
			<Sequence from={540} durationInFrames={30}>
				<FullScreenshot imageSrc="screenshots/08-graph-default.png" delay={5} />
			</Sequence>

			{/* Graph expanded with relations: frames 570-584 (0.5s) */}
			<Sequence from={570} durationInFrames={15}>
				<FullScreenshot imageSrc="screenshots/10-graph-relations.png" delay={3} />
			</Sequence>

			{/* End screen: frames 585-644 (2s) */}
			<Sequence from={585} durationInFrames={60}>
				<EndScreen />
			</Sequence>
		</AbsoluteFill>
	)
}
