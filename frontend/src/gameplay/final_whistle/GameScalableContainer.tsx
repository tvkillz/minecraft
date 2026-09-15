'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import './GameScalableContainer.css';

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;

type GameScalableContainerProps = {
  children: ReactNode;
};

export default function GameScalableContainer({ children }: GameScalableContainerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobileLike, setIsMobileLike] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const vv = window.visualViewport;
      const width = vv?.width ?? viewport.clientWidth;
      const height = vv?.height ?? viewport.clientHeight;

      const nextScale = Math.min(width / VIRTUAL_WIDTH, height / VIRTUAL_HEIGHT);
      setScale(nextScale > 0 ? nextScale : 1);

      const portrait = height > width;
      setIsPortrait(portrait);
      setIsMobileLike(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    window.visualViewport?.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
      window.visualViewport?.removeEventListener('resize', updateScale);
    };
  }, []);

  return (
    <div className="game-scalable-viewport" ref={viewportRef}>
      <div
        className="game-scalable-surface"
        style={{
          width: `${VIRTUAL_WIDTH}px`,
          height: `${VIRTUAL_HEIGHT}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
      {isMobileLike && isPortrait && (
        <div className="game-scalable-orientation-overlay" role="status" aria-live="polite">
          <div className="game-scalable-orientation-card">
            <h2>Landscape Recommended</h2>
            <p>Rotate your device to landscape for the best play experience.</p>
          </div>
        </div>
      )}
    </div>
  );
}
