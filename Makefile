.PHONY: help up down restart build logs logs-db shell shell-db db-reset seed migrate studio deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (build + migrate + start)
	docker compose up --build -d
	@echo "Waiting for database..."
	@sleep 5
	docker compose exec app npx prisma migrate deploy
	@echo "Done! App running at http://localhost:3000"

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose down
	docker compose up --build -d
	@echo "Waiting for database..."
	@sleep 5
	docker compose exec app npx prisma migrate deploy

build: ## Build without starting
	docker compose build

logs: ## Tail app logs
	docker compose logs -f app

logs-db: ## Tail database logs
	docker compose logs -f db

shell: ## Open shell in app container
	docker compose exec app sh

shell-db: ## Open psql in database container
	docker compose exec db psql -U postgres -d nestjs_boilerplate

db-reset: ## Stop, wipe database volume, and restart
	docker compose down -v
	docker compose up --build -d
	@echo "Waiting for database..."
	@sleep 5
	docker compose exec app npx prisma migrate deploy

seed: ## Run prisma seed inside app container
	docker compose exec app npx tsx prisma/seed.ts

migrate: ## Run prisma migrate inside app container
	docker compose exec app npx prisma migrate deploy

studio: ## Run prisma studio (port 5555)
	docker compose exec -p 5555:5555 app npx prisma studio

deploy: ## Pull latest code, rebuild & restart
	git pull
	docker compose up --build -d
	@echo "Waiting for database..."
	@sleep 5
	docker compose exec app npx prisma migrate deploy
	@echo "Deploy done!"
