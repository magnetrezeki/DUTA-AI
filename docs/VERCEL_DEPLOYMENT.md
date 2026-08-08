# Deploying DUTA AI to Vercel

No deployment was performed during Day 7. Follow this only after the product owner
explicitly approves deployment.

## Project settings

- Repository: the existing private DUTA AI GitHub repository.
- Branch for production: `main`.
- Root Directory: repository root (leave blank/default).
- Framework Preset: Next.js.
- Install Command: default (`npm install`/lockfile-aware Vercel default).
- Build Command: `npm run build`.
- Output Directory: leave blank; Next.js/Vercel manages it.
- Node runtime: use a Vercel-supported Node.js runtime compatible with Next.js 16.

Do not select static export. DUTA AI uses Server Components, Server Actions,
cookies, authentication callbacks, and dynamically rendered protected pages.

## Add environment variables

In Vercel, open the project, then **Settings → Environment Variables**. Add the
variables listed in `docs/PRODUCTION_RELEASE_CHECKLIST.md`. Paste values directly
into Vercel, never into chat or Git.

- Add all three required `NEXT_PUBLIC_` variables to Development, Preview, and Production with environment-appropriate values.
- Leave `OPENAI_API_KEY` absent until a provider integration is explicitly approved.
- Never add a Supabase service-role key to the current application.

`NEXT_PUBLIC_APP_URL` must be an exact valid origin with no path, for example
`https://your-approved-domain.example`. Preview builds need their own Preview URL
value; public variables are fixed at build time.

## Configure Supabase Auth URLs

In the matching Supabase project, open **Authentication → URL Configuration**.

- Development Site URL/redirect: `http://localhost:3100` and callback paths used by the app.
- Preview: add only the approved Vercel Preview domain(s). If using a wildcard, verify its scope carefully in Supabase documentation and keep it limited to this project.
- Production Site URL: the final HTTPS production origin.
- Required callback path: `/auth/callback`.

Registration uses `/auth/callback?next=/onboarding`; password reset uses
`/auth/callback?next=/update-password`. The application restricts accepted `next`
destinations, preventing an arbitrary redirect.

## Deployment sequence

1. Confirm the Git checkpoint and clean worktree.
2. Configure Preview environment variables and Supabase Preview redirect URLs.
3. Deploy Preview from the intended commit.
4. Run all nine critical journey smoke tests.
5. Verify logs contain no secrets or private content.
6. Verify backup status and remove production DEMO records safely.
7. Configure Production variables and final Supabase Site URL.
8. Deploy the exact tested commit to Production.
9. Repeat public routes, auth, admin denial, Career privacy, and DUTA AI safety tests.

## Known build and runtime considerations

- Supabase variables are required during build because public pages may be prerendered.
- Protected routes remain dynamic due to cookies/session access.
- Session refresh runs through the Next.js proxy.
- QR rendering is local and requires no external service.
- Nearby-place distance calculation uses browser geolocation and does not send the visitor's coordinates to the server.
- The current AI provider abstraction makes no OpenAI request; provider absence is handled safely.

If a Vercel build fails, do not change database security. Capture the build step and
error message without secrets, then compare it with a local `npm run build` result.
