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


def write_message(session_id: str, user_id: str, role: str, content: str) -> None:
    """Schreibt eine Nachricht in die messages-Tabelle — dieselbe Tabelle,
    die auch der Textmodus nutzt (siehe app/api/chat/route.ts)."""
    if not content.strip():
        return
    get_client().table("messages").insert({
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
    }).execute()
