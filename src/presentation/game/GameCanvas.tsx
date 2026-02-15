import { Canvas, Circle, Group, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import type { RenderFrame } from '@/domain/types/GameTypes';

interface Props {
  frame: RenderFrame;
  width: number;
  height: number;
}

const background = '#78b7e2';

export function GameCanvas({ frame, width, height }: Props) {
  const dotTexture = useImage(require('../../assets/images/dot.png'));
  const glareTexture = useImage(require('../../assets/images/dot_glare_top_left.png'));

  return (
    <Canvas style={{ width, height, backgroundColor: background }}>
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
