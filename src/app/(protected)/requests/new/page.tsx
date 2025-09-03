'use client'

import { useState, useEffect, useMemo } from 'react'
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
const baseSchema = z.object({
  patient_id: z.string().optional(),
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

type FormValues = z.infer<typeof baseSchema>

const steps = ['Member', 'Provider', 'Procedure', 'Review'] as const
type Step = (typeof steps)[number]

export default function NewRequestPage() {
  const { success, error } = useToast()
  const router = useRouter()
  const [step, setStep] = useState<Step>('Member')
  const [submitting, setSubmitting] = useState(false)
  const [createNewPatient, setCreateNewPatient] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
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
    // Custom validation based on createNewPatient flag
    const fieldsByStep: Record<Step, (keyof FormValues)[]> = {
      Member: createNewPatient 
        ? ['coverage_id', 'member_name', 'member_dob'] // Don't require patient_id when creating new
        : ['patient_id', 'coverage_id', 'member_name', 'member_id', 'member_dob'],
      Provider: ['provider_name', 'provider_npi'],
      Procedure: ['code'],
      Review: [],
    }
    const fields = fieldsByStep[step]
    if (fields.length) {
      // Custom validation for createNewPatient mode
      if (createNewPatient && step === 'Member') {
        const values = form.getValues()
        if (!values.member_name?.trim()) {
          form.setError('member_name', { message: 'Name is required when creating new patient' })
          return
        }
        if (!values.member_dob?.trim()) {
          form.setError('member_dob', { message: 'DOB is required when creating new patient' })
          return
        }
        if (!values.coverage_id?.trim()) {
          form.setError('coverage_id', { message: 'Coverage ID is required' })
          return
        }
      } else {
        const ok = await form.trigger(fields as any, { shouldFocus: true })
        if (!ok) return
      }
    }
    const i = steps.indexOf(step)
    if (i < steps.length - 1) setStep(steps[i + 1])
  }

  const prev = () => setStep(steps[Math.max(0, steps.indexOf(step) - 1)])

  const onSubmit = async (values: FormValues) => {
    console.log('[DEBUG] Form submitted with values:', values)
    console.log('[DEBUG] createNewPatient flag:', createNewPatient)
    
    setSubmitting(true)
    try {
      let patientId = values.patient_id
      
      // If creating a new patient, generate a UUID and create the patient first
      if (createNewPatient) {
        const patientData = {
          external_id: `member-${Date.now()}`,
          first_name: values.member_name?.trim()?.split(/\s+/)[0] || 'Unknown',
          last_name: values.member_name?.trim()?.split(/\s+/).slice(1).join(' ') || 'Member',
          birth_date: values.member_dob?.trim() || '1900-01-01',
        }
        
        console.log('[DEBUG] Creating new patient with data:', patientData)
        
        const newPatientResponse = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patientData),
        })
        
        console.log('[DEBUG] Patient creation response status:', newPatientResponse.status)
        const patientResponseText = await newPatientResponse.text()
        console.log('[DEBUG] Patient creation response:', patientResponseText)
        
        if (!newPatientResponse.ok) {
          console.error('[DEBUG] Patient creation failed:', patientResponseText)
          error('Failed to create new patient')
          return
        }
        
        const newPatient = JSON.parse(patientResponseText)
        console.log('[DEBUG] New patient created:', newPatient)
        
        // Now create a coverage for this patient
        const coverageData = {
          external_id: `coverage-${Date.now()}`,
          member_id: `M${Date.now()}`,
          plan: 'Standard Plan',
          payer: 'Test Payer',
          patient_id: newPatient.id,
        }
        
        console.log('[DEBUG] Creating new coverage with data:', coverageData)
        
        const newCoverageResponse = await fetch('/api/coverages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coverageData),
        })
        
        console.log('[DEBUG] Coverage creation response status:', newCoverageResponse.status)
        const coverageResponseText = await newCoverageResponse.text()
        console.log('[DEBUG] Coverage creation response:', coverageResponseText)
        
        if (!newCoverageResponse.ok) {
          console.error('[DEBUG] Coverage creation failed:', coverageResponseText)
          error('Failed to create new coverage')
          return
        }
        
        const newCoverage = JSON.parse(coverageResponseText)
        console.log('[DEBUG] New coverage created:', newCoverage)
        
        patientId = newPatient.id
        // Update the coverage_id in the form values
        values.coverage_id = newCoverage.id
      }

      const payload = {
        patient_id: patientId,
        coverage_id: values.coverage_id,
        code: values.code,
        diagnosis_codes: values.diagnosis_codes ?? [],
      
        // NEW: forward what the user typed so the proxy/backend can upsert/resolve a Patient
        member_name: values.member_name?.trim() || undefined,
        member_dob: values.member_dob?.trim() || undefined,
      
        // Optional: also send split fields for backends that prefer them
        first_name:
          values.member_name?.trim()?.split(/\s+/)[0] || undefined,
        last_name:
          values.member_name?.trim()?.split(/\s+/).slice(1).join(' ') || undefined,
        birth_date: values.member_dob?.trim() || undefined,
        
        // NEW: Include provider information
        provider_name: values.provider_name?.trim() || undefined,
        provider_npi: values.provider_npi?.trim() || undefined,
      }
      
      console.log('[DEBUG] Final payload for prior auth request:', payload)
      
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
    } catch (err) {
      console.error('[DEBUG] Error in onSubmit:', err)
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
          {step === 'Member' && <MemberStep createNewPatient={createNewPatient} setCreateNewPatient={setCreateNewPatient} />}
          {step === 'Provider' && <ProviderStep />}
          {step === 'Procedure' && <ProcedureStep />}
          {step === 'Review' && <ReviewStep createNewPatient={createNewPatient} />}

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

function MemberStep({ createNewPatient, setCreateNewPatient }: { createNewPatient: boolean; setCreateNewPatient: (value: boolean) => void }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium mb-1">Member</h2>
        
        {/* Toggle for creating new patient */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="createNewPatient"
            checked={createNewPatient}
            onChange={(e) => setCreateNewPatient(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="createNewPatient" className="text-sm font-medium">
            Create new patient
          </label>
        </div>
        
        {createNewPatient ? (
          <>
            <Field name="member_name" label="Name *" placeholder="John Smith" />
            <Field name="member_dob" label="DOB *" placeholder="YYYY-MM-DD" />
            <p className="text-xs text-gray-500">* A new patient will be created with this information</p>
          </>
        ) : (
          <>
            <Field name="member_name" label="Name" placeholder="Jane Doe" />
            <Field name="member_id" label="Member ID" placeholder="M12345" />
            <Field name="member_dob" label="DOB" placeholder="YYYY-MM-DD" />
          </>
        )}
      </div>
      <div className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium mb-1">Coverage</h2>
        {!createNewPatient && (
          <Field name="patient_id" label="Patient ID *" placeholder="patient-123" />
        )}
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

function ReviewStep({ createNewPatient }: { createNewPatient: boolean }) {
  const { getValues } = useFormContext<FormValues>()
  const v = getValues()
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4">
        <h3 className="font-medium mb-2">Member</h3>
        <Item k="Name" v={v.member_name} />
        {!createNewPatient && <Item k="Member ID" v={v.member_id} />}
        <Item k="DOB" v={v.member_dob} />
        {!createNewPatient && <Item k="Patient ID *" v={v.patient_id} />}
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
