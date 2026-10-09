# PRODUCT.md

_Initialized by Impeccable `/impeccable init`._

## Product

**Name:** ComputerStoreAI (DUCMANH PC)
**Type:** E-commerce web application — PCs, laptops, and computer peripherals
**Status:** Active development (university thesis project)

## Users

| Role | Job | Context |
|------|-----|---------|
| **Customer** | Browse, filter, and purchase computers/laptops | Desktop and mobile web; expects fast product discovery and clear specs |
| **Admin** | Manage the full product catalog, orders, banners, categories, mega menu | Dashboard UI; internal use only |

## Core Purpose

Help Vietnamese customers find and buy the right PC or laptop. Differentiates through:
- Rich product specifications and comparison
- AI-assisted navigation (mega menu with category-level filtering)
- Real customer reviews with image uploads
- Wishlist and personalized catalog browsing

## Platform

- **Web** (Next.js 14, React, Tailwind CSS)
- Responsive: mobile and desktop
- Stack: Next.js · React · Tailwind · Zustand · Lucide React
- Backend: Node.js · Express · Prisma · PostgreSQL · Cloudinary

## Key Workflows

1. **Product discovery** — category mega menu → filter by brand/price/attributes → product detail
2. **Purchase flow** — product detail → add to cart → checkout → order tracking
3. **Admin catalog** — CRUD products with images, SKU, specs, highlight attributes
4. **Reviews** — authenticated users submit text + image reviews; statistics shown on product page

## Constraints & Assets

- **Language:** Vietnamese UI (all copy, labels, and error messages in Vietnamese)
- **Brand colors:** Red primary (`#dc2626` / `red-600`) — used in header and CTAs
- **Logo:** `/frontend/public/logo.png`
- **No custom design system yet** — uses Tailwind utility classes directly
- Accessibility: not formally audited; standard Tailwind defaults

## Voice & Tone

Helpful, direct, tech-savvy. Vietnamese language throughout.

## Open Decisions

- DESIGN.md not yet created (no formal design system documented)
- Authentication: JWT + Google OAuth (both active)
- Payment method: currently placeholder (not integrated)
