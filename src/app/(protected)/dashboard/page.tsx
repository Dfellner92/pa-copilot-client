"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { ReactHookFormField } from "@/components/form/ReactHookFormField";
import { ReactHookFormInput } from "@/components/form/ReactHookFormInput";
import { ReactHookFormWrapper } from "@/components/form/ReactHookFormWrapper";
import { requirementsSchema, RequirementsInput } from '@/schemas/requirements';
import { Button } from "@/components/ui/Button";

type RequirementsOut = { requiresAuth: boolean; requiredDocs: string[] };

export default function Dashboard() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RequirementsOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const methods = useForm<RequirementsInput>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit'
  })

  const onSubmit = async (values: RequirementsInput) => {
    setErr(null)
    setLoading(true)
    setResult(null)
    const r = await fetch(`/api/requirements?code=${encodeURIComponent(values.code)}`)
    setLoading(false)
    if (!r.ok) {
      setErr(r.status === 401 ? 'Please sign in' : 'Failed to fetch requirements')
      return
    }
    setResult(await r.json())
  }

  return (
    <main className="p-6 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prior Auth Requirements</h1>
        <form action="/api/auth/logout" method="post">
          <Button type="submit">Logout</Button>
        </form>
      </div>

      <ReactHookFormWrapper methods={methods} onSubmit={onSubmit} className="space-y-3">
        <ReactHookFormField name="code" label="CPT/HCPCS code">
          <ReactHookFormInput name="code" placeholder="e.g., 97110" />
        </ReactHookFormField>
        <Button type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Check'}
        </Button>
      </ReactHookFormWrapper>

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
      {!result && !err && !loading && (
        <p className="text-sm text-gray-500">Enter a code to see requirements.</p>
      )}
    </main>
  )
}
