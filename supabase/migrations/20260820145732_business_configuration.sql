create table public.stage_mappings (
  id bigint generated always as identity primary key,
  entity_type text not null check (btrim(entity_type) <> ''),
  stage_code text not null check (btrim(stage_code) <> ''),
  classification text not null check (btrim(classification) <> ''),
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stage_mappings_entity_code_unique unique (entity_type, stage_code)
);

create table public.dre_category_mappings (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete restrict,
  dre_type text not null check (btrim(dre_type) <> ''),
  dre_group text not null check (btrim(dre_group) <> ''),
  dre_account text not null check (btrim(dre_account) <> ''),
  sign_behavior text,
  source text not null check (btrim(source) <> ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dre_category_mappings_category_source_unique unique (category_id, source)
);

create table public.management_settings (
  setting_key text primary key check (btrim(setting_key) <> ''),
  value jsonb not null,
  value_type text not null check (value_type in ('number', 'string', 'boolean', 'object', 'array')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_settings_value_type_matches check (jsonb_typeof(value) = value_type)
);

create index dre_category_mappings_category_idx on public.dre_category_mappings (category_id);
create index stage_mappings_active_idx on public.stage_mappings (entity_type, classification) where active;

create trigger stage_mappings_set_updated_at before update on public.stage_mappings
for each row execute function public.set_updated_at();
create trigger dre_category_mappings_set_updated_at before update on public.dre_category_mappings
for each row execute function public.set_updated_at();
create trigger management_settings_set_updated_at before update on public.management_settings
for each row execute function public.set_updated_at();

alter table public.stage_mappings enable row level security;
alter table public.dre_category_mappings enable row level security;
alter table public.management_settings enable row level security;

revoke all on table public.stage_mappings, public.dre_category_mappings, public.management_settings from anon, authenticated;
revoke all on sequence public.stage_mappings_id_seq, public.dre_category_mappings_id_seq from anon, authenticated;
