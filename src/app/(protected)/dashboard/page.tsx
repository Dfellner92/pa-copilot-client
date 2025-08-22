"use client";
import { useState } from "react";

type RequirementsOut = { requiresAuth: boolean; requiredDocs: string[] };

export default function Dashboard() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RequirementsOut | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function check() {
    setErr(null);
    const r = await fetch(`/api/requirements?code=${encodeURIComponent(code)}`);
    if (!r.ok) return setErr("Failed to fetch requirements");
    setResult(await r.json());
  }

  return (
    <main className="p-6 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prior Auth Requirements</h1>
        <form action="/api/auth/logout" method="post">
          <button className="btn" type="submit">
            Logout
          </button>
        </form>
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="CPT/HCPCS code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn" onClick={check}>
          Check
        </button>
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      {result && (
        <div className="border rounded-2xl p-4">
          <p className="mb-2">
            Requires Auth: <strong>{String(result.requiresAuth)}</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {result.requiredDocs.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
