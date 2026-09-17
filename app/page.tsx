import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/ui'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">

      {/* ── Navigation — ganz dezent, kein Header-Box ── */}
      <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <div className="opacity-30">
          <Logo size={20} showWordmark={false} />
        </div>
        <Link
          href="/login"
          className="caption text-muted/60 hover:text-muted transition-colors"
        >
          Anmelden
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6">

        {/* ── Hero ── */}
        <section className="min-h-[70vh] flex flex-col justify-center pt-24 pb-12">

          <p className="caption text-muted/50 mb-8 tracking-widest uppercase">
            Forschungsprototyp · INA CCW · 2026
          </p>

          <h1 className="display mb-6">
            Ein Raum<br />
            zum Denken.
          </h1>

          <p className="body-text text-muted max-w-sm mb-14 leading-relaxed">
            KICO begleitet dich durch systemisches Selbst­coaching —
            mit Fragen, die öffnen statt schließen.
          </p>

          <Link
            href="/login"
            className="display text-primary hover:text-primary-dark transition-colors leading-tight cursor-pointer"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 2.75rem)' }}
          >
            Jetzt beginnen →
          </Link>
        </section>

        {/* ── Warum ── */}
        <section className="border-t border-border pt-12 pb-16">
          <p className="label-text mb-3">Warum</p>
          <p className="body-text text-muted leading-relaxed">
            Millionen Menschen sprechen heute schon mit KI über das, was sie
            bewegt — beruflich, persönlich, manchmal in Krisen. Allgemeine
            Sprachmodelle sind darauf nicht ausgelegt: keine Methodik, keine
            eingebaute Krisenerkennung, keine Vorstellung davon, wo ein
            Gespräch gerade steht. KICO untersucht, was sich ändert, wenn
            Coaching-Methodik die Architektur bestimmt — nicht das Modell.
          </p>
        </section>

        {/* ── Was KICO ist ── */}
        <section className="border-t border-border pt-12 pb-16 space-y-10">

          <div>
            <p className="label-text mb-3">Methode</p>
            <p className="body-text text-muted leading-relaxed">
              KICO arbeitet mit Werkzeugen aus dem INA&nbsp;CCW-Curriculum —
              U-Modell, systemische Fragen, Auftragsklärung. Kein Ratgeber,
              kein Therapeut. Ein Spiegel.
            </p>
          </div>

          <div>
            <p className="label-text mb-3">Format</p>
            <p className="body-text text-muted leading-relaxed">
              Schreiben oder sprechen — du wählst, wie du denkst.
              Beide Wege führen in denselben methodischen Rahmen.
            </p>
          </div>

          <div>
            <p className="label-text mb-3">Grenzen</p>
            <p className="body-text text-muted leading-relaxed">
              Ein zentrales Forschungsziel ist zu verstehen, was KI im Coaching
              nicht kann — und warum. KICO macht diese Grenzen sichtbar,
              statt sie zu verstecken.
            </p>
          </div>
        </section>

        {/* ── Forschungskontext ── */}
        <section className="border-t border-border pt-12 pb-16">
          <p className="label-text mb-6">Hintergrund</p>
          <p className="body-text text-muted leading-relaxed mb-6">
            Entstanden als Abschlussarbeit von Henrike Thomsen & Konstantin Escher
            im systemischen Business Coaching. Kein kommerzielles Produkt —
            ein Forschungsprojekt für einen geschlossenen Teilnehmerkreis.
          </p>
          <a
            href="https://inaccw.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block opacity-40 hover:opacity-70 transition-opacity mb-8"
          >
            <Image
              src="https://inaccw.org/wp-content/uploads/2021/08/logo.svg"
              alt="INA CCW Coaching Akademie Berlin"
              width={120}
              height={32}
              unoptimized
            />
          </a>

          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <a
              href="https://github.com/konnekonnekonne/KI-Coaching"
              target="_blank"
              rel="noopener noreferrer"
              className="caption text-primary hover:text-primary-dark transition-colors"
            >
              Quellcode & technische Dokumentation →
            </a>
            <a
              href="/abschlussarbeit-ki-im-coaching.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="caption text-primary hover:text-primary-dark transition-colors"
            >
              Die Abschlussarbeit lesen →
            </a>
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section className="border-t border-border py-10">
          <p className="caption text-muted/50 leading-relaxed">
            KICO ersetzt keine Psychotherapie oder professionelle Beratung.
            Bei psychischen Krisen: Telefonseelsorge{' '}
            <a href="tel:08001110111" className="text-primary hover:text-primary-dark transition-colors">
              0800 111 0 111
            </a>{' '}
            — kostenlos, 24/7.
          </p>
        </section>

      </main>
    </div>
  )
}
