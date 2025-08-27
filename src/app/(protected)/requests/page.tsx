"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { RequestsTable } from "@/components/requests/RequestsTable";
import { PriorAuthRequest, RequestStatus } from "@/types/requests";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/toast/ToastProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";

const PAGE_SIZE = 10;
const STATUS: RequestStatus[] = [
  "pending",
  "submitted",
  "approved",
  "denied",
  "error",
];

const RequestsPage = () => {
  const { error: toastError } = useToast();
  const [raw, setRaw] = useState<PriorAuthRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<RequestStatus | "all">(
    "all"
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const didFetch = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only run when exactly on /requests
    if (pathname !== "/requests") return;
    if (didFetch.current) return;
    didFetch.current = true;

    let aborted = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/prior-auth/requests", { cache: "no-store" });
        if (!r.ok) {
          if (r.status === 401) {
            toastError("Session expired, please log in again");
            window.location.href = "/login";
            return;
          }
          if (r.status === 404 || r.status === 405) {
            if (!aborted) setRaw([]); // treat as empty
            return;
          }
          toastError("Failed to load requests");
          return;
        }
        const data = await r.json();
        const items: any[] = Array.isArray(data) ? data : data.items ?? [];
        if (aborted) return;
        const mapped: PriorAuthRequest[] = items.map((x) => ({
          id: String(x.id ?? x.requestId ?? ""),
          memberName: x.memberName ?? x.member?.name ?? "",
          memberId: x.memberId ?? x.member?.id ?? "",
          providerName: x.providerName ?? x.provider?.name ?? "",
          codes: x.codes ?? x.procedures ?? [],
          status: (x.status ?? "pending").toLowerCase(),
          updatedAt:
            x.updatedAt ??
            x.updated_at ??
            x.modifiedAt ??
            x.createdAt ??
            new Date().toISOString(),
        }));
        setRaw(mapped);
      } catch {
        if (!aborted) toastError("Network error loading requests");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [pathname, toastError]);

  // Filter + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return raw.filter((r) => {
      const okStatus = activeStatus === "all" ? true : r.status === activeStatus;
      if (!okStatus) return false;
      if (!q) return true;
      const hay = `${r.memberName ?? ""} ${r.memberId ?? ""} ${(r.codes ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [raw, activeStatus, query]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [activeStatus, query]);

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prior Auth Requests</h1>
        <Link className="btn" href="/requests/new">
          New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2">
          <button
            className={`btn text-sm ${
              activeStatus === "all" ? "bg-gray-200 dark:bg-gray-800 font-semibold" : ""
            }`}
            onClick={() => setActiveStatus("all")}
          >
            All
          </button>
          {STATUS.map((s) => (
            <button
              key={s}
              className={`btn text-sm ${
                activeStatus === s ? "bg-gray-200 dark:bg-gray-800 font-semibold" : ""
              }`}
              onClick={() => setActiveStatus(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="Search member or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => setQuery("")}>Clear</Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-500">
          Loading…
        </div>
      ) : (
        <RequestsTable items={pageItems} />
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-500">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe <= 1}
            >
              Prev
            </Button>
            <span className="text-sm">
              Page {pageSafe} / {totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default RequestsPage;
