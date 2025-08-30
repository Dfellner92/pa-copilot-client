'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useForm,
  FormProvider,
  useFormContext,   // ← use this directly
} from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/toast/ToastProvider'

/** Schema: backend requires these today */
const schema = z.object({
  patient_id: z.string().min(1, 'Patient ID is required'),
  coverage_id: z.string().min(1, 'Coverage ID is required'),
  code: z.string().min(1, 'Procedure code is required'),
  diagnosis_codes: z.array(z.string().min(1)),

  // collected for later (not sent yet)
  member_name: z.string().optional(),
  member_id: z.string().optional(),
  member_dob: z.string().optional(),
  provider_name: z.string().optional(),
  provider_npi: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const steps = ['Member', 'Provider', 'Procedure', 'Review'] as const
type Step = (typeof steps)[number]

export default function NewRequestPage() {
  const { success, error } = useToast()
  const router = useRouter()
  const [step, setStep] = useState<Step>('Member')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: '',
      coverage_id: '',
      code: '',
      diagnosis_codes: [],
      member_name: '',
      member_id: '',
      member_dob: '',
      provider_name: '',
      provider_npi: '',
    },
    mode: 'onBlur',
  })

  const next = async () => {
    const fieldsByStep: Record<Step, (keyof FormValues)[]> = {
      Member: ['patient_id', 'coverage_id', 'member_name', 'member_id', 'member_dob'],
      Provider: ['provider_name', 'provider_npi'],
      Procedure: ['code'],
      Review: [],
    }
    const fields = fieldsByStep[step]
    if (fields.length) {
      const ok = await form.trigger(fields as any, { shouldFocus: true })
      if (!ok) return
    }
    const i = steps.indexOf(step)
    if (i < steps.length - 1) setStep(steps[i + 1])
  }

  const prev = () => setStep(steps[Math.max(0, steps.indexOf(step) - 1)])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const payload = {
        patient_id: values.patient_id,
        coverage_id: values.coverage_id,
        code: values.code,
        diagnosis_codes: values.diagnosis_codes ?? [],
      }
      const r = await fetch('/api/prior-auth/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        if (r.status === 401) {
          error('Session expired, please log in again')
          window.location.href = '/login'
          return
        }
        error('Failed to create request')
        return
      }
      const json = await r.json()
      success('Request created')
      router.push(`/requests/${encodeURIComponent(String(json.id))}`)
    } catch {
      error('Network error creating request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Prior Auth Request</h1>
      </header>

      <Stepper current={step} />

      <FormProvider {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {step === 'Member' && <MemberStep />}
          {step === 'Provider' && <ProviderStep />}
          {step === 'Procedure' && <ProcedureStep />}
          {step === 'Review' && <ReviewStep />}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button type="button" onClick={prev} disabled={step === 'Member'}>
                Back
              </Button>
              {step !== 'Review' ? (
                <Button type="button" onClick={next}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              )}
            </div>
            <Button type="button" onClick={() => router.push('/requests')}>Cancel</Button>
          </div>
        </form>
      </FormProvider>
    </main>
  )
}

/* ---------- UI helpers ---------- */

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex gap-3 text-sm">
      {steps.map((s, i) => {
        const active = s === current
        return (
          <li key={s} className={`px-3 py-1 rounded-xl border ${active ? 'bg-gray-200 dark:bg-gray-800 font-medium' : ''}`}>
            {i + 1}. {s}
          </li>
        )
      })}
    </ol>
  )
}

function Field({
  name,
  label,
  placeholder,
  type = 'text',
}: {
  name: keyof FormValues
  label: string
  placeholder?: string
  type?: string
}) {
  const { register, formState: { errors } } = useFormContext<FormValues>()  // ← use RHF context
  const err = (errors as any)[name]?.message as string | undefined
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Input {...register(name)} type={type} placeholder={placeholder} />
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  )
}

/* ---------- Steps ---------- */

function MemberStep() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium mb-1">Member</h2>
        <Field name="member_name" label="Name" placeholder="Jane Doe" />
        <Field name="member_id" label="Member ID" placeholder="M12345" />
        <Field name="member_dob" label="DOB" placeholder="YYYY-MM-DD" />
      </div>
      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium mb-1">Coverage</h2>
        <Field name="patient_id" label="Patient ID *" placeholder="patient-123" />
        <Field name="coverage_id" label="Coverage ID *" placeholder="coverage-abc" />
        <p className="text-xs text-gray-500">* required to submit</p>
      </div>
    </section>
  )
}

function ProviderStep() {
  return (
    <section className="rounded-2xl border p-4 space-y-3">
      <h2 className="font-medium mb-1">Provider</h2>
      <Field name="provider_name" label="Name" placeholder="Dr. Sam Smith" />
      <Field name="provider_npi" label="NPI" placeholder="1234567890" />
    </section>
  )
}

function ProcedureStep() {
  const { register, setValue, watch } = useFormContext<FormValues>()
  const dx = watch('diagnosis_codes')
  const addDx = () => setValue('diagnosis_codes', [...(dx ?? []), ''])
  const removeDx = (i: number) =>
    setValue('diagnosis_codes', (dx ?? []).filter((_, idx) => idx !== i))

  return (
    <section className="rounded-2xl border p-4 space-y-3">
      <h2 className="font-medium mb-1">Procedure</h2>
      <Field name="code" label="Procedure Code *" placeholder="70553" />
      <div className="space-y-2">
        <label className="text-sm font-medium">Diagnosis Codes</label>
        <div className="space-y-2">
          {(dx ?? []).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Input {...register(`diagnosis_codes.${i}` as const)} placeholder="e.g. S72.001A" />
              <Button type="button" onClick={() => removeDx(i)}>Remove</Button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={addDx}>Add diagnosis</Button>
      </div>
    </section>
  )
}

function ReviewStep() {
  const { getValues } = useFormContext<FormValues>()
  const v = getValues()
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4">
        <h3 className="font-medium mb-2">Member</h3>
        <Item k="Name" v={v.member_name} />
        <Item k="Member ID" v={v.member_id} />
        <Item k="DOB" v={v.member_dob} />
        <Item k="Patient ID *" v={v.patient_id} />
        <Item k="Coverage ID *" v={v.coverage_id} />
      </div>
      <div className="rounded-2xl border p-4">
        <h3 className="font-medium mb-2">Provider</h3>
        <Item k="Name" v={v.provider_name} />
        <Item k="NPI" v={v.provider_npi} />
      </div>
      <div className="rounded-2xl border p-4 md:col-span-2">
        <h3 className="font-medium mb-2">Procedure</h3>
        <Item k="Code *" v={v.code} />
        <Item k="Diagnosis Codes" v={(v.diagnosis_codes ?? []).join(', ')} />
      </div>
    </section>
  )
}

function Item({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 w-36">{k}:</span>
      <span>{v && v.length > 0 ? v : '—'}</span>
    </div>
  )
}
