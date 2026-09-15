'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { appConfig, gameAnimationsConfig } from '@/config';
import { useCardCatalog } from '@/hooks/useCardCatalog';
import { useMatch } from '@/hooks/useMatch';
import { preloadImage } from '@/lib/cards';
import { canAffordCard, deckCount, displayHealth, firstEmptySlot } from '@/lib/game/match';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button/Button';
import { Avatar } from './Avatar';
import './Game.css';
import './cards-game.css';
import GameScalableContainer from './GameScalableContainer';
import Card from '@/components/CardPlaceholder/Card';
import type { CardDisplayProps } from '@/components/CardPlaceholder/Card';
import CardHoverPreview from './CardHoverPreview';
import MatchResultOverlay from './MatchResultOverlay';
import TutorialOverlay from './TutorialOverlay';
import TutorialHighlight from './TutorialHighlight';
import { TurnBanner } from './TurnBanner';
import { ArenaAmbience } from './ArenaAmbience';
import { useGameMatchFx } from './useGameMatchFx';
import GameplayHints from '../shared/GameplayHints';
import { useTurnBanners } from '../shared/useTurnBanners';
import { useGameplayHints } from '../shared/useGameplayHints';
import { useTutorial } from '@/hooks/useTutorial';
import type { GameProps } from '../types';
import { getGameplayVariant } from '../resolve';
import './TutorialOverlay.css';
import './TutorialHighlight.css';
import '@/components/CardPlaceholder/styles.css';

type Props = GameProps;

