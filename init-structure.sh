#!/usr/bin/env bash
# ============================================================================
# Script: init-structure.sh
# Purpose: Create the complete folder & file scaffolding for ComputerStoreAI
# Architecture: Monorepo (frontend Next.js + backend Node.js/Express + Prisma)
# Usage:   bash init-structure.sh
# ============================================================================

set -euo pipefail

# Resolve project root (script location)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="ComputerStoreAI"

echo ">> Creating monorepo structure at: ${ROOT_DIR}/${PROJECT_NAME}"

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
create_dir() {
    mkdir -p "$1"
    echo "   [DIR]  $1"
}

touch_file() {
    mkdir -p "$(dirname "$1")"
    touch "$1"
    echo "   [FILE] $1"
}

# ---------------------------------------------------------------------------
# Root + monorepo folders
# ---------------------------------------------------------------------------
create_dir "${PROJECT_NAME}"
create_dir "${PROJECT_NAME}/frontend"
create_dir "${PROJECT_NAME}/backend"

# ---------------------------------------------------------------------------
# FRONTEND - Next.js (App Router) + Tailwind + Zustand + TS
# ---------------------------------------------------------------------------
FE="${PROJECT_NAME}/frontend"

create_dir "${FE}/public"
create_dir "${FE}/src/app"
create_dir "${FE}/src/app/\(customer\)/products"
create_dir "${FE}/src/app/\(customer\)/cart"
create_dir "${FE}/src/app/\(admin\)/dashboard"
create_dir "${FE}/src/app/\(admin\)/orders"
create_dir "${FE}/src/app/api"

create_dir "${FE}/src/components/ui"
create_dir "${FE}/src/components/layout"
create_dir "${FE}/src/components/product"

create_dir "${FE}/src/hooks"
create_dir "${FE}/src/store"
create_dir "${FE}/src/services"
create_dir "${FE}/src/types"
create_dir "${FE}/src/lib"
create_dir "${FE}/src/styles"

# Customer routes
touch_file "${FE}/src/app/\(customer\)/page.tsx"
touch_file "${FE}/src/app/\(customer\)/layout.tsx"
touch_file "${FE}/src/app/\(customer\)/products/page.tsx"
touch_file "${FE}/src/app/\(customer\)/products/[slug]/page.tsx"
touch_file "${FE}/src/app/\(customer\)/cart/page.tsx"

# Admin routes
touch_file "${FE}/src/app/\(admin\)/dashboard/page.tsx"
touch_file "${FE}/src/app/\(admin\)/dashboard/layout.tsx"
touch_file "${FE}/src/app/\(admin\)/orders/page.tsx"
touch_file "${FE}/src/app/\(admin\)/orders/[id]/page.tsx"

# Root app files
touch_file "${FE}/src/app/layout.tsx"
touch_file "${FE}/src/app/page.tsx"
touch_file "${FE}/src/app/globals.css"
touch_file "${FE}/src/app/not-found.tsx"
touch_file "${FE}/src/app/error.tsx"
touch_file "${FE}/src/app/loading.tsx"

# Components
touch_file "${FE}/src/components/ui/Button.tsx"
touch_file "${FE}/src/components/ui/Input.tsx"
touch_file "${FE}/src/components/ui/Card.tsx"
touch_file "${FE}/src/components/ui/Badge.tsx"
touch_file "${FE}/src/components/ui/Modal.tsx"

touch_file "${FE}/src/components/layout/Header.tsx"
touch_file "${FE}/src/components/layout/Footer.tsx"
touch_file "${FE}/src/components/layout/Sidebar.tsx"
touch_file "${FE}/src/components/layout/Navbar.tsx"

touch_file "${FE}/src/components/product/ProductCard.tsx"
touch_file "${FE}/src/components/product/ProductGrid.tsx"
touch_file "${FE}/src/components/product/ProductFilter.tsx"
touch_file "${FE}/src/components/product/ProductDetail.tsx"

# Hooks (custom React hooks)
touch_file "${FE}/src/hooks/useProducts.ts"
touch_file "${FE}/src/hooks/useCart.ts"
touch_file "${FE}/src/hooks/useAuth.ts"
touch_file "${FE}/src/hooks/useDebounce.ts"

# Zustand stores
touch_file "${FE}/src/store/cart.store.ts"
touch_file "${FE}/src/store/auth.store.ts"
touch_file "${FE}/src/store/ui.store.ts"

# API service layer (talks to backend)
touch_file "${FE}/src/services/product.service.ts"
touch_file "${FE}/src/services/auth.service.ts"
touch_file "${FE}/src/services/order.service.ts"
touch_file "${FE}/src/services/http.client.ts"

# Types
touch_file "${FE}/src/types/product.type.ts"
touch_file "${FE}/src/types/user.type.ts"
touch_file "${FE}/src/types/order.type.ts"
touch_file "${FE}/src/types/api.type.ts"

# Lib (helpers, utils)
touch_file "${FE}/src/lib/utils.ts"
touch_file "${FE}/src/lib/constants.ts"
touch_file "${FE}/src/lib/formatters.ts"
touch_file "${FE}/src/lib/validators.ts"

