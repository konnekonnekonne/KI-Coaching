'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo, Button, Input } from '@/components/ui'

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
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="bg-surface border border-border rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="heading-3 mb-2">Check deine E-Mails</h2>
          <p className="body-text text-muted mb-6">
            Wir haben dir einen Bestätigungslink geschickt. Klick darauf, um dein Konto zu aktivieren.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">Zur Anmeldung</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo size={32} subline="Dein KI-Coach" /></Link>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="heading-3 mb-6">Konto erstellen</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-Mail"
              type="email"
              required
              autoComplete="email"
              placeholder="du@beispiel.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              label="Passwort"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="Mindestens 8 Zeichen"
              hint="Mindestens 8 Zeichen"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={error ?? undefined}
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Registrieren
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="caption text-center mt-5">
          Bereits registriert?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
