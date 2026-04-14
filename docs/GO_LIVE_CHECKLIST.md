# Go-Live Checklist

Last updated: 2026-04-14

## Before Deploy

- [ ] Confirm Render env vars are present and current
- [ ] Confirm `DATABASE_URL` and `DIRECT_URL` are correct
- [ ] Confirm `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL`
- [ ] Confirm tenant domain variables: `TAQAM_BASE_DOMAIN`, `TAQAM_TENANT_URL_MODE`, `NEXT_PUBLIC_TAQAM_TENANT_URL_MODE`
- [ ] Confirm support email and SMTP env vars if email flows are expected
- [ ] Confirm Sentry DSNs are configured: `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`
- [ ] Confirm `INTEGRATION_SYNC_CRON_SECRET` for the cron service

## Pre-Launch Validation

- [ ] `pnpm typecheck`
- [ ] `pnpm lint:strict`
- [ ] `pnpm test`
- [ ] `pnpm --dir apps/mobile typecheck` if mobile APIs are part of the launch scope
- [ ] `pnpm build:webpack`

## Production Verification

- [ ] `/api/health` returns success on production
- [ ] Smoke (PowerShell): `$env:SMOKE_BASE_URL="https://taqam.net"; pnpm smoke`
- [ ] Smoke (macOS/Linux): `SMOKE_BASE_URL=https://taqam.net pnpm smoke`
- [ ] Arabic public home page works
- [ ] English public home page works
- [ ] request-demo page works
- [ ] pricing page works
- [ ] careers page works
- [ ] robots.txt and sitemap.xml are reachable

## Auth And Tenant Validation

- [ ] login page loads
- [ ] authenticated user can reach dashboard
- [ ] tenant redirect/canonicalization behaves correctly
- [ ] logout works cleanly

## Observability

- [ ] Sentry DSN values are configured in production
- [ ] `SENTRY_TEST_SECRET` is configured in production
- [ ] one controlled Sentry test event has been verified in Sentry
- [ ] PowerShell: `Invoke-RestMethod -Method Post -Uri "https://taqam.net/api/ops/sentry-test" -Headers @{"x-sentry-test-secret"="<secret>"}`
- [ ] curl: `curl -X POST "https://taqam.net/api/ops/sentry-test" -H "x-sentry-test-secret: <secret>"`
- [ ] Render logs are accessible to the operator
- [ ] audit log page is reachable for admins

## Content And Commercial Checks

- [ ] pricing shown publicly matches the approved pricing source
- [ ] claims shown publicly match the approved commercial registry
- [ ] support email and legal pages are current

## Rollback Readiness

- [ ] previous successful Render deploy is known
- [ ] responsible operator can trigger rollback quickly
- [ ] Support Playbook reviewed: `docs/SUPPORT_PLAYBOOK.md`

## Final Decision

- [ ] no open P1 issues
- [ ] no open P2 issues blocking the launch scope
- [ ] launch owner approves release window
