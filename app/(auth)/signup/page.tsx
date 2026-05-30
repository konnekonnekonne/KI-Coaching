'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h2 className="text-xl font-semibold text-[--foreground]">Check deine E-Mails</h2>
          <p className="text-[--muted]">
            Wir haben dir einen Bestätigungslink geschickt. Klick darauf, um dein Konto zu aktivieren.
          </p>
          <Link href="/login" className="text-[--accent] font-medium hover:underline">
            Zur Anmeldung
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[--accent]">
            kico
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-[--foreground]">
            Konto erstellen
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[--foreground] mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[--border] bg-[--surface] px-4 py-2.5 text-[--foreground] placeholder:text-[--muted] focus:outline-none focus:ring-2 focus:ring-[--accent]"
              placeholder="du@beispiel.de"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[--foreground] mb-1">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[--border] bg-[--surface] px-4 py-2.5 text-[--foreground] placeholder:text-[--muted] focus:outline-none focus:ring-2 focus:ring-[--accent]"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[--accent] px-4 py-3 text-white font-medium hover:bg-[--accent-light] transition-colors disabled:opacity-50"
          >
            {loading ? 'Lädt…' : 'Registrieren'}
          </button>
        </form>

        <p className="text-center text-sm text-[--muted]">
          Bereits registriert?{' '}
          <Link href="/login" className="text-[--accent] font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  )
}
