begin;

create type public.news_source_type as enum (
  'INDONESIAN_GOVERNMENT', 'MALAYSIAN_GOVERNMENT', 'MEDIA'
);
create type public.news_source_group as enum (
  'INDONESIAN_MISSIONS', 'MALAYSIAN_GOVERNMENT', 'INDONESIAN_MEDIA'
);
create type public.news_region as enum (
  'MALAYSIA', 'NASIONAL', 'SUMATERA', 'JAWA', 'NTT', 'NTB',
  'KALIMANTAN', 'SULAWESI', 'PAPUA'
);
create type public.news_ingestion_method_v2 as enum ('MANUAL_URL', 'RSS', 'API');
create type public.news_editorial_status as enum (
  'PENDING', 'ELIGIBLE', 'REJECTED', 'NEEDS_REVIEW', 'PUBLISHED', 'SUPERSEDED'
);
create type public.news_review_decision as enum (
  'APPROVE', 'REJECT', 'NEEDS_REVIEW', 'SUPERSEDE'
);
create type public.news_review_reason as enum (
  'ORDINARY_CRIME', 'CORRUPTION_EXCEPTION', 'DISASTER_EXCEPTION',
  'POLITICAL_INFORMATION', 'RELIGIOUS_CONSTRUCTIVE', 'INFLAMMATORY_CONTENT',
  'ENTERTAINMENT_INSPIRATIONAL', 'GOSSIP_SCANDAL', 'CLICKBAIT',
  'ADVERTISEMENT', 'INSUFFICIENT_METADATA', 'DUPLICATE', 'COPYRIGHT_RISK',
  'SOURCE_NOT_APPROVED', 'OTHER'
);
create type public.news_duplicate_kind as enum ('HARD', 'POSSIBLE', 'SYNDICATED');
create type public.news_thumbnail_permission as enum (
  'NOT_PROVIDED', 'SOURCE_METADATA', 'EXPLICITLY_ALLOWED', 'RESTRICTED', 'UNKNOWN'
);
create type public.news_category_code as enum (
  'GOVERNMENT', 'POLITICS', 'PUBLIC_POLICY', 'ECONOMY', 'DEVELOPMENT',
  'INFRASTRUCTURE', 'TECHNOLOGY', 'DIGITAL_INNOVATION', 'EDUCATION',
  'RELIGION', 'CULTURE', 'INSPIRATION', 'POSITIVE_COMMUNITY',
  'ENTERTAINMENT', 'TOURISM', 'ENVIRONMENT', 'DISASTER', 'CORRUPTION',
  'PUBLIC_SERVICE', 'MIGRATION', 'IMMIGRATION', 'INDONESIA_MALAYSIA', 'DIASPORA'
);

alter table public.official_sources
  add column news_enabled boolean not null default false,
  add column news_source_type public.news_source_type,
  add column news_source_group public.news_source_group,
  add column news_primary_region public.news_region,
  add column news_ingestion_authorized boolean not null default false,
  add constraint official_sources_news_enable_safety check (
    not news_enabled or (
      enabled
      and registry_status = 'VERIFIED'
      and verification_level in ('A', 'B')
      and verification_status = 'verified'
      and last_verified_at is not null
      and not is_demo
      and news_source_type is not null
      and news_source_group is not null
    )
  ),
  add constraint official_sources_news_ingestion_fail_closed check (
    not news_ingestion_authorized or news_enabled
  );

