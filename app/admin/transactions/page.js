"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatAmount, shortReference, transactionStatusDisplay } from "@/lib/paystack";
import { channelLabel } from "@/lib/paystack-channels";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/transactions", { credentials: "include" })
      .then(setData)
      .catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
        <h1>Paystack Transactions</h1>
        <p style={{ color: "#666", marginTop: "1rem" }}>Loading from Paystack...</p>
      </main>
    );
  }

  const { transactions = [] } = data ?? {};

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Paystack Transactions</h1>
        <Link href="/admin/orders" style={{ fontSize: "0.9rem", color: "#666" }}>
          ← Orders
        </Link>
      </div>

      <p style={{ color: "#555", marginTop: "0.25rem", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Last {transactions.length} transactions from Paystack, compared against your database.
        Rows highlighted in red indicate a mismatch — Paystack reports success but the order is not marked paid.
      </p>

      {transactions.length === 0 ? (
        <p style={{ color: "#666" }}>No transactions found in Paystack.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#666" }}>
              {["Reference", "Email", "Amount", "Paystack", "Database", "Paid at"].map((h) => (
                <th key={h} style={{ borderBottom: "1px solid #ddd", padding: "0.5rem 0.75rem" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const psDisplay = transactionStatusDisplay(t.paystackStatus);
              return (
                <tr
                  key={t.reference}
                  style={{
                    background: t.mismatch ? "#fff5f5" : "transparent",
                    borderLeft: t.mismatch ? "3px solid crimson" : "3px solid transparent",
                  }}
                >
                  <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee" }}>
                    <Link href={`/orders/${t.reference}`} style={{ fontSize: "0.8rem" }}>
                      {shortReference(t.reference)}
                    </Link>
                    {t.mismatch && (
                      <span style={{
                        marginLeft: "0.5rem",
                        background: "crimson",
                        color: "#fff",
                        borderRadius: 3,
                        padding: "0.1rem 0.4rem",
                        fontSize: "0.7rem",
                      }}>
                        MISMATCH
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee" }}>
                    {t.email}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee" }}>
                    {formatAmount(t.paystackAmount)}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee" }}>
                    <span style={{ color: psDisplay.color, fontWeight: 500 }}>
                      {psDisplay.label}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee", textTransform: "capitalize" }}>
                    {t.dbStatus ?? (
                      <span style={{ color: "#999" }}>not in DB</span>
                    )}
                  </td>
                  <td style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid #eee", color: "#666" }}>
                    {t.paidAt
                      ? new Intl.DateTimeFormat("en-KE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(t.paidAt))
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {transactions.some((t) => t.mismatch) && (
        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "#fff5f5",
          border: "1px solid #fecaca",
          borderRadius: 4,
          fontSize: "0.9rem",
        }}>
          <strong>⚠ Mismatches detected.</strong> Paystack reports successful payment but the
          corresponding order is not marked paid. This may indicate a webhook delivery failure
          or a bug in the verification flow. Check the Paystack webhook log in your dashboard
          and consider manually verifying these references.
        </div>
      )}
    </main>
  );
}