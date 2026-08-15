# DUTA Layanan 2E deployment and rollback runbook

Status: local preparation only. None of these steps authorizes a hosted change.

## Required deployment order

1. Record the deployed application commit and database migration state.
2. Run `supabase/tests/duta_layanan_2e_hosted_preflight.sql` and stop if any row reports `FAIL`.
3. Apply `supabase/migrations/202608150001_duta_layanan_dual_provenance.sql` only after separate approval.
4. Deploy the application revision that understands `layanan_public_provenance`.
5. Run `supabase/seeds/duta_layanan_2d_verified_services.sql` only after separate approval.
6. Run `supabase/tests/duta_layanan_2d_post_population_validation.sql`; any exception is a failed deployment.

## Population failure

The population script is one transaction, so an unexpected error rolls back its
current execution. If a previously completed population must be removed from the
public readers, separately review and run
`supabase/recovery/duta_layanan_2e_population_fail_closed.sql`. It preserves rows,
evidence, and verification history for audit, but disables the deterministic
office, jurisdiction, and mission-service package in the curated public layer.

Do not delete production or audit records as cleanup. Re-run the post-population
validation and confirm the package has disappeared from all three public readers.

## Migration or application-behavior rollback

Behavior rollback is a coordinated two-part operation:

1. Roll the application back to the recorded pre-2E compatible commit.
2. Run the separately reviewed
   `supabase/recovery/duta_layanan_2e_migration_behavior_rollback.sql` to restore
   evidence-only publication behavior.

Database behavior rollback alone is unsafe while the deployed application still
queries `public.layanan_public_provenance`: the rollback intentionally removes that
view/function and the newer application would fail at runtime. Application rollback
alone also leaves the approved dual-provenance database behavior active. Treat the
two actions as one change window and verify `/connect` after both complete.

## Recovery rules

- Never weaken RLS or grant direct base-table reads during recovery.
- Never run either recovery file speculatively.
- Preserve the original SQL output, application commit, timestamps, and operator in
  the incident record.
- If a transaction fails before its final `COMMIT`, issue `ROLLBACK;` in the same SQL
  Editor session before any other statement.
- News and JIM ingestion are outside this runbook and remain unchanged/disabled.
