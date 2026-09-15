import type { Ref } from 'react';
import './Avatar.css';

interface AvatarProps {
  name: string;
  health: number;
  currentMana: number;
  maxMana: number;
  colorPalette?: 'default' | 'darkRed';
  manaRef?: Ref<HTMLDivElement>;
  containerRef?: Ref<HTMLDivElement>;
}

export const Avatar = ({
  name,
  health,
  currentMana,
  maxMana,
  colorPalette = 'default',
  manaRef,
  containerRef,
}: AvatarProps) => {
  const manaScale =
    maxMana > 6
      ? Math.max(0.62, (6 * 26 + 5 * 4) / (maxMana * 26 + (maxMana - 1) * 4))
      : 1;

  return (
    <div className={`avatar-container palette-${colorPalette}`} ref={containerRef}>
      
      {/* Стек маны слева (Выровнен вертикально, как на скрине) */}
      <div className="mana-wrapper" ref={manaRef}>
        <div
          className="mana-slots-list"
          style={{ '--mana-scale': manaScale } as Record<string, string | number>}
        >
          {Array.from({ length: maxMana }).map((_, index) => {
            const isActive = index < currentMana;
            return (
              <div key={index} className={`mana-slot-outer ${isActive ? 'active-slot' : ''}`}>
                <div className={`mana-slot-inner ${isActive ? 'active' : ''}`} />
              </div>
            );
          })}
        </div>
        <div className="mana-counter">{currentMana}/{maxMana}</div>
      </div>

      {/* Окно аватара с круглой градиентной рамкой */}
      <div className="avatar-circle">
        {/* Декоративные ромбики */}
        <div className="frame-diamond diamond-top" />
        <div className="frame-diamond diamond-bottom" />
        <div className="frame-diamond diamond-left" />
        <div className="frame-diamond diamond-right" />

        {/* Заглушка под арт персонажа */}
        <div className="avatar-art-placeholder" />
        
        {/* Иконка ХП (Капля) — идеально сидит внизу справа */}
        <div className="hp-drop">
          <span className="hp-text">{health}</span>
        </div>
      </div>

      {/* Плашка с никнеймом */}
      <div className="nickname-badge">
        <span className="nickname-text">{name}</span>
      </div>

    </div>
  );
};