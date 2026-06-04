'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo, Button, Input } from '@/components/ui'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setState(error ? 'error' : 'sent')
  }

  if (state === 'sent') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="bg-surface border border-border rounded-2xl p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h2 className="heading-3 mb-2">Schau in dein Postfach</h2>
          <p className="body-text text-muted">
            Wir haben einen Anmeldelink an <strong>{email}</strong> geschickt. Klick darauf, um fortzufahren.
          </p>
          <p className="caption text-muted mt-4">
            Kein Link angekommen?{' '}
            <button
              onClick={() => setState('idle')}
              className="text-primary hover:underline"
            >
              Erneut senden
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <Link href="/"><Logo size={32} subline="Dein KI-Coach" /></Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="heading-3 mb-2">Anmelden</h1>
          <p className="body-text text-muted mb-6">
            Gib deine E-Mail-Adresse ein — wir schicken dir einen Anmeldelink.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-Mail"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="du@beispiel.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={state === 'error' ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' : undefined}
            />
            <Button type="submit" loading={state === 'loading'} className="mt-2 w-full">
              Anmeldelink senden
            </Button>
          </form>
        </div>

        <p className="caption text-center mt-5 text-muted">
          Kein Konto? Einfach E-Mail eingeben — wir erstellen es automatisch.
        </p>
      </div>
    </div>
  )
}