alter table public.official_source_items
  add column canonicalization_version text not null default 'NEWS_URL_CANON_V1',
  add column ingestion_method_v2 public.news_ingestion_method_v2 not null default 'MANUAL_URL',
  add column fetched_at timestamptz,
  add column similarity_hash text,
  add column editorial_status public.news_editorial_status not null default 'PENDING',
  add column original_publisher_url text,
  add column thumbnail_url text,
  add column thumbnail_permission public.news_thumbnail_permission not null default 'UNKNOWN',
  add constraint official_source_items_canonicalization_version check (
    canonicalization_version = 'NEWS_URL_CANON_V1'
  ),
  add constraint official_source_items_similarity_hash check (
    similarity_hash is null or similarity_hash ~ '^[a-f0-9]{64}$'
  ),
  add constraint official_source_items_original_publisher_url_https check (
    original_publisher_url is null or original_publisher_url ~ '^https://'
  ),
  add constraint official_source_items_thumbnail_url_https check (
    thumbnail_url is null or thumbnail_url ~ '^https://'
  ),
  add constraint official_source_items_thumbnail_permission check (
    thumbnail_url is null or thumbnail_permission <> 'NOT_PROVIDED'
  );

-- Preserve provenance history: Registry sources with captured items cannot be deleted.
alter table public.official_source_items
  drop constraint official_source_items_source_id_fkey,
  add constraint official_source_items_source_id_fkey foreign key (source_id)
    references public.official_sources(id) on delete restrict;

alter table public.news_items
  add column official_source_item_id uuid,
  add column canonical_url text,
  add column canonicalization_version text,
  add column region public.news_region,
  add column province text,
  add column editorial_status public.news_editorial_status not null default 'PENDING',
  add column original_publisher_url text,
  add column thumbnail_url text,
  add column thumbnail_permission public.news_thumbnail_permission not null default 'UNKNOWN',
  add column superseded_by uuid,
  add constraint news_items_official_source_item_fk foreign key (official_source_item_id, source_id)
    references public.official_source_items(id, source_id) on delete restrict,
  add constraint news_items_superseded_by_fk foreign key (superseded_by)
    references public.news_items(id) on delete restrict,
  add constraint news_items_not_self_superseded check (superseded_by is null or superseded_by <> id),
  add constraint news_items_canonical_url_https check (
    canonical_url is null or canonical_url ~ '^https?://'
  ),
  add constraint news_items_canonicalization_version check (
    canonicalization_version is null or canonicalization_version = 'NEWS_URL_CANON_V1'
  ),
  add constraint news_items_v2_identity check (
    (official_source_item_id is null and canonical_url is null and canonicalization_version is null)
    or
    (official_source_item_id is not null and canonical_url is not null
      and canonicalization_version = 'NEWS_URL_CANON_V1')
  ),
  add constraint news_items_original_publisher_url_https check (
    original_publisher_url is null or original_publisher_url ~ '^https://'
  ),
  add constraint news_items_thumbnail_url_https check (
    thumbnail_url is null or thumbnail_url ~ '^https://'
  ),
  add constraint news_items_thumbnail_permission check (
    thumbnail_url is null or thumbnail_permission <> 'NOT_PROVIDED'
  ),
  add constraint news_items_editorial_publication check (
    official_source_item_id is null
    or publication_status <> 'published'
    or editorial_status = 'PUBLISHED'
  );

create table public.news_categories (
  id uuid primary key default gen_random_uuid(),
  code public.news_category_code not null unique,
  label text not null check (char_length(trim(label)) between 2 and 80),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news_source_category_scopes (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.official_sources(id) on delete restrict,
  category_id uuid not null references public.news_categories(id) on delete restrict,
  enabled boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_source_category_scopes_unique unique (source_id, category_id)
);

create table public.news_item_categories (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid not null references public.news_items(id) on delete restrict,
  category_id uuid not null references public.news_categories(id) on delete restrict,
  is_primary boolean not null default false,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint news_item_categories_unique unique (news_item_id, category_id)
);

create table public.news_editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid not null references public.news_items(id) on delete restrict,
  decision public.news_review_decision not null,
  reason public.news_review_reason not null,
  private_notes text check (private_notes is null or char_length(private_notes) <= 4000),
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint news_editorial_reviews_decision_reason check (
    (reason in (
      'ORDINARY_CRIME', 'INFLAMMATORY_CONTENT', 'GOSSIP_SCANDAL', 'CLICKBAIT',
      'ADVERTISEMENT', 'INSUFFICIENT_METADATA', 'DUPLICATE', 'COPYRIGHT_RISK',
      'SOURCE_NOT_APPROVED'
    ) and decision <> 'APPROVE')
    or
    (reason in (
      'CORRUPTION_EXCEPTION', 'DISASTER_EXCEPTION', 'POLITICAL_INFORMATION',
      'RELIGIOUS_CONSTRUCTIVE', 'ENTERTAINMENT_INSPIRATIONAL', 'OTHER'
    ))
  )
);