export const Game: React.FC<Props> = ({
  deckEntries,
  deckId,
  mode = 'casual',
  resumeMatchId,
  onNewGame,
  onMenu,
}) => {
  const { playerName } = useAuth();
  const { cards: catalog, loading: catalogLoading } = useCardCatalog();
  const {
    state: match,
    booting,
    bootError,
    actionError,
    processing,
    matchId,
    opponentName,
    combatResult,
    combatBoardSnapshot,
    endTurnVisual,
    playHeroCard,
    endHeroTurn,
    startBattle,
    acknowledgeCombat,
    completeEndTurnVisual,
    clearEndTurnVisual,
    matchEnded,
  } = useMatch({ deckEntries, catalog, catalogLoading, deckId, mode, resumeMatchId });

  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [hoveredCard, setHoveredCard] = useState<CardDisplayProps | null>(null);

  const isTutorial = mode === 'tutorial';

  const {
    step: tutorialStep,
    stepNumber: tutorialStepNumber,
    stepTotal: tutorialStepTotal,
    continueTutorial,
    dismissTutorial,
    isActive: tutorialActive,
  } = useTutorial({
    enabled: isTutorial,
    match,
    processing,
    endTurnVisual,
    combatResult,
    matchEnded,
  });

  const tutorialTarget = tutorialActive ? (tutorialStep?.target ?? null) : null;
  const tutorialShowSpotlight =
    tutorialStep?.id === 'mana' ||
    tutorialStep?.id === 'hand' ||
    tutorialStep?.id === 'play_card';

  const { enemyTurnPhase, yourTurnPhase } = useTurnBanners(
    match,
    endTurnVisual,
    combatResult,
    processing,
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const fxLayerRef = useRef<HTMLDivElement | null>(null);
  const heroAvatarContainerRef = useRef<HTMLDivElement | null>(null);
  const heroAvatarRef = useRef<HTMLDivElement | null>(null);
  const villainAvatarRef = useRef<HTMLDivElement | null>(null);
  const heroHandRef = useRef<HTMLDivElement | null>(null);
  const heroBoardLaneRef = useRef<HTMLDivElement | null>(null);
  const battleBtnRef = useRef<HTMLButtonElement | null>(null);
  const endTurnBtnRef = useRef<HTMLButtonElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const heroManaRef = useRef<HTMLDivElement | null>(null);
  const villainManaRef = useRef<HTMLDivElement | null>(null);
  const heroDeckRef = useRef<HTMLDivElement | null>(null);
  const enemyHandRef = useRef<HTMLDivElement | null>(null);
  const handCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const heroBoardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const villainBoardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fxRefs = useMemo(
    () => ({
      stageRef,
      fxLayerRef,
      heroAvatarRef,
      villainAvatarRef,
      heroManaRef,
      villainManaRef,
      heroDeckRef,
      enemyHandRef,
      heroBoardRefs,
      villainBoardRefs,
      handCardRefs,
    }),
    [],
  );

  const { displayMatch, dealingHandIds, flyHeroCardToBoard, runFreezeAttempt } = useGameMatchFx({
    match,
    endTurnVisual,
    combatResult,
    combatBoardSnapshot,
    processing,
    completeEndTurnVisual,
    clearEndTurnVisual,
    acknowledgeCombat,
    refs: fxRefs,
  });

  const boardMatch = displayMatch ?? match;

  const heroHand = useMemo(() => {
    if (!match) return [];
    return match.hero.hand.flatMap((card, index) => {
      if (!card.display) return [];
      return [
        {
          ...card.display,
          instanceId: card.instanceId,
          fanIndex: index,
          id: card.instanceId,
        },
      ];
    });
  }, [match]);

  const showBattleButton =
    match?.phase === 'hero_main' && !processing && !match.winner && !match.heroCombatDone;

  const hasPlayableCard = Boolean(
    match &&
      match.phase === 'hero_main' &&
      !processing &&
      !match.winner &&
      firstEmptySlot(match.hero.board) !== null &&
      match.hero.hand.some((c) => c.display && canAffordCard(match.hero, c)),
  );

  const hintsEnabled = !isTutorial && !booting && !matchEnded && Boolean(match) && !match?.winner;

  const { activeHint, markSeen } = useGameplayHints({
    enabled: hintsEnabled,
    canPlayCard: hasPlayableCard,
    showBattle: Boolean(showBattleButton),
    canEndTurn: match?.phase === 'hero_main' && !processing && !Boolean(match?.winner),
  });

  const gameplayHintLayoutKey = [
    activeHint,
    match?.hero.hand.length,
    showBattleButton,
    match?.phase,
  ].join('|');

  const handleHeroPlayCard = async (instanceId: string) => {
    if (!match || match.phase !== 'hero_main' || processing) return;
    const card = match.hero.hand.find((c) => c.instanceId === instanceId);
    if (!card?.display || !canAffordCard(match.hero, card)) return;

    const slot = firstEmptySlot(match.hero.board);
    if (slot === null) return;

    markSeen('play_card');

    // Состояние доски обновляется во время полёта — flyHeroCardToBoard ждёт DOM перед removeClone
    const playPromise = playHeroCard(instanceId);
    await flyHeroCardToBoard(instanceId, slot);
    const freeze = await playPromise;
    if (freeze) {
      await runFreezeAttempt(freeze);
    }
  };

  const handleEndTurn = () => {
    if (!match || match.phase !== 'hero_main' || processing) return;
    markSeen('end_turn');
    void endHeroTurn();
  };

  const handleBattle = () => {
    if (!match || match.phase !== 'hero_main' || processing || match.heroCombatDone) return;
    markSeen('battle');
    void startBattle();
  };

  const tutorialHighlightLayoutKey = [
    tutorialTarget,
    match?.hero.board.map((u) => u?.instanceId ?? '').join(','),
    match?.hero.hand.length,
    showBattleButton,
  ].join('|');

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* blocked */
    }
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isInput =
        event.target instanceof HTMLElement &&
        (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          event.target.isContentEditable);
      if (isInput) return;

      if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        handleEndTurn();
      }
      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        handleBattle();
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  if (booting) {
    return (
      <GameScalableContainer>
        <div className="game-stage game-stage--booting" data-gameplay-variant={getGameplayVariant()}>
          <p>Loading…</p>
        </div>
      </GameScalableContainer>
    );
  }

  if (!booting && !bootError && !matchId) {
    return (
      <GameScalableContainer>
        <div
          className="game-stage game-stage--booting game-stage--error"
          data-gameplay-variant={getGameplayVariant()}
        >
          <p>Could not start a server match. Sign in, pick a deck, and try again.</p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => window.location.assign(appConfig.domain.routes.play)}
          >
            Back to lobby
          </Button>
        </div>
      </GameScalableContainer>
    );
  }

  if (bootError || !match || !boardMatch) {
    return (
      <GameScalableContainer>
        <div
          className="game-stage game-stage--booting game-stage--error"
          data-gameplay-variant={getGameplayVariant()}
        >
          <p>{bootError ?? 'Match unavailable.'}</p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => window.location.assign(appConfig.domain.routes.play)}
          >
            Back to lobby
          </Button>
        </div>
      </GameScalableContainer>
    );
  }

  const phaseLabel =
    match.phase === 'hero_main'
      ? 'Your turn'
      : match.phase === 'villain_main'
        ? 'Their turn'
        : match.phase === 'combat'
          ? 'Settling…'
          : '';

  const phaseDetail =
    match.phase === 'hero_main' ? 'Main phase' : 'Resolution';

  return (
    <GameScalableContainer>
      <div className="game-stage" data-gameplay-variant={getGameplayVariant()} ref={stageRef}>
        <ArenaAmbience />
        <div className="game-vfx-layer" ref={fxLayerRef} aria-hidden="true" />

        <div className="game-zone-villain" ref={villainAvatarRef}>
          <Avatar
            name={opponentName}
            health={boardMatch.villain.hp}
            currentMana={boardMatch.villain.mana}
            maxMana={boardMatch.villain.maxMana}
            colorPalette="opponent"
            manaRef={villainManaRef}
          />
        </div>
        <div className="game-zone-hero" ref={heroAvatarRef}>
          <Avatar
            name={playerName}
            health={boardMatch.hero.hp}
            currentMana={boardMatch.hero.mana}
            maxMana={boardMatch.hero.maxMana}
            containerRef={heroAvatarContainerRef}
            manaRef={heroManaRef}
          />
        </div>

        <div className="game-zone-enemy-hand" ref={enemyHandRef} aria-label="Enemy hand">
          {boardMatch.villain.hand.map((_, index) => (
            <div
              key={`enemy-back-${index}`}
              className="game-enemy-card-back"
              style={{ transform: `translateX(${index * -10}px)` }}
            />
          ))}
        </div>

        <div className="game-zone-enemy-deck" aria-label="Enemy deck">
          <div className="game-deck-card" />
          <div className="game-deck-count">{deckCount(boardMatch.villain)}</div>
          <div className="game-deck-label">Deck</div>
        </div>

        {actionError && (
          <div className="game-action-error" role="alert">
            {actionError}
          </div>
        )}

        <div className="game-zone-controls" ref={controlsRef} aria-label="Turn controls">
          <div
            className={`game-turn-box${
              match.phase === 'hero_main'
                ? ' game-turn-box--yours'
                : match.phase === 'villain_main'
                  ? ' game-turn-box--theirs'
                  : ' game-turn-box--settling'
            }`}
            role="status"
          >
            <span className="game-turn-box__round">Turn {match.turn}</span>
            <span className="game-turn-box__phase">{phaseDetail}</span>
            <strong className="game-turn-box__status">{phaseLabel}</strong>
          </div>
          {showBattleButton && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="game-zone-controls__btn"
              ref={battleBtnRef}
              onClick={handleBattle}
            >
              Resolve [B]
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            className="game-zone-controls__btn"
            ref={endTurnBtnRef}
            disabled={match.phase !== 'hero_main' || processing || Boolean(match.winner)}
            onClick={handleEndTurn}
          >
            End turn [E]
          </Button>
        </div>

        <div className="game-zone-board" aria-label="Card board area">
          <div className="game-board-lane game-board-lane--opponent">
            {boardMatch.villain.board.map((unit, slot) => (
              <div
                key={`v-board-${slot}`}
                className={`game-board-slot${unit ? '' : ' game-board-slot--vacant'}`}
                ref={(el) => {
                  villainBoardRefs.current[slot] = el;
                }}
              >
                {unit?.display ? (
                  <div
                    className="game-board-card-wrap"
                    onMouseEnter={() => {
                      void preloadImage(unit.display!.artUrl);
                      setHoveredCard(unit.display!);
                    }}
                    onMouseLeave={() =>
                      setHoveredCard((p) => (p?.id === unit.display!.id ? null : p))
                    }
                  >
                    <Card
                      {...unit.display}
                      stats={{
                        ...unit.display.stats,
                        attack: unit.attack,
                        health: displayHealth(unit.health),
                      }}
                      totalCards={1}
                      fanIndex={0}
                      layoutMode="compact"
                      frozen={Boolean(unit.frozen)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="game-board-lane game-board-lane--hero" ref={heroBoardLaneRef}>
            {boardMatch.hero.board.map((unit, slot) => (
              <div
                key={`h-board-${slot}`}
                className={`game-board-slot${unit ? '' : ' game-board-slot--vacant'}`}
                ref={(el) => {
                  heroBoardRefs.current[slot] = el;
                }}
              >
                {unit?.display ? (
                  <div
                    className="game-board-card-wrap"
                    onMouseEnter={() => {
                      void preloadImage(unit.display!.artUrl);
                      setHoveredCard(unit.display!);
                    }}
                    onMouseLeave={() =>
                      setHoveredCard((p) => (p?.id === unit.display!.id ? null : p))
                    }
                  >
                    <Card
                      {...unit.display}
                      stats={{
                        ...unit.display.stats,
                        attack: unit.attack,
                        health: displayHealth(unit.health),
                      }}
                      totalCards={1}
                      fanIndex={0}
                      layoutMode="compact"
                      frozen={Boolean(unit.frozen)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="game-zone-hero-hand" ref={heroHandRef} aria-label="Hero hand">
          <div className="game-hero-card-fan">
            {heroHand.map((card) => {
              const instance = match.hero.hand.find((c) => c.instanceId === card.id);
              const affordable = instance ? canAffordCard(match.hero, instance) : false;
              const canPlay =
                match.phase === 'hero_main' && !processing && affordable && !match.winner;
              return (
                <div
                  key={card.id}
                  className={`game-hero-card-wrap${canPlay ? '' : ' game-hero-card-wrap--disabled'}${dealingHandIds.has(card.id) ? ' game-hero-card-wrap--dealing' : ''}`}
                >
                  <Card
                    {...card}
                    ref={(el: HTMLElement | null) => {
                      if (el) handCardRefs.current.set(card.id, el);
                      else handCardRefs.current.delete(card.id);
                    }}
                    fanIndex={card.fanIndex}
                    totalCards={heroHand.length}
                    layoutMode="game"
                    onHoverChange={(hovered: boolean) => {
                      if (hovered) {
                        void preloadImage(card.artUrl);
                        setHoveredCard(card);
                      } else {
                        setHoveredCard((p) => (p?.id === card.id ? null : p));
                      }
                    }}
                    onDoubleClick={
                      canPlay
                        ? (e: React.MouseEvent<HTMLElement>) => {
                            e.preventDefault();
                            void handleHeroPlayCard(card.id);
                          }
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {hoveredCard && (
          <div className="game-zone-card-preview">
            <CardHoverPreview card={hoveredCard} />
          </div>
        )}

        <div className="game-zone-hero-deck" ref={heroDeckRef} aria-label="Hero deck">
          <div className="game-deck-card" />
          <div className="game-deck-count">{deckCount(boardMatch.hero)}</div>
          <div className="game-deck-label">Deck</div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="game-fullscreen-button"
          onClick={() => void toggleFullscreen()}
        >
          {isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
        </Button>

        {enemyTurnPhase !== 'hidden' && (
          <TurnBanner
            variant="enemy"
            phase={enemyTurnPhase === 'exit' ? 'exit' : 'enter'}
            config={gameAnimationsConfig.turnBanner.enemy}
          />
        )}
        {yourTurnPhase !== 'hidden' && (
          <TurnBanner
            variant="your"
            phase={yourTurnPhase === 'exit' ? 'exit' : 'enter'}
            config={gameAnimationsConfig.turnBanner.your}
          />
        )}

        {!isTutorial && activeHint ? (
          <GameplayHints
            stageRef={stageRef}
            hint={activeHint}
            layoutKey={gameplayHintLayoutKey}
            refs={{
              hand: heroHandRef,
              battle: battleBtnRef,
              endTurn: endTurnBtnRef,
            }}
          />
        ) : null}

        {tutorialActive && tutorialTarget ? (
          <TutorialHighlight
            stageRef={stageRef}
            target={tutorialTarget}
            layoutKey={tutorialHighlightLayoutKey}
            showSpotlight={tutorialShowSpotlight}
            refs={{
              avatar: heroAvatarContainerRef,
              hand: heroHandRef,
              heroBoard: heroBoardLaneRef,
              battle: battleBtnRef,
              endTurn: endTurnBtnRef,
              controls: controlsRef,
            }}
          />
        ) : null}

        {tutorialStep && tutorialActive ? (
          <TutorialOverlay
            step={tutorialStep}
            stepNumber={tutorialStepNumber}
            stepTotal={tutorialStepTotal}
            onContinue={continueTutorial}
            onSkip={dismissTutorial}
          />
        ) : null}

        {/* Попап после VFX; matchEnded не сбрасывается, пока игрок не нажмёт кнопку */}
        {matchEnded && match.winner && !combatResult && (
          <MatchResultOverlay
            won={match.winner === 'hero'}
            onNewGame={() => {
              if (onNewGame) onNewGame()
              else window.location.assign(appConfig.domain.routes.play)
            }}
            onMenu={() => {
              if (onMenu) onMenu()
              else window.location.assign(appConfig.domain.routes.play)
            }}
          />
        )}
      </div>
    </GameScalableContainer>
  );
};

export default Game;
