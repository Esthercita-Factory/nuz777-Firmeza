<p align="center">
  <img src="docs/favicon.ico" alt="Firmeza Favicon" width="72" height="72" />
</p>

<h1 align="center">Firmeza ERP & E-Commerce Platform</h1>

<p align="center">
  <strong>Comprehensive Enterprise Resource Planning (ERP), Inventory Control, Tax Invoicing, and Customer Storefront for Construction Materials and Hardware Supplies.</strong>
</p>

<p align="center">
  <a href="#technologies-used"><img src="https://img.shields.io/badge/.NET_10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 10" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/C%23_13-239120?style=for-the-badge&logo=csharp&logoColor=white" alt="C#" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/Angular_19-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 19" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" /></a>
  <a href="#technologies-used"><img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions" /></a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [System Architecture](#system-architecture)
- [Core Features](#core-features)
  - [1. Administration & ERP Operations](#1-administration--erp-operations)
  - [2. Customer E-Commerce Storefront](#2-customer-e-commerce-storefront)
  - [3. Financial & Tax Compliance Engine](#3-financial--tax-compliance-engine)
  - [4. Automated Reporting & PDF Invoicing](#4-automated-reporting--pdf-invoicing)
- [Role-Based Access Control (RBAC) & Endpoints](#role-based-access-control-rbac--endpoints)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started & Local Development](#getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (.NET 10 API)](#backend-setup-net-10-api)
  - [Frontend Setup (Angular SPA)](#frontend-setup-angular-spa)
- [Docker & Containerized Deployment](#docker--containerized-deployment)
- [Automated Testing](#automated-testing)
- [Supplementary Documentation](#supplementary-documentation)

---

## Overview

**Firmeza** is a modern, enterprise-grade commercial and inventory management platform tailored for the construction and hardware sector. Built with **Clean Architecture** principles on **.NET 10** and a reactive **Angular 19** frontend, the system bridges back-office warehouse operations, customer credit verification, bulk catalog data ingestion, and end-customer online purchasing with real-time stock allocation and PDF receipt generation.

---

## Technologies Used

<table align="center">
  <tr>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/dot-net/dot-net-original.svg" width="48" height="48" alt=".NET 10" /><br />
      <sub><b>.NET 10</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/csharp/csharp-original.svg" width="48" height="48" alt="C#" /><br />
      <sub><b>C# 13</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/angular/angular-original.svg" width="48" height="48" alt="Angular" /><br />
      <sub><b>Angular 19</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" /><br />
      <sub><b>TypeScript</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL" /><br />
      <sub><b>PostgreSQL 16</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind CSS" /><br />
      <sub><b>Tailwind CSS</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original.svg" width="48" height="48" alt="Docker" /><br />
      <sub><b>Docker</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nginx/nginx-original.svg" width="48" height="48" alt="Nginx" /><br />
      <sub><b>Nginx</b></sub>
    </td>
    <td align="center" width="96">
      <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/githubactions/githubactions-original.svg" width="48" height="48" alt="GitHub Actions" /><br />
      <sub><b>CI/CD</b></sub>
    </td>
  </tr>
</table>

### Stack Breakdown

- **Backend Framework**: [ASP.NET Core Web API (.NET 10)](https://dotnet.microsoft.com/)
- **Database & ORM**: [PostgreSQL 16](https://www.postgresql.org/) with [Entity Framework Core 10](https://learn.microsoft.com/ef/core/) and Npgsql
- **Security & Identity**: ASP.NET Core Identity with custom User & Role entities, BCrypt password hashing, and stateless JWT Bearer tokens with secure Refresh Token rotation
- **Document & PDF Generation**: [QuestPDF](https://www.questpdf.com/) (vector PDF generation for purchase receipts and inventory reports)
- **Spreadsheet Processing**: [ClosedXML](https://github.com/ClosedXML/ClosedXML) / [ExcelDataReader](https://github.com/ExcelDataReader/ExcelDataReader) for high-performance XLSX catalog ingestion and audit exports
- **Mail Subsystem**: [MailKit & MimeKit](https://mimekit.net/) for RFC-compliant SMTP transactional email dispatch with inline attachments
- **Frontend Architecture**: [Angular 19](https://angular.dev/) Standalone Components, Reactive Signals (`computed`, `signal`, `input`), typed Reactive Forms, and modern Control Flow (`@if`, `@for`, `@let`)
- **Styling & Design System**: [Tailwind CSS 3](https://tailwindcss.com/) with native Dark & Light theme switching, accessible contrast ratios, and custom mobile layouts
- **Automated Testing**: [xUnit](https://xunit.net/), [FluentAssertions](https://fluentassertions.com/), [Moq](https://github.com/devlooped/moq), and [Vitest](https://vitest.dev/) for Angular
- **Containerization**: Multi-stage [Dockerfiles](Dockerfile.api) with Alpine Linux base images and [Nginx](client/nginx.conf) reverse proxy

---

## System Architecture

The application strictly enforces **Clean Architecture** (Onion Architecture) with single-direction dependency flow toward the Domain Core:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Angular SPA)                  │
│             Standalone Components · Signals · Tailwind      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (REST API)
┌──────────────────────────────▼──────────────────────────────┐
│                    API / Presentation Layer                 │
│         Firmeza.Api (Controllers, Middlewares, Filters)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│     Application Layer       │ │    Infrastructure Layer     │
│   Use Cases · CQRS DTOs     │ │  EF Core · PostgreSQL       │
│ Repositories · Validators   │ │ QuestPDF · MailKit · Identity│
└──────────────┬──────────────┘ └─────────────┬───────────────┘
               │                              │
               └──────────────► ◄─────────────┘
                               │
                ┌──────────────▼──────────────┐
                │        Domain Layer         │
                │  Entities · Aggregates      │
                │ Business Rules · Exceptions │
                └─────────────────────────────┘
```

- **`Firmeza.Domain`**: Pure domain models (`Product`, `Sale`, `Customer`, `CustomerRequest`, `SaleItem`), enums, domain exceptions, and invariant business calculations (such as `InventoryCalculator.SplitTaxInclusive`). Zero external dependencies.
- **`Firmeza.Application`**: Business orchestration, interfaces (`ISaleRepository`, `IProductRepository`, `IMailService`, `IPdfService`, `IExcelService`), DTO contracts, and transactional use cases.
- **`Firmeza.Infrastructure`**: Concrete adapters for PostgreSQL persistence, migrations, Identity authentication, PDF compilation, Excel parsing, and SMTP mail dispatch.
- **`Firmeza.Api`**: REST endpoints, OpenAPI / Swagger documentation, rate limiting, JWT Bearer authentication, and global exception handling.
- **`client`**: Independent Angular Single Page Application featuring client storefront, shopping cart, real-time receipt viewer, and admin dashboard.

---

## Core Features

### 1. Administration & ERP Operations
- **Interactive KPI Dashboard**: Real-time sales telemetry, revenue breakdown, customer acquisition metrics, and recent order feeds.
- **Inventory & Product Management**: CRUD operations for construction materials, stock tracking with low-stock alerts, SKU management, image storage, and tax classification.
- **B2B Customer Directory**: Commercial client profiles with tax document validation (NIT / CC), contact channels, and transaction histories.
- **Customer Registration Approvals**: Built-in verification queue (`/solicitudes`) where administrators approve or reject prospective business accounts with automated email notifications.
- **Order Lifecycle Management**: Administrative order review workflow (Pending → Approved / Dispatched / Cancelled) with mandatory cancellation reasons and stock auto-replenishment.
- **Bulk Catalog Ingestion**: High-throughput Excel (XLSX) parser with multi-sheet detection, in-memory normalization, code deduplication, and row-by-row validation feedback.

### 2. Customer E-Commerce Storefront
- **Direct Material Catalog**: Real-time material search, category filtering, responsive product cards (2x2 grid on mobile), and dynamic availability indicators.
- **Tax-Transparent Shopping Cart**: Real-time unit total computation showing base amount, 19% VAT breakdown, and final totals.
- **Order History & In-App Receipt Viewer**: Dedicated "Mis Compras" portal allowing clients to view and print official vector PDF receipts without forced downloads.
- **Mobile Bottom Navigation**: Native app-like bottom navigation with an animated active tab curve ("montañita"), badge indicators, and safe-area compatibility.

### 3. Financial & Tax Compliance Engine
- **19% VAT (IVA) Engine**: Mathematically verified split-tax calculations with round-to-even accuracy conforming to official commercial tax standards.
- **Atomic Stock Reservation**: Database-level concurrency control preventing double-allocation and out-of-stock orders during simultaneous checkout sessions.

### 4. Automated Reporting & PDF Invoicing
- **QuestPDF Invoices**: Clean, vector-rendered receipts containing QR verification data, company tax headers, itemized breakdowns, and digital signatures.
- **Audit Reports**: One-click Excel and PDF exports for products, customer registries, and sales ledgers.

---

## Role-Based Access Control (RBAC) & Endpoints

| Category | Method | Endpoint | Authorization | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate with email/password; returns JWT + Refresh Token |
| **Auth** | `POST` | `/api/auth/register` | Public | Submit customer registration for review |
| **Auth** | `POST` | `/api/auth/refresh` | Public | Rotate expired access token using valid refresh token |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile and roles |
| **Products** | `GET` | `/api/products` | Public | Public catalog browsing with active stock |
| **Products** | `POST` | `/api/products` | `Administrador` | Create new inventory item |
| **Products** | `PUT` | `/api/products/{id}` | `Administrador` | Update inventory details, price, or stock |
| **Products** | `DELETE`| `/api/products/{id}` | `Administrador` | Delete or deactivate product |
| **Products** | `GET` | `/api/products/export/excel` | `Administrador` | Export inventory to Excel spreadsheet |
| **Products** | `GET` | `/api/products/export/pdf` | `Administrador` | Export inventory to printable PDF document |
| **Customers** | `GET` | `/api/customers` | `Administrador` | Paginated listing of registered clients |
| **Customers** | `POST` | `/api/customers` | `Administrador` | Manual customer creation |
| **Customer Requests** | `GET` | `/api/customer-requests` | `Administrador` | Fetch pending client registration requests |
| **Customer Requests** | `POST` | `/api/customer-requests/{id}/review` | `Administrador` | Approve or reject registration request |
| **Orders / Sales** | `POST` | `/api/sales` | `Cliente` | Checkout shopping cart & generate order |
| **Orders / Sales** | `GET` | `/api/sales` | Authenticated | Retrieve orders (Clients: own orders; Admin: all) |
| **Orders / Sales** | `GET` | `/api/sales/{id}` | Authenticated | Order detail and line items |
| **Orders / Sales** | `GET` | `/api/sales/{id}/receipt` | Authenticated | Download / stream vector PDF sales receipt |
| **Orders / Sales** | `PUT` | `/api/sales/{id}/decision` | `Administrador` | Approve, dispatch, or cancel order |
| **Bulk Import** | `POST` | `/api/imports/excel` | `Administrador` | Ingest catalog via XLSX spreadsheet |
| **Dashboard** | `GET` | `/api/dashboard` | `Administrador` | Retrieve KPI metrics and sales analytics |
| **Health** | `GET` | `/health` | Public | Liveness and database connectivity probe |

---

## Project Directory Structure

```
.
├── API/
│   └── src/
│       ├── Firmeza.Domain/           # Entities, Enums, Exceptions, Pure Business Rules
│       ├── Firmeza.Application/      # Use Cases, Repositories, DTOs, Business Contracts
│       ├── Firmeza.Infrastructure/   # EF Core, PostgreSQL, QuestPDF, MailKit, Identity
│       ├── Firmeza.Api/              # ASP.NET Core Controllers, Swagger, Middlewares
│       ├── Firmeza.Web/              # Static SPA Host Server
│       └── Firmeza.Tests/            # xUnit, Integration, Domain & Security Tests
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── Guards/               # Role & Route Authentication Guards
│   │   │   ├── Interceptors/         # JWT Bearer & Error Handling Interceptors
│   │   │   ├── Models/               # TypeScript Interfaces & Contracts
│   │   │   ├── Services/             # Angular Injectable API & State Services
│   │   │   └── Views/
│   │   │       ├── Auth/             # Login & Registration Views
│   │   │       ├── Dashboard/        # Admin Analytics & KPI Panels
│   │   │       ├── Customers/        # Customer Management & Request Approvals
│   │   │       ├── Products/         # Inventory Management & Creation Forms
│   │   │       ├── Sales/            # Order Processing & Management
│   │   │       ├── Imports/          # Bulk Excel Ingestion View
│   │   │       ├── Shop/             # E-Commerce Catalog, Checkout & My Orders
│   │   │       └── Shared/           # BottomNav, Icons, UI Components, Theme Toggle
│   ├── Dockerfile                    # Multi-stage Angular Node 22 -> Nginx production build
│   └── nginx.conf                    # Nginx SPA fallback configuration
├── docs/                             # Architecture & Operational Documentation
├── docker-compose.yml                # Production multi-service orchestration
├── Dockerfile.api                    # Production container build for .NET 10 API
└── Firmeza.sln                       # Solution descriptor
```

---

## Getting Started & Local Development

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22 LTS](https://nodejs.org/) & `npm`
- [PostgreSQL 16](https://www.postgresql.org/) (or Docker)
- [Docker & Docker Compose](https://www.docker.com/)

### Backend Setup (.NET 10 API)

1. **Start PostgreSQL Database**:
   ```bash
   docker compose up -d db
   ```

2. **Restore Dependencies & Build Solution**:
   ```bash
   dotnet restore Firmeza.sln
   dotnet build Firmeza.sln
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and adjust database credentials and secrets:
   ```bash
   cp .env.example .env
   ```

4. **Run the API**:
   ```bash
   dotnet run --project API/src/Firmeza.Api --launch-profile http
   ```
   - API listens on: `http://localhost:5180`
   - Swagger Documentation: `http://localhost:5180/swagger`

### Frontend Setup (Angular SPA)

1. **Install Dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```
   - Application URL: `http://localhost:4200` (or `http://localhost:4201`)

---

## Docker & Containerized Deployment

The platform is fully containerized for production with health checks and automatic database migrations:

```bash
# 1. Setup production environment file
cp .env.example .env

# 2. Build and launch all services
docker compose up -d --build
```

### Deployed Services

| Service | Internal Port | Host Port | Description |
|---|---|---|---|
| `db` | 5432 | `5433` | PostgreSQL 16 Alpine Database |
| `api` | 8080 | `8888` | .NET 10 Kestrel API Service |
| `client` | 80 | `8889` | Nginx Alpine Static Angular Host |

---

## Automated Testing

The project maintains high test coverage across both backend and frontend layers:

### Backend Test Suite (146 Tests)
Validates domain models, split-tax arithmetic, transactional orders, identity security, and repository abstractions:
```bash
dotnet test Firmeza.sln
```

### Frontend Test Suite (73 Tests)
Validates Angular signals, routing guards, cart state, theme toggles, and form validations:
```bash
cd client
npm test -- --watch=false
```

---

## Supplementary Documentation

For in-depth architectural guides, consult the technical documents in the [`docs/`](docs/) directory:

- [**Customer Purchase Flow & Order Lifecycle**](docs/flujo-compra-cliente.md)
- [**Architectural Layers & Validation Rules**](docs/capas-y-validaciones.md)
- [**SMTP Configuration & Mail Dispatch**](docs/configuracion-smtp.md)
- [**Entity-Relationship & Data Models**](docs/diagrams.md)

---

<p align="center">
  <sub>Developed for <b>Firmeza</b> · Built with .NET 10, Angular 19, and PostgreSQL</sub>
</p>
