'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo, Button, Input } from '@/components/ui'

type Step = 'email' | 'code'
type State = 'idle' | 'loading' | 'error'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg(null)

    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setErrorMsg(error.message)
      setState('error')
    } else {
      setState('idle')
      setStep('code')
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    if (error) {
      setErrorMsg('Ungültiger oder abgelaufener Code. Bitte erneut versuchen.')
      setState('error')
    } else {
      router.push('/session')
    }
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">

          <div className="flex justify-center mb-8">
            <Link href="/"><Logo size={32} subline="Forschungsprototyp" /></Link>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-8">

            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>

            <h1 className="heading-3 mb-2 text-center">Code eingeben</h1>
            <p className="body-text text-muted mb-6 text-center">
              Wir haben einen Code an <strong>{email}</strong> geschickt.
            </p>

            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
              <Input
                label="Code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                required
                autoFocus
                placeholder="12345678"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                error={state === 'error' ? (errorMsg ?? undefined) : undefined}
              />
              <Button type="submit" loading={state === 'loading'} className="mt-2 w-full">
                Anmelden
              </Button>
            </form>
          </div>

          <p className="caption text-center mt-5 text-muted">
            Kein Code angekommen?{' '}
            <button
              onClick={() => { setStep('email'); setCode(''); setState('idle'); setErrorMsg(null) }}
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
          <Link href="/"><Logo size={32} subline="Forschungsprototyp" /></Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="heading-3 mb-2">Anmelden</h1>
          <p className="body-text text-muted mb-6">
            Gib deine E-Mail-Adresse ein — wir schicken dir einen Code.
          </p>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <Input
              label="E-Mail"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="du@beispiel.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={state === 'error' ? (errorMsg ?? undefined) : undefined}
            />
            <Button type="submit" loading={state === 'loading'} className="mt-2 w-full">
              Code senden
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
