# KICO Voice-Agent (Pipecat Cloud)

Cascaded-Voice-Pipeline: Deepgram STT (EU) → Claude Sonnet → Deepgram TTS (EU).
Architektur-Begründung: [`docs/10_architekturentscheidung-voice-cascaded.md`](../docs/10_architekturentscheidung-voice-cascaded.md).

Der Code in diesem Verzeichnis wurde gegen die tatsächlich installierte
`pipecat-ai`-Version (1.6.0) geprüft (Import-Test erfolgreich) — kein
spekulativer Code mehr.

## Lokal ausführen

```bash
uv sync
cp .env.example .env
# .env mit den echten Werten aus dem Pipecat-Cloud Secret-Set "kico" füllen
uv run bot.py
```

## Deployen

```bash
uv run pipecat cloud deploy
```

Das baut das Docker-Image und registriert es beim bereits im Dashboard
angelegten Agent `kico`.

## Secrets (liegen in Pipecat Cloud, Secret-Set "kico")

- `DEEPGRAM_API_KEY`, `DEEPGRAM_VOICE_ID`
- `ANTHROPIC_API_KEY` (eigener Key, getrennt vom Netlify-Key)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `DAILY_API_KEY` (nur für lokale Tests nötig)
