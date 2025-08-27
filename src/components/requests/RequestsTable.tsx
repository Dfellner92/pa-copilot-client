"use client";
import Link from "next/link";
import { PriorAuthRequest } from "@/types/requests";
import { StatusBadge } from "./StatusBadge";

export const RequestsTable = ({ items }: { items: PriorAuthRequest[] }) => {
  if (!items.length) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-gray-500">
        No requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/30 text-left">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Codes</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{r.memberName || "—"}</div>
                {r.memberId && (
                  <div className="text-xs text-gray-500">{r.memberId}</div>
                )}
              </td>
              <td className="px-4 py-3">
                {r.codes?.length ? r.codes.join(", ") : "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3">
                {new Date(r.updatedAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  className="btn text-xs"
                  href={`/requests/${encodeURIComponent(r.id)}`}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
