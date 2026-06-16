# LUMIK Studio

AI image generation for e-commerce products using Muapi.ai + Supabase.

## Setup

### 1. Supabase
Create table `lumik_studio_outputs`:
```sql
create table lumik_studio_outputs (
  id bigint primary key generated always as identity,
  product_id bigint,
  product_nom text,
  prompt text,
  image_url text,
  model text,
  created_at timestamptz default now()
);

alter table lumik_studio_outputs enable row level security;
create policy "public_read" on lumik_studio_outputs for select using (true);
create policy "public_insert" on lumik_studio_outputs for insert with check (true);
```

### 2. Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Deploy to Vercel
```bash
git push
# Connect repo → Vercel auto-deploys
```

## Usage
1. Visit deployed URL
2. Enter Muapi.ai API key
3. Select product → write style prompt → Generate
4. Image saved to Supabase automatically

## Tech
- Next.js 15
- Supabase PostgreSQL
- Muapi.ai API
- Tailwind CSS
