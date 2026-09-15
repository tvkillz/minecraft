'use client'

import { Button } from '@/components/ui/Button/Button'
import type { TutorialStep } from '@/lib/game/tutorial/steps'
import './TutorialOverlay.css'

type TutorialOverlayProps = {
  step: TutorialStep
  stepNumber: number
  stepTotal: number
  onContinue: () => void
  onSkip: () => void
}

export default function TutorialOverlay({
  step,
  stepNumber,
  stepTotal,
  onContinue,
  onSkip,
}: TutorialOverlayProps) {
  const isManual = step.advance === 'manual'

  return (
    <div className="tutorial-overlay" role="region" aria-live="polite" aria-label="Tutorial guidance">
      <div className="tutorial-overlay__panel">
        <p className="tutorial-overlay__progress">
          Step {stepNumber} of {stepTotal}
        </p>
        <h2 className="tutorial-overlay__title">{step.title}</h2>
        <p className="tutorial-overlay__body">{step.body}</p>
        <div className="tutorial-overlay__actions">
          {isManual ? (
            <Button type="button" variant="primary" size="sm" fantasy onClick={onContinue}>
              {step.actionLabel ?? 'Continue'}
            </Button>
          ) : (
            <p className="tutorial-overlay__hint">Complete the action above to continue.</p>
          )}
          <button type="button" className="tutorial-overlay__skip" onClick={onSkip}>
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  )
}
