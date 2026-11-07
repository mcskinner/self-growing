.PHONY: install dev check test build format

install:
	uv sync
	npm ci

dev: install
	uv run python scripts/dev.py

check:
	uv run ruff check .
	uv run ruff format --check .
	npm run check

test:
	uv run pytest
	npm test

build:
	npm run build

format:
	uv run ruff check --fix .
	uv run ruff format .
