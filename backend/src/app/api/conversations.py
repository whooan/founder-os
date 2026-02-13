"""Conversations CRUD router for persistent chat memory."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.database import get_session
from app.models.conversation import Conversation

router = APIRouter()


class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    company_id: str | None = None


class MessageInput(BaseModel):
    question: str
    company_id: str | None = None


@router.post("/", status_code=201)
async def create_conversation(data: ConversationCreate, session=Depends(get_session)):
    conv = Conversation(title=data.title, company_id=data.company_id)
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return {
        "id": conv.id,
        "title": conv.title,
        "company_id": conv.company_id,
        "messages": [],
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
    }


@router.get("/")
async def list_conversations(session=Depends(get_session)):
    stmt = select(Conversation).order_by(Conversation.updated_at.desc())
    result = await session.execute(stmt)
    convs = result.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "company_id": c.company_id,
            "message_count": len(json.loads(c.messages or "[]")),
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in convs
    ]


@router.get("/{conv_id}")
async def get_conversation(conv_id: str, session=Depends(get_session)):
    stmt = select(Conversation).where(Conversation.id == conv_id)
    result = await session.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "id": conv.id,
        "title": conv.title,
        "company_id": conv.company_id,
        "messages": json.loads(conv.messages or "[]"),
        "created_at": conv.created_at.isoformat() if conv.created_at else None,
        "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
    }


@router.post("/{conv_id}/messages")
async def add_message(conv_id: str, data: MessageInput, session=Depends(get_session)):
    """Send a message — runs AI with history and appends both messages."""
    stmt = select(Conversation).where(Conversation.id == conv_id)
    result = await session.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = json.loads(conv.messages or "[]")

    # Add user message
    user_msg = {
        "role": "user",
        "content": data.question,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    messages.append(user_msg)

    # Call ask_intelligence with conversation history
    from app.intelligence.ask import ask_intelligence_with_history

    response = await ask_intelligence_with_history(
        question=data.question,
        company_id=data.company_id or conv.company_id,
        history=messages[-20:],  # Last 20 messages for context
        session=session,
    )

    assistant_msg = {
        "role": "assistant",
        "content": response.answer,
        "sources": response.sources,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    messages.append(assistant_msg)

    conv.messages = json.dumps(messages)

    # Auto-title from first user message
    if len([m for m in messages if m["role"] == "user"]) == 1:
        conv.title = data.question[:80]

    await session.commit()

    return assistant_msg


@router.delete("/{conv_id}", status_code=204)
async def delete_conversation(conv_id: str, session=Depends(get_session)):
    stmt = select(Conversation).where(Conversation.id == conv_id)
    result = await session.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await session.delete(conv)
    await session.commit()
