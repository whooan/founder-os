.PHONY: start backend frontend install

start: backend frontend

backend:
	cd backend && PYTHONPATH=src uv run uvicorn app.main:app --reload --port 8000 &

frontend:
	cd frontend && pnpm dev &

install:
	cd backend && uv sync
	cd frontend && pnpm install
