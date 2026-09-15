'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatCredits } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { invokeCommerceAction, type WalletTransaction } from '@/lib/commerce/api'
import {
  resolveOrderTags,
  resolveWalletTxTags,
  tagLabel,
  type TransactionTag,
} from '@/lib/commerce/transactionTags'
import { isMarketCurrency } from '@/lib/market/currency'
import './TransactionHistory.css'

const PAGE_SIZE = 10

type OrderRow = {
  id: string
  order_number: string
  status: string
  total_cents: number
  currency: string
  credits_granted: number
  created_at: string
  refund_status?: string | null
  order_items?: Array<{
    title_snapshot?: string | null
    quantity?: number | null
    unit_price_cents?: number | null
  }>
}

type TagFilter = 'all' | TransactionTag

const ORDER_STATUS_OPTIONS = ['all', 'paid', 'failed', 'refunded', 'cancelled'] as const
const WALLET_STATUS_OPTIONS = ['all', 'pending', 'successful', 'rejected', 'completed', 'failed', 'refunded'] as const
const WALLET_TYPE_OPTIONS = [
  'all',
  'Store purchase',
  'Store sale',
  'Card purchase',
  'Top up',
  'Purchase',
  'Adjustment',
  'Withdrawal',
  'Refund',
] as const

type WalletTypeFilter = (typeof WALLET_TYPE_OPTIONS)[number]

function rejectReasonFromTx(tx: WalletTransaction): string | null {
  const reason = tx.metadata?.reject_reason
  return typeof reason === 'string' && reason.trim() ? reason.trim() : null
}

function formatTxStatus(tx: WalletTransaction): string {
  if (tx.type === 'withdrawal') {
    if (tx.status === 'failed') return 'rejected'
    if (tx.status === 'completed') return 'successful'
    if (tx.status === 'pending') return 'pending'
  }
  return tx.status
}

function txStatusClass(tx: WalletTransaction): string {
  if (tx.type === 'withdrawal') {
    if (tx.status === 'failed') return 'rejected'
    if (tx.status === 'completed') return 'successful'
    return tx.status
  }
  return tx.status
}

function walletStatusMatchesFilter(tx: WalletTransaction, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'rejected') return tx.type === 'withdrawal' && tx.status === 'failed'
  if (filter === 'successful') return tx.status === 'completed'
  return tx.status === filter
}

function formatTxType(type: string, description: string | null): string {
  if (description?.startsWith('Card sold:')) return 'Store sale'
  if (description?.startsWith('Payment processing:')) return 'Store purchase'
  if (description?.startsWith('Purchased ') && description.includes(' credits for ')) {
    return 'Store purchase'
  }
  if (description?.startsWith('Bought listing:')) return 'Card purchase'
  if (description?.startsWith('Purchased card:')) return 'Store purchase'
  if (type === 'top_up') return 'Top up'
  if (type === 'purchase') return 'Purchase'
  if (type === 'adjustment') return 'Adjustment'
  if (type === 'withdrawal') return 'Withdrawal'
  if (type === 'refund') return 'Refund'
  return type
}

function formatOrderMoney(totalCents: number, currencyCode: string): string {
  const upper = currencyCode.toUpperCase()
  const amount = totalCents / 100
  if (isMarketCurrency(upper)) {
    return new Intl.NumberFormat('en', { style: 'currency', currency: upper }).format(amount)
  }
  return `${amount.toFixed(2)} ${upper}`
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function orderItemsSummary(order: OrderRow): string | null {
  const items = Array.isArray(order.order_items) ? order.order_items : []
  const normalized = items
    .map((item) => ({
      title: String(item.title_snapshot ?? 'Item'),
      quantity: Number(item.quantity ?? 0),
    }))
    .filter((item) => item.quantity > 0)
  if (!normalized.length) return null
  return normalized.map((item) => `${item.title} x${item.quantity}`).join(', ')
}

function cardsPurchasedCount(order: OrderRow): number {
  const items = Array.isArray(order.order_items) ? order.order_items : []
  return items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity ?? 0)), 0)
}

function matchesTagFilter(tags: TransactionTag[], filter: TagFilter): boolean {
  if (filter === 'all') return true
  return tags.includes(filter)
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  }
}

