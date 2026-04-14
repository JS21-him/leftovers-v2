-- Profile table extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  household_size int not null default 1,
  dietary_preferences text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Fridge items
create table public.fridge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  expiry_date date,
  created_at timestamptz not null default now()
);

-- Shopping list
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Saved recipes
create table public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  emoji text not null default '🍳',
  ingredients jsonb not null default '[]',
  instructions text[] not null default '{}',
  cook_time_minutes int not null default 0,
  difficulty text not null default 'Easy',
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.fridge_items enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.saved_recipes enable row level security;

create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own fridge" on public.fridge_items for all using (auth.uid() = user_id);
create policy "Users manage own shopping" on public.shopping_list_items for all using (auth.uid() = user_id);
create policy "Users manage own recipes" on public.saved_recipes for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
