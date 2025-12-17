import type { ImageProps } from 'tamagui'
import { Image } from 'tamagui'

const LdsImage = require('ui/src/assets/logos/jpeg/lds.jpeg') as string

interface LdsLogoProps extends Omit<ImageProps, 'source'> {
  size?: number | string
}

export function LdsLogo({ size = 16, width, height, ...props }: LdsLogoProps): JSX.Element {
  return <Image source={{ uri: LdsImage }} width={width ?? size} height={height ?? size} {...props} />
}
