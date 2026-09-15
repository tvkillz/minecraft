'use client'

import Link from 'next/link'
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from 'react'
import './Button.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'gold'
  | 'accent-cyan'
  | 'accent-ember'
  | 'trigger-orange'
  | 'trigger-green'
  | 'trigger-blue'

export type ButtonSize = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fantasy?: boolean
  className?: string
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string }

type ButtonAsNextLink = CommonProps &
  ComponentProps<typeof Link> & { as: 'link' }

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsNextLink

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  fantasy: boolean,
  className?: string,
): string {
  return [
    'vb-btn',
    `vb-btn--${variant}`,
    `vb-btn--${size}`,
    fantasy ? 'vb-btn--fantasy' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      fantasy = false,
      className,
      children,
      ...rest
    } = props

    const classes = buildClassName(variant, size, fantasy, className)

    if (props.as === 'link') {
      const linkRest = { ...props }
      delete (linkRest as { as?: string }).as
      delete (linkRest as ButtonAsNextLink).variant
      delete (linkRest as ButtonAsNextLink).size
      delete (linkRest as ButtonAsNextLink).fantasy
      delete (linkRest as ButtonAsNextLink).className
      return (
        <Link
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={classes}
          {...(linkRest as Omit<ButtonAsNextLink, keyof CommonProps | 'as'>)}
        >
          {children}
        </Link>
      )
    }

    if (props.as === 'a') {
      const anchorRest = { ...props }
      delete (anchorRest as { as?: string }).as
      delete (anchorRest as ButtonAsLink).variant
      delete (anchorRest as ButtonAsLink).size
      delete (anchorRest as ButtonAsLink).fantasy
      delete (anchorRest as ButtonAsLink).className
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={classes}
          {...(anchorRest as Omit<ButtonAsLink, keyof CommonProps | 'as'>)}
        >
          {children}
        </a>
      )
    }

    const buttonRest = { ...rest } as ButtonAsButton
    delete buttonRest.as
    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type="button"
        className={classes}
        {...buttonRest}
      >
        {children}
      </button>
    )
  },
)
