import React from 'react'
import { Composition } from 'remotion'
import { FeatureShowcase } from './FeatureShowcase'

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="FeatureShowcase"
				component={FeatureShowcase}
				durationInFrames={645}
				fps={30}
				width={1280}
				height={720}
			/>
		</>
	)
}
