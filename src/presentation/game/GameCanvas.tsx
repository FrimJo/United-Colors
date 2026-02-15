import type { ComponentType } from 'react';
import { View } from 'react-native';
import type { RenderFrame } from '@/domain/types/GameTypes';

interface Props {
  frame: RenderFrame;
  width: number;
  height: number;
}

const background = '#78b7e2';
let hasWarnedMissingSkia = false;

type SkiaModule = typeof import('@shopify/react-native-skia');

let cachedSkiaModule: SkiaModule | null | undefined;

const loadSkiaModule = (): SkiaModule | null => {
  if (cachedSkiaModule !== undefined) {
    return cachedSkiaModule;
  }

  try {
    cachedSkiaModule = require('@shopify/react-native-skia') as SkiaModule;
  } catch (error) {
    cachedSkiaModule = null;
    if (!hasWarnedMissingSkia) {
      hasWarnedMissingSkia = true;
      console.warn('[GameCanvas] Skia is unavailable. Rendering fallback background.', error);
    }
  }

  return cachedSkiaModule;
};

export function GameCanvas({ frame, width, height }: Props) {
  const skia = loadSkiaModule();
  if (!skia) {
    return <View style={{ width, height, backgroundColor: background }} />;
  }

  return <SkiaGameCanvas frame={frame} width={width} height={height} skia={skia} />;
}

interface SkiaProps extends Props {
  skia: SkiaModule;
}

function SkiaGameCanvas({ frame, width, height, skia }: SkiaProps) {
  const {
    Canvas,
    Circle,
    Fill,
    Group,
    Image: SkiaImage,
    useImage,
  } = skia as SkiaModule & {
    Canvas: ComponentType<{ style: { width: number; height: number; backgroundColor: string } }>;
    Circle: ComponentType<{ cx: number; cy: number; r: number; color: string }>;
    Fill: ComponentType<{ color: string }>;
    Group: ComponentType<{ key?: string; children?: React.ReactNode }>;
    Image: ComponentType<{
      image: unknown;
      x: number;
      y: number;
      width: number;
      height: number;
      fit: 'fill';
      opacity: number;
    }>;
    useImage: (source: number) => unknown;
  };

  const dotTexture = useImage(require('../../assets/images/dot.png'));
  const glareTexture = useImage(require('../../assets/images/dot_glare_top_left.png'));

  return (
    <Canvas style={{ width, height, backgroundColor: background }}>
      <Fill color={background} />
      {frame.dots.map((dot) => (
        <Group key={dot.id}>
          <Circle cx={dot.x} cy={dot.y} r={dot.radius} color={dot.color} />
          {dotTexture ? (
            <SkiaImage
              image={dotTexture}
              x={dot.x - dot.radius}
              y={dot.y - dot.radius}
              width={dot.radius * 2}
              height={dot.radius * 2}
              fit="fill"
              opacity={0.5}
            />
          ) : null}
          {glareTexture ? (
            <SkiaImage
              image={glareTexture}
              x={dot.x - dot.radius}
              y={dot.y - dot.radius}
              width={dot.radius * 2}
              height={dot.radius * 2}
              fit="fill"
              opacity={0.35}
            />
          ) : null}
        </Group>
      ))}
    </Canvas>
  );
}
