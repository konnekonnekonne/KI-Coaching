"""
Supabase-Anbindung fuer den Voice-Agent.

Nutzt den SUPABASE_SERVICE_ROLE_KEY (nicht den anon-Key) — der Bot ist ein
vertrauenswuerdiger Server-Prozess ohne eigene Nutzer-Session, umgeht damit
bewusst RLS und traegt session_id/user_id explizit in jeder Schreiboperation,
statt sich auf auth.uid() zu verlassen.
"""

import os
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


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