function TxTags({ tags }: { tags: TransactionTag[] }) {
  if (!tags.length) return null
  return (
    <span className="portal-tx-row__tags">
      {tags.map((tag) => (
        <span key={tag} className={`portal-tx-tag portal-tx-tag--${tag}`}>
          {tagLabel(tag)}
        </span>
      ))}
    </span>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="portal-transactions__filter">
      <span className="portal-transactions__filter-label">{label}</span>
      <select
        className="portal-transactions__filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ListPagination({
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  rangeStart: number
  rangeEnd: number
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null

  return (
    <div className="portal-transactions__pagination">
      <p className="portal-transactions__pagination-summary">
        {total === 0
          ? 'No results'
          : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
      </p>
      <div className="portal-transactions__pagination-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="portal-transactions__pagination-page">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  const [orderTagFilter, setOrderTagFilter] = useState<TagFilter>('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')
  const [orderPage, setOrderPage] = useState(1)

  const [walletTagFilter, setWalletTagFilter] = useState<TagFilter>('all')
  const [walletStatusFilter, setWalletStatusFilter] = useState<string>('all')
  const [walletTypeFilter, setWalletTypeFilter] = useState<WalletTypeFilter>('all')
  const [walletPage, setWalletPage] = useState(1)

  const load = useCallback(async () => {
    const [txRes, ordRes] = await Promise.all([
      invokeCommerceAction({ type: 'transactions_list', limit: 100 }),
      invokeCommerceAction({ type: 'orders_list' }),
    ])
    setTransactions(txRes.transactions ?? [])
    setOrders((ordRes.orders as OrderRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void load().then(() => {
      if (cancelled) return
    })
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    setOrderPage(1)
  }, [orderTagFilter, orderStatusFilter])

  useEffect(() => {
    setWalletPage(1)
  }, [walletTagFilter, walletStatusFilter, walletTypeFilter])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const tags = resolveOrderTags(order.credits_granted)
      if (!matchesTagFilter(tags, orderTagFilter)) return false
      if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) return false
      return true
    })
  }, [orders, orderTagFilter, orderStatusFilter])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const tags = resolveWalletTxTags(tx.type, tx.description)
      if (!matchesTagFilter(tags, walletTagFilter)) return false
      if (walletStatusFilter !== 'all' && !walletStatusMatchesFilter(tx, walletStatusFilter)) return false
      const typeLabel = formatTxType(tx.type, tx.description)
      if (walletTypeFilter !== 'all' && typeLabel !== walletTypeFilter) return false
      return true
    })
  }, [transactions, walletTagFilter, walletStatusFilter, walletTypeFilter])

  const orderPagination = useMemo(
    () => paginate(filteredOrders, orderPage, PAGE_SIZE),
    [filteredOrders, orderPage],
  )

  const walletPagination = useMemo(
    () => paginate(filteredTransactions, walletPage, PAGE_SIZE),
    [filteredTransactions, walletPage],
  )

  if (loading) {
    return <p className="portal-transactions__loading">Loading transaction history…</p>
  }

  return (
    <div className="portal-transactions">
      <section className="portal-transactions__section" aria-label="Payment history">
        <h2 className="portal-transactions__title">Payment history</h2>

        <div className="portal-transactions__toolbar">
          <FilterSelect
            label="Tag"
            value={orderTagFilter}
            onChange={(v) => setOrderTagFilter(v as TagFilter)}
            options={[
              { value: 'all', label: 'All tags' },
              { value: 'cash', label: 'Cash' },
              { value: 'credits', label: 'Credits' },
            ]}
          />
          <FilterSelect
            label="Status"
            value={orderStatusFilter}
            onChange={setOrderStatusFilter}
            options={ORDER_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s === 'all' ? 'All statuses' : s.replace(/_/g, ' '),
            }))}
          />
        </div>

        {orders.length === 0 ? (
          <p className="portal-transactions__empty">No payments yet.</p>
        ) : filteredOrders.length === 0 ? (
          <p className="portal-transactions__empty">No payments match these filters.</p>
        ) : (
          <>
            <ul className="portal-transactions__list" role="list">
              {orderPagination.items.map((order) => {
                const tags = resolveOrderTags(order.credits_granted)
                const money = formatOrderMoney(order.total_cents, order.currency)
                const creditsLine =
                  order.credits_granted > 0
                    ? `+${formatCredits(order.credits_granted)} credits`
                    : null
                const cardsCount = order.credits_granted > 0 ? 0 : cardsPurchasedCount(order)
                const cardsLine = cardsCount > 0 ? `${cardsCount} card${cardsCount === 1 ? '' : 's'} bought` : null
                const detailsLine = orderItemsSummary(order)

                return (
                  <li key={order.id}>
                    <article className="portal-tx-row">
                      <div className="portal-tx-row__main">
                        <div className="portal-tx-row__head">
                          <span className="portal-tx-row__type">
                            Order {order.order_number}
                          </span>
                          <TxTags tags={tags} />
                        </div>
                        <p className="portal-tx-row__desc">
                          {creditsLine
                            ? `Paid ${money} · ${creditsLine}`
                            : cardsLine
                              ? `Paid ${money} · ${cardsLine}`
                              : `Paid ${money}`}
                        </p>
                        {detailsLine ? <p className="portal-tx-row__desc">{detailsLine}</p> : null}
                        <time className="portal-tx-row__date" dateTime={order.created_at}>
                          {formatWhen(order.created_at)}
                        </time>
                      </div>
                      <div className="portal-tx-row__meta">
                        <span
                          className={`portal-tx-row__status portal-tx-row__status--${order.status}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <span className="portal-tx-row__amount">{money}</span>
                        {creditsLine ? (
                          <span className="portal-tx-row__balance">{creditsLine}</span>
                        ) : cardsLine ? (
                          <span className="portal-tx-row__balance">{cardsLine}</span>
                        ) : null}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            <ListPagination
              page={orderPagination.page}
              totalPages={orderPagination.totalPages}
              total={orderPagination.total}
              rangeStart={orderPagination.rangeStart}
              rangeEnd={orderPagination.rangeEnd}
              onPageChange={setOrderPage}
            />
          </>
        )}
      </section>

      <section className="portal-transactions__section" aria-label="Wallet activity">
        <h2 className="portal-transactions__title">Wallet activity</h2>

        <div className="portal-transactions__toolbar">
          <FilterSelect
            label="Tag"
            value={walletTagFilter}
            onChange={(v) => setWalletTagFilter(v as TagFilter)}
            options={[
              { value: 'all', label: 'All tags' },
              { value: 'credits', label: 'Credits' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
          <FilterSelect
            label="Type"
            value={walletTypeFilter}
            onChange={(v) => setWalletTypeFilter(v as WalletTypeFilter)}
            options={WALLET_TYPE_OPTIONS.map((t) => ({
              value: t,
              label: t === 'all' ? 'All types' : t,
            }))}
          />
          <FilterSelect
            label="Status"
            value={walletStatusFilter}
            onChange={setWalletStatusFilter}
            options={WALLET_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s === 'all' ? 'All statuses' : s,
            }))}
          />
        </div>

        {transactions.length === 0 ? (
          <p className="portal-transactions__empty">No wallet activity yet.</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="portal-transactions__empty">No activity matches these filters.</p>
        ) : (
          <>
            <ul className="portal-transactions__list" role="list">
              {walletPagination.items.map((tx) => {
                const tags = resolveWalletTxTags(tx.type, tx.description)
                const isCredit = tx.amount_credits > 0
                const amountLabel = `${isCredit ? '+' : '−'}${formatCredits(Math.abs(tx.amount_credits))} credits`
                const displayStatus = formatTxStatus(tx)
                const statusClass = txStatusClass(tx)
                const rejectReason = rejectReasonFromTx(tx)

                return (
                  <li key={tx.id}>
                    <article className="portal-tx-row">
                      <div className="portal-tx-row__main">
                        <div className="portal-tx-row__head">
                          <span className="portal-tx-row__type">
                            {formatTxType(tx.type, tx.description)}
                          </span>
                          <TxTags tags={tags} />
                        </div>
                        <p className="portal-tx-row__desc">{tx.description ?? '—'}</p>
                        {rejectReason ? (
                          <p className="portal-tx-row__reject-reason">
                            <span className="portal-tx-row__reject-label">Reject reason:</span>{' '}
                            {rejectReason}
                          </p>
                        ) : null}
                        <time className="portal-tx-row__date" dateTime={tx.created_at}>
                          {formatWhen(tx.created_at)}
                        </time>
                      </div>
                      <div className="portal-tx-row__meta">
                        <span className={`portal-tx-row__status portal-tx-row__status--${statusClass}`}>
                          {displayStatus}
                        </span>
                        <span
                          className={`portal-tx-row__amount${isCredit ? '' : ' portal-tx-row__amount--debit'}`}
                        >
                          {amountLabel}
                        </span>
                        {tx.balance_after != null ? (
                          <span className="portal-tx-row__balance">
                            Balance: {formatCredits(tx.balance_after)} credits
                          </span>
                        ) : null}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            <ListPagination
              page={walletPagination.page}
              totalPages={walletPagination.totalPages}
              total={walletPagination.total}
              rangeStart={walletPagination.rangeStart}
              rangeEnd={walletPagination.rangeEnd}
              onPageChange={setWalletPage}
            />
          </>
        )}
      </section>
    </div>
  )
}
