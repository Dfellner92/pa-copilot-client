'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const form = new FormData()
        form.set('username', username)
        form.set('password', password)
        const res = await fetch('/api/auth/token', { method: 'POST', body: form })
        setLoading(false)
        if (res.ok) window.location.href = '/dashboard'
        else setError('Invalid credentials')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-4">
                <form onSubmit={onSubmit} className="border rounded-2xl p-6 space-y-4">
                    <h1 className="text-2xl font-semibold">Sign in</h1>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input className="input" placeholder="Email" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="btn w-full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Continue'}</button>
                </form>
                
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}