create table public.news_duplicate_relations (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid not null references public.news_items(id) on delete restrict,
  related_news_item_id uuid not null references public.news_items(id) on delete restrict,
  duplicate_kind public.news_duplicate_kind not null,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint news_duplicate_relations_not_self check (news_item_id <> related_news_item_id),
  constraint news_duplicate_relations_ordered check (news_item_id < related_news_item_id),
  constraint news_duplicate_relations_unique unique (news_item_id, related_news_item_id)
);

create table public.news_source_integrations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.official_sources(id) on delete restrict,
  method public.news_ingestion_method_v2 not null,
  endpoint_url text,
  enabled boolean not null default false,
  authorization_verified boolean not null default false,
  authorization_notes text,
  last_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_source_integrations_unique unique (source_id, method),
  constraint news_source_integrations_endpoint_https check (
    endpoint_url is null or endpoint_url ~ '^https://'
  ),
  constraint news_source_integrations_fail_closed check (
    method = 'MANUAL_URL'
    or not enabled
    or (authorization_verified and endpoint_url is not null)
  )
);

create table public.news_source_assessments (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.official_sources(id) on delete restrict,
  thumbnail_permission public.news_thumbnail_permission not null default 'UNKNOWN',
  terms_url text,
  assessed_by uuid not null references auth.users(id) on delete restrict,
  assessed_at timestamptz not null default now(),
  expires_at timestamptz,
  private_notes text,
  created_at timestamptz not null default now(),
  constraint news_source_assessments_terms_url_https check (
    terms_url is null or terms_url ~ '^https://'
  ),
  constraint news_source_assessments_expiry check (
    expires_at is null or expires_at > assessed_at
  )
);

create index official_sources_news_feed_idx
  on public.official_sources (news_primary_region, news_source_type)
  where news_enabled;
create index official_source_items_similarity_hash_idx
  on public.official_source_items (similarity_hash) where similarity_hash is not null;
create index official_source_items_editorial_status_idx
  on public.official_source_items (editorial_status, published_at desc);
create index news_items_public_feed_v2_idx
  on public.news_items (region, province, published_at desc)
  where publication_status = 'published' and editorial_status = 'PUBLISHED';
create unique index news_items_canonical_url_v2_idx
  on public.news_items (canonical_url) where canonical_url is not null;
create unique index news_items_official_source_item_idx
  on public.news_items (official_source_item_id) where official_source_item_id is not null;
create index news_items_source_recent_idx on public.news_items (source_id, published_at desc);
create index news_items_superseded_by_idx on public.news_items (superseded_by)
  where superseded_by is not null;
create index news_source_category_scopes_category_idx
  on public.news_source_category_scopes (category_id, source_id);
create index news_source_category_scopes_created_by_idx
  on public.news_source_category_scopes (created_by) where created_by is not null;
create unique index news_item_categories_one_primary_idx
  on public.news_item_categories (news_item_id) where is_primary;
create index news_item_categories_category_idx
  on public.news_item_categories (category_id, news_item_id);
create index news_item_categories_assigned_by_idx
  on public.news_item_categories (assigned_by) where assigned_by is not null;
create index news_editorial_reviews_item_idx
  on public.news_editorial_reviews (news_item_id, reviewed_at desc);
create index news_editorial_reviews_reviewer_idx
  on public.news_editorial_reviews (reviewed_by, reviewed_at desc);
create index news_duplicate_relations_related_idx
  on public.news_duplicate_relations (related_news_item_id);
create index news_duplicate_relations_reviewer_idx
  on public.news_duplicate_relations (reviewed_by) where reviewed_by is not null;
