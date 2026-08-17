# Technical Agreements & Constraints

This document records the final technical decisions made to ensure frictionless parallel development between the Frontend and Backend repositories. These constraints are frozen for the MVP.

## 1. File Uploads

- **Provider:** Cloudinary
- **Flow:** The frontend handles file uploads directly (e.g., via Cloudinary unsigned uploads or using a signed URL provided by the backend).
- **Backend Contract:** The frontend will only send the resulting `imageUrl` (or file URL string) to the backend API.
- **Rule:** The backend will _never_ parse `multipart/form-data` for file uploads. All endpoints expect `application/json`.

## 2. Shared Types & Validation (Multi-repo Strategy)

- **Constraint:** Since the project uses a multi-repo setup, we cannot rely on a shared TypeScript `types.ts` or a monorepo workspace for automated type syncing.
- **Flow:** We will manually copy-paste our Zod schemas and TypeScript interfaces between the frontend and backend repositories.
- **Rule:** The API Documentation (`02-API-CONTRACT.md`) and the Zod schemas are the absolute source of truth for validation (e.g., max lengths, required fields, minimum amounts). If a validation rule changes, it must be updated in both repositories simultaneously.

## 3. Timezones and Scheduling

- **Flow:** All dates and times sent over the network (both requests and responses) must be in strict **UTC (ISO 8601 strings)**.
- **Example:** `2026-08-16T20:30:00.000Z`
- **Rule:** The frontend is exclusively responsible for converting UTC timestamps into the user's local timezone for display and scheduling purposes. The backend only understands UTC.

## 4. Real-time / WebSockets

- **Decision:** Out of scope for the MVP.
- **Rule:** The MVP relies exclusively on standard HTTP Request/Response (REST). No WebSockets, Server-Sent Events (SSE), or live push notifications will be implemented in this phase.
