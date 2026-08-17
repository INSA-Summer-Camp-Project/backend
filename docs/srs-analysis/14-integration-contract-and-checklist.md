# 14. Integration Risk Checklist

These are the specific technical details that will cause the frontend and backend to break during integration if not perfectly aligned.

## Checklist for the Team

- [ ] **UUIDs vs Numeric IDs:** The database uses UUIDs. The frontend must expect strings for IDs, not numbers. `id: 1` will fail.
- [ ] **Enums:** The backend will return strictly cased strings (e.g., `status: "IN_PROGRESS"`). The frontend must use these exact string literals in UI logic.
- [ ] **Dates:** The backend will return UTC strings (e.g., `2026-08-16T20:30:00.000Z`). The frontend must parse these and display them in local time.
- [ ] **Money:** Will prices be transmitted as decimals/floats (`500.50`) or integers in cents (`50050`)? *Decision: Use Decimals/Floats for this MVP to keep frontend logic simple, but beware of JS rounding errors.*
- [ ] **File Uploads (Cloudinary):** Frontend uploads directly to Cloudinary and sends the URL string (`"https://res.cloudinary.com/..."`) to the backend. Backend does not accept FormData.
- [ ] **CORS:** Ensure the backend Express app explicitly allows requests from the frontend origin (`http://localhost:5173`) and sets `credentials: true` so the HttpOnly auth cookie is sent.
- [ ] **Error Shapes:** Frontend must expect a standardized error object: `{ success: false, error: { code: string, message: string } }` and not crash if the backend returns a 400.
- [ ] **Nullability:** Frontend must safely handle missing optional fields (e.g., `worker.bio` might be `null`). Use optional chaining (`worker?.bio`).