# Frontend root configs
touch_file "${FE}/package.json"
touch_file "${FE}/tsconfig.json"
touch_file "${FE}/next.config.js"
touch_file "${FE}/tailwind.config.ts"
touch_file "${FE}/postcss.config.js"
touch_file "${FE}/next-env.d.ts"
touch_file "${FE}/.eslintrc.json"
touch_file "${FE}/.env.example"
touch_file "${FE}/README.md"

# ---------------------------------------------------------------------------
# BACKEND - Node.js + Express + Prisma + MySQL (Layered Architecture)
#   Routes -> Controllers -> Services -> Prisma Client
# ---------------------------------------------------------------------------
BE="${PROJECT_NAME}/backend"

create_dir "${BE}/prisma"
create_dir "${BE}/src/config"
create_dir "${BE}/src/controllers"
create_dir "${BE}/src/services"
create_dir "${BE}/src/repositories"
create_dir "${BE}/src/routes"
create_dir "${BE}/src/routes/v1"
create_dir "${BE}/src/middlewares"
create_dir "${BE}/src/utils"
create_dir "${BE}/src/validators"
create_dir "${BE}/src/constants"
create_dir "${BE}/src/utils/errors"
create_dir "${BE}/tests/unit"
create_dir "${BE}/tests/integration"
create_dir "${BE}/uploads"

# Config
touch_file "${BE}/src/config/database.js"
touch_file "${BE}/src/config/env.js"
touch_file "${BE}/src/config/cors.js"
touch_file "${BE}/src/config/cloudinary.js"

# Controllers (HTTP layer - request/response only)
touch_file "${BE}/src/controllers/auth.controller.js"
touch_file "${BE}/src/controllers/product.controller.js"
touch_file "${BE}/src/controllers/order.controller.js"
touch_file "${BE}/src/controllers/user.controller.js"

# Services (business logic - NO req/res here)
touch_file "${BE}/src/services/auth.service.js"
touch_file "${BE}/src/services/product.service.js"
touch_file "${BE}/src/services/order.service.js"
touch_file "${BE}/src/services/token.service.js"

# Repositories (data access - Prisma queries isolated here)
touch_file "${BE}/src/repositories/product.repository.js"
touch_file "${BE}/src/repositories/user.repository.js"
touch_file "${BE}/src/repositories/order.repository.js"

# Routes (versioned API)
touch_file "${BE}/src/routes/v1/index.js"
touch_file "${BE}/src/routes/v1/auth.route.js"
touch_file "${BE}/src/routes/v1/product.route.js"
touch_file "${BE}/src/routes/v1/order.route.js"

# Middlewares
touch_file "${BE}/src/middlewares/error.middleware.js"
touch_file "${BE}/src/middlewares/auth.middleware.js"
touch_file "${BE}/src/middlewares/validate.middleware.js"
touch_file "${BE}/src/middlewares/rateLimit.middleware.js"
touch_file "${BE}/src/middlewares/requestLogger.middleware.js"

# Utils
touch_file "${BE}/src/utils/catchAsync.js"
touch_file "${BE}/src/utils/ApiError.js"
touch_file "${BE}/src/utils/logger.js"
touch_file "${BE}/src/utils/pick.js"
touch_file "${BE}/src/utils/pagination.js"
touch_file "${BE}/src/utils/errors/notFoundError.js"
touch_file "${BE}/src/utils/errors/validationError.js"

# Validators (request payload schemas - e.g. Joi/Zod)
touch_file "${BE}/src/validators/auth.validator.js"
touch_file "${BE}/src/validators/product.validator.js"

# Constants
touch_file "${BE}/src/constants/roles.js"
touch_file "${BE}/src/constants/orderStatus.js"
touch_file "${BE}/src/constants/index.js"

# Prisma
touch_file "${BE}/prisma/schema.prisma"
touch_file "${BE}/prisma/seed.js"

# Entry point
touch_file "${BE}/server.js"
touch_file "${BE}/app.js"

# Backend root configs
touch_file "${BE}/package.json"
touch_file "${BE}/.env.example"
touch_file "${BE}/.gitignore"
touch_file "${BE}/.eslintrc.json"
touch_file "${BE}/.prettierrc"
touch_file "${BE}/jest.config.js"
touch_file "${BE}/README.md"

# ---------------------------------------------------------------------------
# Monorepo root files
# ---------------------------------------------------------------------------
touch_file "${PROJECT_NAME}/package.json"
touch_file "${PROJECT_NAME}/.gitignore"
touch_file "${PROJECT_NAME}/.editorconfig"
touch_file "${PROJECT_NAME}/README.md"
touch_file "${PROJECT_NAME}/turbo.json"

echo ""
echo "✅ Folder structure created successfully for ${PROJECT_NAME}"
echo "Next steps:"
echo "   1) cd ${PROJECT_NAME}"
echo "   2) Backend:  cd backend  && npm install && npx prisma migrate dev"
echo "   3) Frontend: cd frontend && npm install"
