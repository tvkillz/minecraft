import type { Ref } from 'react';
import './Avatar.css';

interface AvatarProps {
  name: string;
  health: number;
  currentMana: number;
  maxMana: number;
  colorPalette?: 'hero' | 'opponent';
  manaRef?: Ref<HTMLDivElement>;
  containerRef?: Ref<HTMLDivElement>;
}

export const Avatar = ({
  name,
  health,
  currentMana,
  maxMana,
  colorPalette = 'hero',
  manaRef,
  containerRef,
}: AvatarProps) => {
  const manaScale =
    maxMana > 6
      ? Math.max(0.62, (6 * 22 + 5 * 6) / (maxMana * 22 + (maxMana - 1) * 6))
      : 1;

  return (
    <div
      className={`iyashikei-avatar iyashikei-avatar--${colorPalette}`}
      ref={containerRef}
    >
      <div className="iyashikei-avatar__mana" ref={manaRef}>
        <div
          className="iyashikei-avatar__mana-stack"
          style={{ '--mana-scale': manaScale } as Record<string, string | number>}
        >
          {Array.from({ length: maxMana }).map((_, index) => {
            const isActive = index < currentMana;
            return (
              <span
                key={index}
                className={`iyashikei-avatar__mana-bead${isActive ? ' iyashikei-avatar__mana-bead--active' : ''}`}
              />
            );
          })}
        </div>
        <span className="iyashikei-avatar__mana-count">
          {currentMana}/{maxMana}
        </span>
      </div>

      <div className="iyashikei-avatar__portrait">
        <div className="iyashikei-avatar__portrait-inner" aria-hidden="true" />
        <span className="iyashikei-avatar__health">{health}</span>
      </div>

      <div className="iyashikei-avatar__name">{name}</div>
    </div>
  );
};
