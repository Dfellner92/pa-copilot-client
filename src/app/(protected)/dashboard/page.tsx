"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactHookFormField } from "@/components/form/ReactHookFormField";
import { ReactHookFormInput } from "@/components/form/ReactHookFormInput";
import { ReactHookFormWrapper } from "@/components/form/ReactHookFormWrapper";
import { requirementsSchema, RequirementsInput } from "@/schemas/requirements";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/toast/ToastProvider";
import { copy } from '@/lib/clipboard';

type RequirementsOut = { requiresAuth: boolean; requiredDocs: string[] };

// ---- New: recent-search helpers ----
type Recent = { code: string; ts: number };
const RECENTS_KEY = "req_recents_v1";
const RECENTS_MAX = 8;


export default function Dashboard() {
  const { success, error: toastError } = useToast();

  const [result, setResult] = useState<RequirementsOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ---- New: recents state ----
  const [recents, setRecents] = useState<Recent[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  const saveRecents = (items: Recent[]) => {
    setRecents(items);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(items));
    } catch {}
  };

  const methods = useForm<RequirementsInput>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values: RequirementsInput) => {
    setErr(null);
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(
        `/api/requirements?code=${encodeURIComponent(values.code)}`
      );
      if (!r.ok) {
        if (r.status === 401) {
          toastError("Session expired, please log in again");
          window.location.href = "/login";
          return;
        }
        toastError("Failed to fetch requirements");
        return;
      }
      const json: RequirementsOut = await r.json();
      setResult(json);

      const next: Recent[] = [
        { code: values.code, ts: Date.now() },
        ...recents.filter((x) => x.code !== values.code),
      ].slice(0, RECENTS_MAX);
      saveRecents(next);

    } catch {
      toastError("Network error contacting API");
    } finally {
      setLoading(false);
    }
  };

  // ---- New: copy helpers ----
  const summary = useMemo(() => {
    if (!result) return "";
    const lines = [
      `Code: ${methods.getValues("code")}`,
      `Requires Auth: ${result.requiresAuth ? "Yes" : "No"}`,
      ...(result.requiredDocs?.length
        ? ["Required Docs:", ...result.requiredDocs.map((d) => `- ${d}`)]
        : []),
    ];
    return lines.join("\n");
  }, [result, methods]);

  const onCopyCode = async () => {
    const code = methods.getValues("code");
    if (!code) return;
    if (await copy(code)) success("Code copied");
  };
  const onCopySummary = async () => {
    if (!summary) return;
    if (await copy(summary)) success("Copied result to clipboard");
  };
  const onPickRecent = (c: string) => {
    methods.setValue("code", c, { shouldDirty: true });
    void methods.handleSubmit(onSubmit)();
  };

  return (
    <main className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prior Auth Requirements</h1>
      </div>

      <ReactHookFormWrapper
        methods={methods}
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <ReactHookFormField name="code" label="CPT/HCPCS code">
          <ReactHookFormInput name="code" placeholder="e.g., 97110" />
        </ReactHookFormField>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Checking…" : "Check"}
          </Button>
          {/* ---- New: copy buttons (enabled when we have a value/result) ---- */}
          <Button
            type="button"
            onClick={onCopyCode}
            disabled={!methods.getValues("code")}
          >
            Copy code
          </Button>
          <Button type="button" onClick={onCopySummary} disabled={!result}>
            Copy result
          </Button>
        </div>
      </ReactHookFormWrapper>

      {/* ---- New: Recents chip row ---- */}
      {recents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recents.map((r) => (
            <button
              key={r.code}
              className="btn text-sm"
              onClick={() => onPickRecent(r.code)}
              title={new Date(r.ts).toLocaleString()}
            >
              {r.code}
            </button>
          ))}
          <button
            className="btn text-sm"
            onClick={() => saveRecents([])}
            title="Clear recent codes"
          >
            Clear
          </button>
        </div>
      )}

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {result && (
        <section className="border rounded-2xl p-4 space-y-3 bg-white dark:bg-black">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm text-gray-500">Code</p>
              <div className="text-lg font-medium">
                {methods.getValues("code")}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={onCopyCode}>
                Copy code
              </Button>
              <Button type="button" onClick={onCopySummary}>
                Copy result
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <p className="text-sm text-gray-500 mb-1">
                Requires Authorization
              </p>
              <p className="text-lg font-semibold">
                {result.requiresAuth ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-sm text-gray-500 mb-1">Required Documents</p>
              {result.requiredDocs?.length ? (
                <ul className="list-disc pl-5 space-y-1">
                  {result.requiredDocs.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No documents required.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {!result && !err && !loading && (
        <div className="rounded-2xl border p-4 text-sm text-gray-500">
          Enter a code and press <span className="font-medium">Check</span>, or
          click a recent code above.
        </div>
      )}
    </main>
  );
}
