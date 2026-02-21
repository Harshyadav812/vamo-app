# Vamo - The Home for Builders

Vamo is a platform built for indie hackers, founders, and creators to build, track, and sell their software projects.

## Setup Instructions

### 1. Clone the project
```bash
git clone <your-repo-url>
cd vamo-app
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.local.example .env.local
```
You will need your Supabase project URL and Anon Key, as well as a Google Gemini API Key.

### 4. Run Development Server
```bash
pnpm run dev
```
The app will run at `http://localhost:3000`.

---

## Supabase Setup Instructions

The database relies on Supabase for Authentication, PostgreSQL, Storage, and Row Level Security (RLS).

### 1. Apply Migrations
You need to apply the schemas, RPCs, and RLS policies from the `supabase/migrations` folder to your Supabase project.
```bash
# Link your local repo to your remote Supabase project
npx supabase link --project-ref <your-project-ref>

# Push all migrations to your live database
npx supabase db push
```

### 2. Storage Buckets (Manual Step)
You must create two storage buckets in the Supabase Dashboard:
- `project_images`: For user-uploaded project cover images.
- `profile_avatar`: For user-uploaded profile pictures.

Ensure both buckets are set to **Public** visibility.

Once created, apply the RLS upload policies from the SQL Editor:
```sql
-- Project Images Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'project_images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project_images');
CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project_images' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project_images' AND auth.uid() = owner);

-- Profile Avatar Policies
CREATE POLICY "Public Access Profile Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'profile_avatar');
CREATE POLICY "Authenticated users can upload Avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile_avatar');
CREATE POLICY "Users can update their own Avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile_avatar' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own Avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile_avatar' AND auth.uid() = owner);
```

### 3. Database Triggers & Webhooks
The migrations automatically create the required trigger `on_auth_user_created` to sync new `auth.users` to the public `profiles` table. No manual work is needed!

*(Note: If you disabled Email Confirmation for testing, you can re-enable it under Auth -> Providers -> Email in your Supabase Dashboard).*

---

## Admin Configuration

By default, new users are standard accounts. To become an admin (which unlocks the Admin Dashboard and elevated permissions), you must manually run this SQL query in your Supabase SQL Editor:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your.email@example.com';
```
*(Replace the email string with your registered account email).* 
Refresh the Vamo app and you will see the **Admin** tab appear in the navigation!

---

## Security Confirmation - No Service Role Keys

**Confirmation:** We strictly adhere to Next.js 14 / Supabase SSR security best practices. **No Supabase Service Role Key is used anywhere in this codebase.** 

All authenticated API routes (`src/app/api/...`) rely on the `supabase-ssr` server client (`createClient()` from `src/lib/supabase/server.ts`) which explicitly passes the active user session cookie rather than a bypass admin key. All data modifications and deletions strictly leverage Postgres Row Level Security (RLS) rules tied to `auth.uid()`.

---

## Known Limitations

- **Email Infrastructure**: While the Collaborator invitation feature works structurally, external emails (e.g., via Resend) are not yet integrated for sending project invitations. Invited collaborators will see projects appear instantly in their dashboard but won't receive an out-of-band email alert.
- **Image Resizing**: Uploaded cover images and avatars are served exactly as uploaded. In a future iteration, an image optimization proxy/CDN or Supabase Storage image transformations should be utilized.
