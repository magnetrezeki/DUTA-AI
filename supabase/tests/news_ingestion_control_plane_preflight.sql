with integration_inventory as (
  select
    integration.id,
    integration.source_id,
    integration.method,
    integration.endpoint_url,
    integration.enabled,
    integration.authorization_verified,
    integration.last_checked_at,
    source.name as source_name,
    source.country_code as source_country_code,
    source.news_enabled as source_news_enabled,
    source.news_ingestion_authorized as source_news_ingestion_authorized,
    source.registry_status as source_registry_status,
    source.verification_level as source_verification_level,
    source.verification_status as source_verification_status,
    source.last_verified_at as source_last_verified_at,
    source.is_active as source_is_active,
    source.is_demo as source_is_demo,
    integration.enabled and integration.method = 'RSS' as is_enabled_rss,
    integration.enabled and integration.method = 'API' as is_enabled_api,
    integration.enabled as is_enabled_any_method,
    integration.enabled and integration.method in ('RSS', 'API') as would_violate_new_defaults,
    case
      when integration.enabled and integration.method in ('RSS', 'API')
        then 'REQUIRES_SEPARATE_REVIEWED_TRANSITION_PLAN'
      else 'NO_NORMALIZATION_REQUIRED'
    end as migration_compatibility
  from public.news_source_integrations integration
  join public.official_sources source on source.id = integration.source_id
),
summary as (
  select
    count(*) as total_integrations,
    count(*) filter (where is_enabled_rss) as enabled_rss_count,
    count(*) filter (where is_enabled_api) as enabled_api_count,
    count(*) filter (where is_enabled_any_method) as enabled_any_method_count,
    count(*) filter (where would_violate_new_defaults) as proposed_constraint_violation_count,
    count(*) filter (where migration_compatibility = 'REQUIRES_SEPARATE_REVIEWED_TRANSITION_PLAN') as normalization_review_count
  from integration_inventory
)
select
  'SUMMARY'::text as result_type,
  null::uuid as id,
  null::uuid as source_id,
  null::text as method,
  null::text as endpoint_url,
  null::boolean as enabled,
  null::boolean as authorization_verified,
  null::timestamptz as last_checked_at,
  null::text as source_name,
  null::text as source_country_code,
  null::boolean as source_news_enabled,
  null::boolean as source_news_ingestion_authorized,
  null::text as source_registry_status,
  null::text as source_verification_level,
  null::text as source_verification_status,
  null::timestamptz as source_last_verified_at,
  null::boolean as source_is_active,
  null::boolean as source_is_demo,
  null::boolean as is_enabled_rss,
  null::boolean as is_enabled_api,
  null::boolean as is_enabled_any_method,
  null::boolean as would_violate_new_defaults,
  format(
    'total=%s; enabled_rss=%s; enabled_api=%s; enabled_any=%s; proposed_constraint_violations=%s; normalization_review=%s',
    total_integrations, enabled_rss_count, enabled_api_count,
    enabled_any_method_count, proposed_constraint_violation_count,
    normalization_review_count
  ) as migration_compatibility
from summary
union all
select
  'INTEGRATION'::text,
  id,
  source_id,
  method::text,
  endpoint_url,
  enabled,
  authorization_verified,
  last_checked_at,
  source_name,
  source_country_code,
  source_news_enabled,
  source_news_ingestion_authorized,
  source_registry_status::text,
  source_verification_level::text,
  source_verification_status::text,
  source_last_verified_at,
  source_is_active,
  source_is_demo,
  is_enabled_rss,
  is_enabled_api,
  is_enabled_any_method,
  would_violate_new_defaults,
  migration_compatibility
from integration_inventory
order by result_type desc, id;
