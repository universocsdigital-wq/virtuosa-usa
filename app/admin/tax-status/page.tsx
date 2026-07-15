"use client";

import { useEffect, useState } from "react";

export default function AdminTaxStatusPage() {
  const [result, setResult] = useState("Consultando impostos do Square...");

  useEffect(() => {
    fetch("/api/admin/tax-status", { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => setResult(ok ? JSON.stringify(data) : data.error || "Falha na consulta."))
      .catch(() => setResult("Falha na consulta."));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl text-[#2A1712]">Diagnostico fiscal do Square</h1>
      <pre className="mt-6 overflow-auto whitespace-pre-wrap rounded border border-[#D9C8B5] bg-white p-5 text-sm text-[#2A1712]">{result}</pre>
    </main>
  );
}
