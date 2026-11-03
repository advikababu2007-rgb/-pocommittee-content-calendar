# Content Calendar

Next.js (App Router) + Tailwind v4 + Supabase + dnd-kit.

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. `cp .env.local.example .env.local` and fill in your project URL + anon key.
3. `npm install && npm run dev` → http://localhost:3000

Rows can be dragged (grip handle) within a week or into another week; all changes persist.
Security: the bundled RLS policy is open for development — scope it to `auth.uid()` before production.
