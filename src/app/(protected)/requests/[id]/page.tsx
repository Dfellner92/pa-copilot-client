import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import RequestDetailClient from "./RequestDetailClient";

type Detail = {
  id: string;
  status: string;
  updatedAt?: string;
  createdAt?: string;
  memberName?: string;
  memberId?: string;
  memberDob?: string;
  providerName?: string;
  providerNpi?: string;
  codes?: string[];
  diagnosisCodes?: string[];
  notes?: string;
  attachments?: { id: string; name?: string; url?: string }[];
};

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

function mapDetail(json: any, id: string): Detail {
  const memberId =
    json.memberId ??
    json.member?.id ??
    json.patientId ??
    json.patient_id ??
    json.patient?.id ??
    undefined;

  const memberName =
    json.memberName ??
    json.member?.name ??
    json.patientName ??
    json.patient?.name ??
    undefined;

  const memberDob =
    json.memberDob ??
    json.member?.dob ??
    json.patientDob ??
    json.patient?.dob ??
    json.member?.date_of_birth ??
    json.patient?.date_of_birth ??
    undefined;

  const providerNpi =
    json.providerNpi ??
    json.provider?.npi ??
    json.provider_npi ??
    json.npi ??
    undefined;

  const providerName = json.providerName ?? json.provider?.name ?? undefined;

  const codes: string[] =
    json.codes ??
    json.procedures ??
    (json.code ? [json.code] : []) ??
    (json.procedure_code ? [json.procedure_code] : []);

  const diagnosisCodes: string[] =
    json.diagnosisCodes ?? json.diagnoses ?? json.icd10_codes ?? [];

  return {
    id: String(json.id ?? json.requestId ?? id),
    status: String(json.status ?? "pending"),
    updatedAt:
      json.updatedAt ?? json.updated_at ?? json.modifiedAt ?? undefined,
    createdAt: json.createdAt ?? json.created_at ?? undefined,
    memberName,
    memberId,
    memberDob,
    providerName,
    providerNpi,
    codes,
    diagnosisCodes,
    notes: json.notes ?? undefined,
    attachments: json.attachments ?? [],
  };
}

async function getDetail(id: string): Promise<Detail> {
  if (!isUuid(id)) notFound();

  // Forward auth cookie to our own API route so middleware/auth stays consistent
  const COOKIE = process.env.JWT_COOKIE_NAME || "pa_token";
  const token = (await cookies()).get(COOKIE)?.value;
  const proto = (await headers()).get("x-forwarded-proto") ?? "http";
  const host = (await headers()).get("host");
  const url = `${proto}://${host}/api/prior-auth/requests/${encodeURIComponent(
    id
  )}`;

  const h = new Headers({ "cache-control": "no-store" });
  if (token) h.set("cookie", `${COOKIE}=${token}`);

  const res = await fetch(url, { headers: h, cache: "no-store" });

  if (res.status === 401) redirect("/login");
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load request (${res.status})`);

  const json = await res.json();
  return mapDetail(json, id);
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDetail(id);

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">
      <RequestDetailClient data={data} />
    </main>
  );
}
