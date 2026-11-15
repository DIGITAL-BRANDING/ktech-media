# K-TECH MEDIA NETWORK platform foundation

Node.js editorial platform foundation using Next.js App Router, TypeScript and Supabase PostgreSQL. The existing homepage CSS tokens and visual layout are retained as the UI baseline. The public site name is configured through `NEXT_PUBLIC_SITE_NAME` so the media brand can be applied centrally.

## Requirements

- Node.js 24 LTS (or another supported Node.js LTS release)
- npm
- A Supabase project

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and the public site name (`K-TECH MEDIA NETWORK`).
3. Link the Supabase project using `npx supabase login` and `npx supabase link --project-ref <project-ref>`.
4. Apply schema and Row Level Security policies using `npx supabase db push`.
5. Run `npm run dev` and open `http://localhost:3000`.

Never place a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable or browser code. Public reads use the publishable key and database RLS. The migration creates new reporters as the default role; promote the first editor/admin from the Supabase SQL editor after creating that user.

## Current application map

- `app/`: public home, news, video, photo, live, programs, awards, about, advertising, contact, privacy and terms pages; newsroom administration and health endpoint.
- `components/`: shared K-TECH MEDIA NETWORK header/footer, responsive navigation, theme control and editorial cards.
- `public/k-tech-media-network.png`: primary website logo; `app/icon.png` supplies the browser icon.
- `lib/supabase/`: server and browser Supabase clients; the server client uses cookie sessions.
- `supabase/migrations/`: version-controlled PostgreSQL schema, publishing workflow, RLS, engagement, and broadcasting tables.
- `/admin/broadcast`: manage the live channel, programme catalogue, and weekly schedule.
- `/feed.xml` and `/news-sitemap.xml`: public RSS and Google News feeds.
- Legacy PHP/MySQL and static HTML files have been removed from the application repository; a local archive is kept outside Git while the content migration is planned.
- Without Supabase environment variables, the homepage and article route use clearly marked sample content so the design can be previewed without inventing real news.

## Editorial data model

Profiles carry reporter/editor/admin roles. New newsroom accounts default to reporter, and users cannot promote their own roles. Reporters can save drafts or send work for review; editors/admins control publication. Articles and videos support draft → review → publish/archived states, author ownership and scheduled publication fields. Photo stories contain ordered media assets. Public queries only expose published content; Row Level Security restricts editorial records and write actions.

## Media handling

Newsroom uploads go to a private Supabase Storage bucket and stay private while in review. On approval, the editor flow copies approved photo assets to a separate public bucket. Uploads are limited to newsroom users' UUID folder, image MIME allowlist, 50 MiB per file and 100 MiB per photo story. Video records use YouTube, Facebook or Vimeo links so large video delivery uses a streaming provider rather than database storage.

## First newsroom account

Create the first account from Supabase Auth with sign-up disabled. The auth trigger creates its `reporter` profile. Promote that trusted user to `admin` once from the Supabase SQL editor:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and u.email = 'your-admin-email@example.com';
```

The app deliberately offers no public sign-up or role promotion. Add later newsroom users through Supabase Auth; each defaults to the least-privileged reporter role.

## Migration notes

The legacy database was MySQL and its schema does not map one-to-one to the new PostgreSQL schema. The PHP source is archived outside this repository. Content import remains a separate task: map users to Supabase Auth identities and profiles, migrate categories and stories, convert article bodies to the editor's JSON format, move image files to Storage, and preserve old slugs with redirects before retiring the former site.

The live channel uses an external provider playback URL. Railway serves the Next.js site; it does not ingest or transcode a broadcast stream. Apply all pending migrations with `npx supabase db push` after linking the intended Supabase project, then configure the stream from Admin → Live broadcast.
# ktech-media
