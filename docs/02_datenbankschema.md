# 02 — Datenbankschema

---

## Überblick

KICO nutzt Supabase (managed PostgreSQL) als Datenbankschicht. Das Schema ist bewusst minimal gehalten: Nur die Daten, die für den Coaching-Betrieb zwingend notwendig sind, werden gespeichert.

---

## Tabellen

### `profiles`
Wird automatisch beim Registrieren angelegt (via Datenbank-Trigger).

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid (PK) | Entspricht `auth.users.id` |
| `email` | text | E-Mail-Adresse der Nutzerin |
| `created_at` | timestamptz | Registrierungszeitpunkt |
| `updated_at` | timestamptz | Letzte Änderung |

### `sessions`
Eine Coaching-Session pro Gespräch. Aktuell wird pro Tag eine Session angelegt.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid (PK) | Session-ID |
| `user_id` | uuid (FK) | Verweis auf `auth.users` |
| `title` | text | Optionaler Titel (zukünftig: automatisch generiert) |
| `created_at` | timestamptz | Sessionbeginn |
| `ended_at` | timestamptz | Sessionende (optional) |

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
