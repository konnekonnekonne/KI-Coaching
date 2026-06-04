import { redirect } from 'next/navigation'

// Signup und Login sind mit Magic Link identisch.
// Alle Wege führen zur Login-Seite.
export default function SignupPage() {
  redirect('/login')
}
