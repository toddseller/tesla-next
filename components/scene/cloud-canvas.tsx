import {type Ref, useEffect, useImperativeHandle, useRef, useState} from 'react';

import type {cloudInputs} from '@/components/scene/cloud-inputs';
import {type CloudRenderer, createCloudRenderer} from '@/components/scene/cloud-renderer';

// Half the screen's resolution: the clouds are soft, and the canvas scales up smoothly.
const SCALE = 0.5;

// The clouds, drawn by WebGL2 over the sky (openspec/specs/scene-weather). The day's
// shapes are baked once per day and canvas size; the scene's frame loop calls
// `draw(offsets)` with each layer's drift, and each draw uses the latest inputs. Without
// WebGL2 it draws nothing.
export type CloudHandle = { draw: (offsets: number[]) => void };

const CloudCanvas = ({ inputs, seed, ref }: { inputs: ReturnType<typeof cloudInputs>; seed: number; ref?: Ref<CloudHandle> }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<CloudRenderer | null>(null);
  const latest = useRef(inputs);
  latest.current = inputs;
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    const element = canvas.current!;
    renderer.current = createCloudRenderer(element);
    const measure = () => {
      const ratio = window.devicePixelRatio || 1;
      element.width = Math.max(1, Math.round(element.clientWidth * ratio * SCALE));
      element.height = Math.max(1, Math.round(element.clientHeight * ratio * SCALE));
      // The baked shapes draw smoothly at any size; only a new shape changes how
      // they map to the sky, and a bake takes a tenth of a second.
      const next = element.width / element.height;
      setAspect((old) => (old && Math.abs(next / old - 1) <= 0.02 ? old : next));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, []);

  const sky = inputs.light.sky;
  useEffect(() => {
    if (aspect) renderer.current?.bake(seed, sky);
  }, [seed, aspect, sky]);

  useImperativeHandle(ref, () => ({ draw: (offsets: number[]) => renderer.current?.draw(latest.current, offsets) }), []);

  return <canvas className="scene-clouds" data-part="clouds" aria-hidden="true" ref={canvas} />;
};

export default CloudCanvas;
