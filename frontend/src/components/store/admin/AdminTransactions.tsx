'use client'

import { useEffect, useState } from 'react'

import { invokeCommerceAction, type WalletTransaction } from '@/lib/commerce/api'

export default function AdminTransactions() {
  const [rows, setRows] = useState<WalletTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await invokeCommerceAction({ type: 'admin_transactions' })
      if (res.error) setError(res.error)
      else setRows(res.transactions ?? [])
    })()
  }, [])

  if (error) return <p>Admin transactions: {error}</p>

  return (
    <div>
      <h2>All wallet transactions</h2>
      <table className="tx-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Status</th>
            <th>Amount</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.user_id.slice(0, 8)}…</td>
              <td>{tx.type}</td>
              <td>{tx.status}</td>
              <td>{tx.amount_credits}</td>
              <td>{new Date(tx.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
