"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrCreateWalletId, writeWalletId } from "@/lib/wallet";
import { track } from "@/lib/analytics";

export function BillingSuccessClient() {
  const [status, setStatus] = useState<"loading" | "ok" | "pending" | "error">("loading");
  const [balance, setBalance] = useState<number | null>(null);
  const [message, setMessage] = useState("Confirming payment…");

  useEffect(() => {
    const run = async () => {
      const walletId = getOrCreateWalletId();
      const query = window.location.search.replace(/^\?/, "");
      track("billing_success_view");
      try {
        const res = await fetch("/api/billing/activate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ wallet_id: walletId, query }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          balance?: number;
          wallet_id?: string;
          order_status?: string;
          credited?: boolean;
          error?: string;
        };
        if (data.wallet_id && data.wallet_id !== walletId) {
          writeWalletId(data.wallet_id);
        }
        if (!res.ok || !data.ok) {
          setStatus("error");
          setMessage(data.error || "Could not confirm payment.");
          return;
        }
        if (typeof data.balance === "number") setBalance(data.balance);
        if (data.credited || (data.balance ?? 0) > 0) {
          setStatus("ok");
          setMessage("Credits are on this browser wallet. Open Remove and run AI Restore.");
        } else {
          setStatus("pending");
          setMessage(
            "Payment received — credits may take a few seconds (webhook). Refresh balance on /remove.",
          );
        }
      } catch {
        setStatus("error");
        setMessage("Network error confirming payment.");
      }
    };
    void run();
  }, []);

  return (
    <div className="billing-success">
      <p className={`billing-success-status is-${status}`}>{message}</p>
      {balance !== null && (
        <p className="billing-success-balance">
          Balance: <strong>{balance}</strong> credit{balance === 1 ? "" : "s"}
        </p>
      )}
      <div className="billing-success-actions">
        <Link href="/remove" className="btn-primary">
          Open Remover
        </Link>
        <Link href="/pricing" className="btn-ghost">
          Buy more
        </Link>
      </div>
    </div>
  );
}
