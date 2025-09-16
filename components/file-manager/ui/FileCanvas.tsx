import React, { useRef, useEffect, useState } from 'react';

interface Fn {
  (): void;
}

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const r180 = Math.PI;
const r90 = Math.PI / 2;
const r15 = Math.PI / 12;
const color = '#88888825';

export const FileCanvas: React.FC = () => {
  const el = useRef<HTMLCanvasElement>(null);
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [stopped, setStopped] = useState(false);

  const MIN_BRANCH = 30;
  const len = { value: 6 }; // Using object to mimic ref behavior

  const initCanvas = (
    canvas: HTMLCanvasElement,
    width = 400,
    height = 400,
    _dpi?: number
  ) => {
    const ctx = canvas.getContext('2d') as any;
    
    const dpr = window.devicePixelRatio || 1;
    const bsr = ctx.webkitBackingStorePixelRatio || 
      ctx.mozBackingStorePixelRatio || 
      ctx.msBackingStorePixelRatio || 
      ctx.oBackingStorePixelRatio || 
      ctx.backingStorePixelRatio || 1;

    const dpi = _dpi || dpr / bsr;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = dpi * width;
    canvas.height = dpi * height;
    ctx.scale(dpi, dpi);

    return { ctx, dpi };
  };

  const polar2cart = (x = 0, y = 0, r = 0, theta = 0) => {
    const dx = r * Math.cos(theta);
    const dy = r * Math.sin(theta);
    return [x + dx, y + dy];
  };

  useEffect(() => {
    if (!el.current) return;

    const canvas = el.current;
    const { ctx } = initCanvas(canvas, windowWidth, windowHeight);
    const { width, height } = canvas;

    let steps: Fn[] = [];
    let prevSteps: Fn[] = [];

    const step = (
      x: number,
      y: number,
      rad: number,
      counter: { value: number } = { value: 0 }
    ) => {
      const length = Math.random() * len.value;
      counter.value += 1;

      const [nx, ny] = polar2cart(x, y, length, rad);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      const rad1 = rad + Math.random() * r15;
      const rad2 = rad - Math.random() * r15;

      // out of bounds
      if (nx < -100 || nx > windowWidth + 100 || ny < -100 || ny > windowHeight + 100)
        return;

      const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5;

      // left branch
      if (Math.random() < rate)
        steps.push(() => step(nx, ny, rad1, counter));

      // right branch
      if (Math.random() < rate)
        steps.push(() => step(nx, ny, rad2, counter));
    };

    let lastTime = performance.now();

    let animationFrameId: number;
    let isRunning = true;

    const frame = () => {      
      if (!isRunning) return;

      prevSteps = steps;
      steps = [];
      lastTime = performance.now();      

      if (!prevSteps.length) {
        setStopped(true);
        isRunning = false;
        return;
      }      

      // Execute all the steps from the previous frame
      prevSteps.forEach((i) => {
        // 50% chance to keep the step for the next frame, to create a more organic look
        if (Math.random() < 0.5)
          steps.push(i);
        else
          i();
      });

      animationFrameId = requestAnimationFrame(frame);
    };

    /**
     * 0.2 - 0.8
     */
    const randomMiddle = () => Math.random() * 0.6 + 0.2;

    const start = () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = color;
      prevSteps = [];
      steps = [
        () => step(randomMiddle() * windowWidth, -5, r90),
        () => step(randomMiddle() * windowWidth, windowHeight + 5, -r90),
        () => step(-5, randomMiddle() * windowHeight, 0),
        () => step(windowWidth + 5, randomMiddle() * windowHeight, r180),
      ];
      
      if (windowWidth < 500)
        steps = steps.slice(0, 2);
        
      isRunning = true;
      setStopped(false);
      
      animationFrameId = requestAnimationFrame(frame);
    };

    start();

    return () => {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [windowWidth, windowHeight]);

  const mask = 'radial-gradient(circle, transparent, black)';

  return (
    <div
      className="fixed top-0 bottom-0 left-0 right-0 pointer-events-none print:hidden"
      style={{
        zIndex: -1,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <canvas ref={el} width="400" height="400" style={{background: '#f9fafb'}} />
    </div>
  );
};

export default FileCanvas;