create index news_source_integrations_created_by_idx
  on public.news_source_integrations (created_by) where created_by is not null;
create index news_source_assessments_source_idx
  on public.news_source_assessments (source_id, assessed_at desc);
create index news_source_assessments_assessor_idx
  on public.news_source_assessments (assessed_by);

create trigger news_categories_set_updated_at before update on public.news_categories
for each row execute function private.set_updated_at();
create trigger news_source_category_scopes_set_updated_at before update on public.news_source_category_scopes
for each row execute function private.set_updated_at();
create trigger news_source_integrations_set_updated_at before update on public.news_source_integrations
for each row execute function private.set_updated_at();

create or replace function private.set_news_editorial_review_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.reviewed_at := statement_timestamp();
  new.created_at := statement_timestamp();
  return new;
end;
$$;
revoke all on function private.set_news_editorial_review_timestamps() from public, anon, authenticated;
create trigger news_editorial_reviews_set_server_timestamps
before insert on public.news_editorial_reviews
for each row execute function private.set_news_editorial_review_timestamps();

create or replace function private.set_news_source_assessment_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.assessed_at := statement_timestamp();
  new.created_at := statement_timestamp();
  return new;
end;
$$;
revoke all on function private.set_news_source_assessment_timestamps() from public, anon, authenticated;
create trigger news_source_assessments_set_server_timestamps
before insert on public.news_source_assessments
for each row execute function private.set_news_source_assessment_timestamps();

create or replace function private.prevent_news_supersession_cycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.superseded_by is null then
    return new;
  end if;

  if new.superseded_by = new.id then
    raise exception 'A news item cannot supersede itself' using errcode = '23514';
  end if;

  if exists (
    with recursive chain(id, superseded_by, visited) as (
      select item.id, item.superseded_by, array[item.id]
      from public.news_items item
      where item.id = new.superseded_by
      union all
      select next_item.id, next_item.superseded_by, chain.visited || next_item.id
      from chain
      join public.news_items next_item on next_item.id = chain.superseded_by
      where not next_item.id = any(chain.visited)
    )
    select 1 from chain where chain.id = new.id
  ) then
    raise exception 'News supersession cycle detected' using errcode = '23514';
  end if;

  return new;
end;
$$;
revoke all on function private.prevent_news_supersession_cycle() from public, anon, authenticated;
create trigger news_items_prevent_supersession_cycle
before insert or update of superseded_by on public.news_items
for each row execute function private.prevent_news_supersession_cycle();

