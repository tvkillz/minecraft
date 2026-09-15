export type TransactionTag = 'credits' | 'cash'

const TAG_LABEL: Record<TransactionTag, string> = {
  credits: 'Credits',
  cash: 'Cash',
}

export function tagLabel(tag: TransactionTag): string {
  return TAG_LABEL[tag]
}

function isCashCreditPurchase(description: string): boolean {
  return (
    (description.startsWith('Purchased ') && description.includes(' credits for ')) ||
    description.startsWith('Payment processing:') ||
    description.includes('Stripe payment order')
  )
}

export function resolveWalletTxTags(type: string, description: string | null): TransactionTag[] {
  const desc = description ?? ''

  if (isCashCreditPurchase(desc)) return ['cash', 'credits']

  if (type === 'withdrawal') return ['cash']

  if (
    type === 'purchase' ||
    type === 'adjustment' ||
    desc.startsWith('Card sold:') ||
    desc.startsWith('Bought listing:') ||
    desc.startsWith('Purchased card:') ||
    desc.startsWith('Purchased:') ||
    desc.startsWith('Checkout:')
  ) {
    return ['credits']
  }

  if (type === 'top_up' || type === 'refund') return ['credits']

  return ['credits']
}

export function resolveOrderTags(creditsGranted: number): TransactionTag[] {
  const tags: TransactionTag[] = ['cash']
  if (creditsGranted > 0) tags.push('credits')
  return tags
}
