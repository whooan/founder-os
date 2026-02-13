.PHONY: start backend frontend install docker docker-build docker-down reset-db

# --- Local development ---

start: backend frontend

backend:
	cd backend && PYTHONPATH=src uv run uvicorn app.main:app --reload --port 8000 &

frontend:
	cd frontend && pnpm dev &

install:
	cd backend && uv sync
	cd frontend && pnpm install

# --- Docker ---

docker:
	docker compose up --build

docker-build:
	docker compose build

docker-down:
	docker compose down

# --- Database ---

reset-db:
	rm -f backend/founderos.db
	@echo "Database deleted. It will be recreated on next backend start."
