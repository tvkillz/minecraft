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
      ? Math.max(0.58, (6 * 24 + 5 * 4) / (maxMana * 24 + (maxMana - 1) * 4))
      : 1;

  /* Kit number: hero = 10 (classic playmaker), opponent = 1 (goalkeeper) */
  const kitNumber = colorPalette === 'hero' ? '10' : '1';

  return (
    <div
      className={`fw-avatar fw-avatar--${colorPalette}`}
      ref={containerRef}
    >
      {/* Corner-flag mana tally */}
      <div className="fw-avatar__mana" ref={manaRef}>
        <div
          className="fw-avatar__mana-tally"
          style={{ '--mana-scale': manaScale } as Record<string, string | number>}
        >
          {Array.from({ length: maxMana }).map((_, i) => (
            <span
              key={i}
              className={`fw-avatar__mana-pip${i < currentMana ? ' fw-avatar__mana-pip--active' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="fw-avatar__mana-readout">{currentMana}/{maxMana}</span>
      </div>

      {/* Shirt portrait */}
      <div className="fw-avatar__shirt">
        <div className="fw-avatar__shirt-ring" aria-hidden="true" />
        <div className="fw-avatar__shirt-inner" aria-hidden="true">
          <span className="fw-avatar__shirt-number">{kitNumber}</span>
        </div>
        <div className="fw-avatar__hp" title="Health">
          <span className="fw-avatar__hp-val">{health}</span>
        </div>
      </div>

      {/* Scoreboard nameplate */}
      <div className="fw-avatar__nameplate">
        <span className="fw-avatar__nameplate-strip" aria-hidden="true" />
        <span className="fw-avatar__nameplate-name">{name}</span>
      </div>
    </div>
  );
};
