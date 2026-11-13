# Railway deployment — K-TECH MEDIA NETWORK

This project runs as one Node.js web service on Railway. Railway's Railpack detects the npm project, installs dependencies from `package-lock.json`, runs `npm run build`, and starts the `npm start` script. The Node runtime is pinned to 24.x in `package.json`.

## Before deploying

1. Make sure the Supabase migrations are applied to the production project. From the project directory:

   ```powershell
   npx supabase link --project-ref kyerdaqdehfbivovfeqo
   npx supabase db push
   ```

2. Keep `.env.local` out of source control. It is ignored by `.gitignore`; add production values directly in Railway's service Variables.
3. Use a private GitHub repository for automatic deployments, or deploy this local folder with the Railway CLI.

## Create the Railway service

### GitHub deployment

1. Push this project to a GitHub repository.
2. In Railway, create a project and choose **Deploy from GitHub repo**.
3. Select the repository. Set the service root directory to `/`.
4. Add the environment variables below before the first production deploy when possible.

### Deploy from this computer

Install the Railway CLI, then run these commands from this folder:

```powershell
npm install -g @railway/cli
railway login
railway init --name k-tech-media-network
railway up
```

`railway init` is only needed when this folder is not already linked to a Railway project. `railway up` uploads and deploys the current folder; review the upload and deployment in the Railway dashboard.

## Railway service settings

- Builder: **Railpack** (automatic detection)
- Root directory: `/`
- Build command: `npm run build` (Railpack detects the package script)
- Start command: `npm start` (Railpack detects the package script)
- Healthcheck path: `/api/health`
- Healthcheck timeout: use Railway's default unless the first build takes longer to start
- Generate a Railway domain under the service's Networking settings

Do not set a fixed `PORT`; Railway provides it to the running service. Next.js `next start` reads the `PORT` environment variable.

## Required service variables

Add these in Railway → your web service → **Variables**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key |
| `NEXT_PUBLIC_SITE_NAME` | `K-TECH MEDIA NETWORK` |
| `NEXT_PUBLIC_SITE_URL` | The final HTTPS Railway domain, or the canonical custom domain |

Optional:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_LIVE_STREAM_URL` | Trusted HTTPS embed URL, if used |

Never add a Supabase service-role key as a `NEXT_PUBLIC_` variable. This app uses the publishable key with Row Level Security; the Supabase project and Storage remain the data and media services.

After Railway generates the domain, set `NEXT_PUBLIC_SITE_URL` to that HTTPS URL and redeploy so metadata and sitemap use the production address. If you later attach a custom domain, update this value to the canonical domain and redeploy.

## Supabase Auth after the domain is ready

In Supabase **Authentication → URL Configuration**, set the Site URL to the production domain and add the Railway/custom domain to the allowed redirect URLs. Keep the local URL in the allowlist only if you still need local sign-in.

## After deployment

1. Open the generated Railway domain and confirm `/api/health` returns JSON with `status: "ok"` and `database: "configured"`.
2. Open `/admin/login` and sign in with an active newsroom account.
3. In **Admin → Site Settings**, add the official contact details and social profile URLs; these feed the public footer and contact pages.
4. Confirm uploaded media and published assets load from Supabase Storage.

This repository does not include a legacy `railway.json` or `railway.toml`. Railway currently recommends Railpack autodetection and its newer Infrastructure as Code workflow; the package scripts and dashboard settings above are sufficient for this single service.
