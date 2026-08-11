"""
Supabase-Anbindung fuer den Voice-Agent.

Nutzt den SUPABASE_SERVICE_ROLE_KEY (nicht den anon-Key) — der Bot ist ein
vertrauenswuerdiger Server-Prozess ohne eigene Nutzer-Session, umgeht damit
bewusst RLS und traegt session_id/user_id explizit in jeder Schreiboperation,
statt sich auf auth.uid() zu verlassen.
"""

import os
from collections.abc import Callable

from supabase import AsyncClient, Client, create_async_client, create_client

_client: Client | None = None
_async_client: AsyncClient | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


async def get_async_client() -> AsyncClient:
    global _async_client
    if _async_client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _async_client = await create_async_client(url, key)
    return _async_client


def write_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    risk_level: str | None = None,
    risk_terms: list[str] | None = None,
) -> None:
    """Schreibt eine Nachricht in die messages-Tabelle — dieselbe Tabelle,
    die auch der Textmodus nutzt (siehe app/api/chat/route.ts)."""
    if not content.strip():
        return
    row = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
    }
    if risk_level is not None:
        row["risk_level"] = risk_level
    if risk_terms:
        row["risk_terms"] = risk_terms
    get_client().table("messages").insert(row).execute()


def upsert_anchor(session_id: str, user_id: str, key: str, label: str, kind: str, value) -> None:
    """Speichert/aktualisiert einen persistenten Anker (B-23, docs/backlog.md)."""
    get_client().table("session_anchors").upsert(
        {
            "session_id": session_id,
            "user_id": user_id,
            "key": key,
            "label": label,
            "kind": kind,
            "value": value,
            "awaiting_input": False,
        },
        on_conflict="session_id,key",
    ).execute()


def request_anchor_input(session_id: str, user_id: str, key: str, label: str, prompt: str) -> None:
    """Oeffnet eine leere Anker-Karte, die der COACHEE selbst fuellt -- Erweiterung
    von B-23 (29./30. Juli 2026, siehe lib/anchors.ts fuer die Text-Spiegelung
    und docs/backlog.md fuer die Begruendung). Das Frontend rendert bei
    awaiting_input=True/value=null ein Eingabefeld statt eines fertigen Werts."""
    get_client().table("session_anchors").upsert(
        {
            "session_id": session_id,
            "user_id": user_id,
            "key": key,
            "label": label,
            "kind": "text",
            "value": None,
            "prompt": prompt,
            "awaiting_input": True,
        },
        on_conflict="session_id,key",
    ).execute()


async def watch_anchor_submissions(session_id: str, on_submitted: Callable[[str], None]) -> None:
    """Abonniert Supabase Realtime auf UPDATE-Events der session_anchors-
    Zeilen dieser Session -- die Realtime-Bridge fuer den Pause-Mechanismus
    aus anchor_pause.py (B-23, 30. Juli 2026). Ruft on_submitted(key) auf,
    sobald eine Karte tatsaechlich abgeschickt wurde (awaiting_input wechselt
    auf False, value ist gesetzt) -- nicht bei jedem beliebigen Update, damit
    ein set_anchor-Aufruf auf einen anderen key nicht versehentlich eine
    laufende Pause beendet. Laeuft als Hintergrund-Task fuer die gesamte
    Sessiondauer, siehe run_bot in bot.py."""
    client = await get_async_client()
    channel = client.channel(f"anchor-pause-{session_id}")

    def _on_update(payload: dict) -> None:
        row = (payload.get("data") or {}).get("record") or {}
        if row.get("awaiting_input") is False and row.get("value") is not None:
            key = row.get("key")
            if key:
                on_submitted(key)

    channel.on_postgres_changes(
        "UPDATE",
        callback=_on_update,
        table="session_anchors",
        schema="public",
        filter=f"session_id=eq.{session_id}",
    )
    await channel.subscribe()
