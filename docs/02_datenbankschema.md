# 02 — Datenbankschema

---

## Überblick

KICO nutzt Supabase (managed PostgreSQL) als Datenbankschicht. Das Schema ist bewusst minimal gehalten: Nur die Daten, die für den Coaching-Betrieb zwingend notwendig sind, werden gespeichert.

**Projekt-Referenz:** `rccugewhmscysohzewfw.supabase.co` (siehe Korrektur in [06_deployment.md](06_deployment.md) — ein früherer Projektwechsel war in der Doku nicht nachgezogen).

> **Befund (Juli 2026, per Supabase-MCP verifiziert):** Der Live-Schema-Stand wurde erstmals direkt gegen die Datenbank geprüft, nicht nur gegen die Migrationsdateien. Dabei zeigte sich, dass `list_migrations` zuvor **null Migrationen** als getrackt auswies — die SQL-Dateien wurden offenbar per Copy-Paste im SQL-Editor ausgeführt (wie ihre eigenen Kommentare anweisen), nicht über die Supabase-CLI mit Migrationshistorie. Dabei war `002_add_firstname.sql` auf diesem Projekt **nie ausgeführt worden**: Die Spalten `profiles.first_name` und `sessions.message_count` fehlten live. Das machte den Vorname-Onboarding-Flow faktisch defekt — jeder neue Account blieb am Onboarding-Screen hängen, weil das `first_name`-Update gegen eine nicht existierende Spalte lief. Die Migration wurde daraufhin über das MCP-Tool `apply_migration` sauber nachgezogen (jetzt als `20260728124359` in der Supabase-Migrationshistorie getrackt) und der Fehler damit behoben. Diese Diskrepanz zwischen dokumentiertem und tatsächlichem Schema-Stand ist ein Beispiel dafür, warum Live-Verifikation (statt reines Vertrauen auf Migrationsdateien) Teil der Entwicklungsroutine werden sollte.

---

## Tabellen

### `profiles`
Wird automatisch beim Registrieren angelegt (via Datenbank-Trigger).

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid (PK) | Entspricht `auth.users.id` |
| `email` | text | E-Mail-Adresse der Nutzerin |
| `first_name` | text | Vorname (nullable; wird im Onboarding einmalig abgefragt) |
| `created_at` | timestamptz | Registrierungszeitpunkt |
| `updated_at` | timestamptz | Letzte Änderung |

**Onboarding-Flow:** Beim ersten Login ist `first_name` null. Das Dashboard erkennt das und zeigt eine Maske „Wie darf ich dich nennen?". Nach Eingabe wird `profiles.first_name` per Client-Update gesetzt — kein separater API-Endpunkt nötig (RLS erlaubt eigene Zeile zu schreiben). Migration: `002_add_firstname.sql`.

### `sessions`
Eine Coaching-Session pro Gespräch. Jeder Klick auf „Session starten" im Dashboard erzeugt eine neue Session.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid (PK) | Session-ID |
| `user_id` | uuid (FK) | Verweis auf `auth.users` |
| `title` | text | Optionaler Titel (zukünftig: automatisch generiert) |
| `created_at` | timestamptz | Sessionbeginn |
| `ended_at` | timestamptz | Sessionende (optional) |
| `message_count` | integer, default 0 | Aus Migration 002 — aktuell ungenutzt: Der Code berechnet die Nachrichtenzahl clientseitig aus den geladenen Nachrichten ([app/(dashboard)/session/page.tsx](../app/(dashboard)/session/page.tsx)), die DB-Spalte wird nicht befüllt. Kandidat für spätere Bereinigung oder tatsächliche Nutzung. |

### `messages`
Jede einzelne Nachricht einer Session — sowohl von der Nutzerin als auch von KICO.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid (PK) | Nachrichten-ID |
| `session_id` | uuid (FK) | Verweis auf `sessions` |
| `user_id` | uuid (FK) | Verweis auf `auth.users` |
| `role` | text | `'user'` oder `'assistant'` |
| `content` | text | Nachrichteninhalt |
| `created_at` | timestamptz | Zeitstempel |

---

## Row Level Security (RLS)

Alle drei Tabellen haben RLS aktiviert. Die Richtlinie ist identisch:

> Eine Nutzerin kann ausschließlich Zeilen lesen und schreiben, bei denen `user_id = auth.uid()` gilt.

Das bedeutet: Selbst bei einem hypothetischen Datenleck auf Datenbankebene wären die Coaching-Gespräche anderer Nutzerinnen nicht zugänglich.

---

## Trigger: Automatische Profilerstellung

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
```

Dieser Trigger läuft nach jeder Neuregistrierung in `auth.users` und legt automatisch ein Profil an — ohne dass die Anwendung einen separaten API-Call machen muss.

---

## Datenschutzüberlegungen

- Coaching-Gespräche sind inhärent sensibel. RLS stellt sicher, dass keine Session-Daten über andere Nutzerinnen einsehbar sind.
- Es werden keine Drittanbieter-Analytics, keine Tracking-Pixel und keine externen Fonts ohne Datenschutzgrundlage eingebunden.
- Nachrichten werden derzeit dauerhaft gespeichert, um Gesprächskontinuität zu ermöglichen. Eine automatische Löschfunktion (z.B. nach 90 Tagen) ist als zukünftiges Feature vorgesehen.

---

## Bekannte Absicherungspunkte (Supabase-Security-Advisor, Juli 2026)

Niedrige Priorität, aber vermerkt statt stillschweigend übergangen:

- `handle_new_user()` (der Profil-Anlage-Trigger, siehe oben) ist als `SECURITY DEFINER`-Funktion auch direkt per RPC von den Rollen `anon` und `authenticated` aufrufbar, nicht nur als Trigger. Empfehlung: `EXECUTE`-Recht widerrufen, sofern kein direkter Aufruf beabsichtigt ist.
- Leaked-Password-Protection (Abgleich gegen HaveIBeenPwned) ist in Supabase Auth deaktiviert. Da KICO ausschließlich passwortlosen OTP-Login nutzt (kein Passwort-Feld im Flow), ist die praktische Relevanz gering, aber nicht null (Supabase Auth erlaubt Passwort-Login grundsätzlich, falls er je aktiviert würde).