create or replace function private.news_url_canonical_v1(input_url text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  without_fragment text;
  scheme text;
  authority text;
  hostname text;
  port_text text;
  label text;
  remainder text;
  path_part text;
  query_part text;
  pair text;
  kept_pairs text[] := array[]::text[];
begin
  if input_url is null
    or input_url ~ '[[:space:][:cntrl:]]'
    or input_url !~* '^https?://[^/?#]+' then
    return null;
  end if;

  without_fragment := split_part(input_url, '#', 1);
  scheme := lower(substring(without_fragment from '^([^:]+)'));
  remainder := substring(without_fragment from '^[^:]+://(.*)$');
  authority := substring(remainder from '^([^/?]+)');
  remainder := substring(remainder from char_length(authority) + 1);

  if authority ~ '@' or authority !~ '^[A-Za-z0-9.-]+(?::[0-9]{1,5})?$' then
    return null;
  end if;

  hostname := split_part(authority, ':', 1);
  port_text := nullif(substring(authority from ':(\d{1,5})$'), '');

  if char_length(hostname) > 253 or hostname ~ '^\.' or hostname ~ '\.$' or hostname ~ '\.\.' then
    return null;
  end if;

  foreach label in array string_to_array(hostname, '.') loop
    if label !~ '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$' then
      return null;
    end if;
  end loop;

  if port_text is not null and (port_text::integer < 1 or port_text::integer > 65535) then
    return null;
  end if;

  hostname := lower(hostname);
  if (scheme = 'http' and port_text = '80') or (scheme = 'https' and port_text = '443') then
    port_text := null;
  end if;

  if position('?' in remainder) > 0 then
    path_part := split_part(remainder, '?', 1);
    query_part := substring(remainder from position('?' in remainder) + 1);
  else
    path_part := remainder;
    query_part := null;
  end if;

  if path_part = '' then
    path_part := '/';
  end if;

  if query_part is not null then
    foreach pair in array string_to_array(query_part, '&') loop
      if lower(split_part(pair, '=', 1)) not in (
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'utm_id', 'fbclid', 'gclid'
      ) then
        kept_pairs := array_append(kept_pairs, pair);
      end if;
    end loop;
  end if;

  return scheme || '://' || hostname
    || case when port_text is not null then ':' || port_text else '' end
    || path_part
    || case when cardinality(kept_pairs) > 0 then '?' || array_to_string(kept_pairs, '&') else '' end;
end;
$$;
revoke all on function private.news_url_canonical_v1(text) from public;
grant execute on function private.news_url_canonical_v1(text) to authenticated;

alter table public.official_source_items
  add constraint official_source_items_canonical_url_v1 check (
    private.news_url_canonical_v1(canonical_url) is not null
    and canonical_url = private.news_url_canonical_v1(canonical_url)
  ) not valid;
alter table public.news_items
  add constraint news_items_canonical_url_v1 check (
    canonical_url is null or (
      private.news_url_canonical_v1(canonical_url) is not null
      and canonical_url = private.news_url_canonical_v1(canonical_url)
    )
  ) not valid;

create or replace function private.can_manage_news_source(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_manage_source(target_source_id);
$$;
revoke all on function private.can_manage_news_source(uuid) from public;
grant execute on function private.can_manage_news_source(uuid) to authenticated;

create or replace function private.can_manage_news_item(target_news_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.news_items item
    where item.id = target_news_item_id
      and private.can_manage_news_source(item.source_id)
  );
$$;
revoke all on function private.can_manage_news_item(uuid) from public;
grant execute on function private.can_manage_news_item(uuid) to authenticated;

create or replace function private.can_manage_global_news_taxonomy()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles viewer
    where viewer.id = (select auth.uid())
      and viewer.onboarding_completed
      and viewer.role in ('moderator', 'super_admin')
  );
$$;
revoke all on function private.can_manage_global_news_taxonomy() from public;
grant execute on function private.can_manage_global_news_taxonomy() to authenticated;

create or replace function private.is_news_integration_authorized(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.official_sources source
    where source.id = target_source_id
      and source.news_enabled
      and source.news_ingestion_authorized
      and source.enabled
      and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and not source.is_demo
  );
$$;
revoke all on function private.is_news_integration_authorized(uuid) from public;
grant execute on function private.is_news_integration_authorized(uuid) to authenticated;

create or replace function private.is_news_source_publishable(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.official_sources source
    where source.id = target_source_id
      and source.enabled
      and source.news_enabled
      and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and source.verification_status = 'verified'
      and source.last_verified_at is not null
      and source.is_active
      and not source.is_demo
  );
$$;
revoke all on function private.is_news_source_publishable(uuid) from public;

create or replace function private.is_news_item_publishable(target_news_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.news_items item
    join public.official_source_items source_item
      on source_item.id = item.official_source_item_id
     and source_item.source_id = item.source_id
    where item.id = target_news_item_id
      and private.is_news_source_publishable(item.source_id)
      and item.publication_status = 'published'
      and item.editorial_status = 'PUBLISHED'
      and item.verification_status = 'verified'
      and item.last_verified_at is not null
      and item.published_at is not null
      and item.published_at <= now()
      and not item.is_demo
      and item.superseded_by is null
      and source_item.verified_source
      and source_item.editorial_status in ('ELIGIBLE', 'PUBLISHED')
      and source_item.canonical_url = item.canonical_url
      and exists (
        select 1
        from public.news_item_categories assignment
        join public.news_source_category_scopes scope
          on scope.source_id = item.source_id
         and scope.category_id = assignment.category_id
         and scope.enabled
        join public.news_categories category
          on category.id = assignment.category_id
         and category.enabled
        where assignment.news_item_id = item.id
          and assignment.is_primary
      )
      and exists (
        select 1 from public.news_editorial_reviews review
        where review.news_item_id = item.id
          and review.id = (
            select latest_review.id
            from public.news_editorial_reviews latest_review
            where latest_review.news_item_id = item.id
            order by latest_review.reviewed_at desc, latest_review.id desc
            limit 1
          )
          and review.decision = 'APPROVE'
          and review.reason in (
            'CORRUPTION_EXCEPTION', 'DISASTER_EXCEPTION', 'POLITICAL_INFORMATION',
            'RELIGIOUS_CONSTRUCTIVE', 'ENTERTAINMENT_INSPIRATIONAL', 'OTHER'
          )
      )
      and not exists (
        select 1 from public.news_duplicate_relations duplicate
        where duplicate.duplicate_kind = 'HARD'
          and duplicate.related_news_item_id = item.id
      )
  );
$$;
revoke all on function private.is_news_item_publishable(uuid) from public;

create or replace function private.read_news_public_items()
returns table (
  id uuid,
  title text,
  summary text,
  official_url text,
  original_publisher_url text,
  published_at timestamptz,
  region public.news_region,
  province text,
  source_name text,
  source_type public.news_source_type,
  source_group public.news_source_group,
  source_url text,
  verification_level public.official_source_verification_level,
  last_verified_at timestamptz,
  thumbnail_url text,
  categories public.news_category_code[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    item.id,
    item.title,
    item.summary,
    item.official_url,
    item.original_publisher_url,
    item.published_at,
    item.region,
    item.province,
    source.name,
    source.news_source_type,
    source.news_source_group,
    source.source_url,
    source.verification_level,
    item.last_verified_at,
    case
      when item.thumbnail_permission in ('SOURCE_METADATA', 'EXPLICITLY_ALLOWED')
        and exists (
          select 1 from public.news_source_assessments assessment
          where assessment.source_id = item.source_id
            and assessment.id = (
              select latest_assessment.id
              from public.news_source_assessments latest_assessment
              where latest_assessment.source_id = item.source_id
              order by latest_assessment.assessed_at desc, latest_assessment.id desc
              limit 1
            )
            and assessment.thumbnail_permission = item.thumbnail_permission
            and assessment.terms_url is not null
            and (assessment.expires_at is null or assessment.expires_at > now())
        ) then item.thumbnail_url
      else null
    end,
    coalesce(category_list.categories, array[]::public.news_category_code[])
  from public.news_items item
  join public.official_sources source on source.id = item.source_id
  left join lateral (
    select array_agg(category.code order by category.code) as categories
    from public.news_item_categories assignment
    join public.news_categories category on category.id = assignment.category_id
    join public.news_source_category_scopes scope
      on scope.source_id = item.source_id
     and scope.category_id = assignment.category_id
     and scope.enabled
    where assignment.news_item_id = item.id and category.enabled
  ) category_list on true
  where private.is_news_item_publishable(item.id);
$$;
revoke all on function private.read_news_public_items() from public;
grant execute on function private.read_news_public_items() to anon, authenticated;

create view public.news_public_items
with (security_invoker = true)
as select * from private.read_news_public_items();
grant select on public.news_public_items to anon, authenticated;

create or replace function private.read_public_official_sources()
returns table (
  id uuid,
  institution_code text,
  name text,
  unit_name text,
  country_code text,
  city text,
  platform public.official_source_platform,
  handle text,
  source_url text,
  official_website text,
  verification_level public.official_source_verification_level,
  priority public.official_source_priority,
  category_scope jsonb,
  last_verified_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    source.id, source.institution_code, source.name, source.unit_name,
    source.country_code, source.city, source.platform, source.handle,
    source.source_url, source.official_website, source.verification_level,
    source.priority, source.category_scope, source.last_verified_at
  from public.official_sources source
  where source.enabled
    and source.registry_status = 'VERIFIED'
    and source.verification_level in ('A', 'B')
    and source.verification_status = 'verified'
    and source.last_verified_at is not null
    and source.is_active
    and not source.is_demo;
$$;
revoke all on function private.read_public_official_sources() from public;
grant execute on function private.read_public_official_sources() to anon, authenticated;

create view public.official_sources_public
with (security_invoker = true)
as select * from private.read_public_official_sources();
grant select on public.official_sources_public to anon, authenticated;

alter table public.news_categories enable row level security;
alter table public.news_source_category_scopes enable row level security;
alter table public.news_item_categories enable row level security;
alter table public.news_editorial_reviews enable row level security;
alter table public.news_duplicate_relations enable row level security;
alter table public.news_source_integrations enable row level security;
alter table public.news_source_assessments enable row level security;

create policy "Platform admins manage news categories" on public.news_categories
for all to authenticated using (private.can_manage_global_news_taxonomy())
with check (private.can_manage_global_news_taxonomy());
create policy "News admins manage source category scopes" on public.news_source_category_scopes
for all to authenticated using (private.can_manage_news_source(source_id))
with check (private.can_manage_news_source(source_id));
create policy "News admins manage item categories" on public.news_item_categories
for all to authenticated using (private.can_manage_news_item(news_item_id))
with check (private.can_manage_news_item(news_item_id));
create policy "News admins read editorial reviews" on public.news_editorial_reviews
for select to authenticated using (private.can_manage_news_item(news_item_id));
create policy "News admins append editorial reviews" on public.news_editorial_reviews
for insert to authenticated with check (
  private.can_manage_news_item(news_item_id)
  and reviewed_by = (select auth.uid())
);
create policy "News admins manage duplicate relations" on public.news_duplicate_relations
for all to authenticated using (
  private.can_manage_news_item(news_item_id)
  and private.can_manage_news_item(related_news_item_id)
) with check (
  private.can_manage_news_item(news_item_id)
  and private.can_manage_news_item(related_news_item_id)
  and (reviewed_by is null or reviewed_by = (select auth.uid()))
);
create policy "News admins manage source integrations" on public.news_source_integrations
for all to authenticated using (private.can_manage_news_source(source_id))
with check (
  private.can_manage_news_source(source_id)
  and (not enabled or private.is_news_integration_authorized(source_id))
);
create policy "News admins read source assessments" on public.news_source_assessments
for select to authenticated using (private.can_manage_news_source(source_id));
create policy "News admins append source assessments" on public.news_source_assessments
for insert to authenticated with check (
  private.can_manage_news_source(source_id)
  and assessed_by = (select auth.uid())
);

drop policy if exists "Public can read publishable official sources" on public.official_sources;
drop policy if exists "Public reads enabled verified official sources" on public.official_sources;
revoke all on public.official_sources from anon, authenticated;
grant select, insert, update, delete on public.official_sources to authenticated;

drop policy "Public reads items from enabled official sources" on public.official_source_items;
revoke all on public.official_source_items from anon, authenticated;
grant select, insert, update, delete on public.official_source_items to authenticated;

drop policy "Public can read published news" on public.news_items;
revoke all on public.news_items from anon, authenticated;
grant select, insert, update, delete on public.news_items to authenticated;

revoke all on public.news_categories, public.news_source_category_scopes,
  public.news_item_categories, public.news_editorial_reviews,
  public.news_duplicate_relations, public.news_source_integrations,
  public.news_source_assessments from anon, authenticated;
grant select, insert, update, delete on public.news_categories,
  public.news_source_category_scopes, public.news_item_categories,
  public.news_duplicate_relations, public.news_source_integrations to authenticated;
grant select, insert on public.news_editorial_reviews,
  public.news_source_assessments to authenticated;

insert into public.news_categories (code, label)
select taxonomy.code, initcap(replace(taxonomy.code::text, '_', ' '))
from unnest(enum_range(null::public.news_category_code)) as taxonomy(code);

commit;
