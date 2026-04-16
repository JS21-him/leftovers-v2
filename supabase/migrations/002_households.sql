-- Households table
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Household',
  owner_id uuid references auth.users(id) on delete cascade not null,
  invite_code text not null unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz not null default now()
);

-- Household members
create table public.household_members (
  household_id uuid references public.households(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Add household_id to fridge_items and shopping_list_items
alter table public.fridge_items add column household_id uuid references public.households(id) on delete cascade;
alter table public.shopping_list_items add column household_id uuid references public.households(id) on delete cascade;

-- RLS
alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Households: members can read, owner can update/delete
create policy "Household members can view" on public.households
  for select using (
    exists (
      select 1 from public.household_members
      where household_id = households.id and user_id = auth.uid()
    )
  );

create policy "Household owner can update" on public.households
  for update using (owner_id = auth.uid());

create policy "Household owner can delete" on public.households
  for delete using (owner_id = auth.uid());

create policy "Authenticated users can insert household" on public.households
  for insert with check (owner_id = auth.uid());

-- Household members: members can view their own household's members
create policy "Members can view household members" on public.household_members
  for select using (
    exists (
      select 1 from public.household_members hm
      where hm.household_id = household_members.household_id and hm.user_id = auth.uid()
    )
  );

create policy "Users can join a household" on public.household_members
  for insert with check (user_id = auth.uid());

create policy "Users can leave a household" on public.household_members
  for delete using (user_id = auth.uid());

-- Update fridge RLS: household members can access household fridge
drop policy "Users manage own fridge" on public.fridge_items;
create policy "Household members manage fridge" on public.fridge_items
  for all using (
    -- personal item (no household yet)
    (household_id is null and auth.uid() = user_id)
    or
    -- household item: user must be a member
    (household_id is not null and exists (
      select 1 from public.household_members
      where household_id = fridge_items.household_id and user_id = auth.uid()
    ))
  );

-- Update shopping RLS: household members can access household shopping list
drop policy "Users manage own shopping" on public.shopping_list_items;
create policy "Household members manage shopping" on public.shopping_list_items
  for all using (
    (household_id is null and auth.uid() = user_id)
    or
    (household_id is not null and exists (
      select 1 from public.household_members
      where household_id = shopping_list_items.household_id and user_id = auth.uid()
    ))
  );

-- Auto-create household + membership on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_household_id uuid;
begin
  insert into public.profiles (id) values (new.id);
  insert into public.households (owner_id) values (new.id) returning id into new_household_id;
  insert into public.household_members (household_id, user_id) values (new_household_id, new.id);
  return new;
end;
$$;

-- Migrate existing users: create a household for each user who doesn't have one
do $$
declare
  u record;
  new_household_id uuid;
begin
  for u in
    select id from auth.users
    where id not in (select user_id from public.household_members)
  loop
    insert into public.households (owner_id) values (u.id) returning id into new_household_id;
    insert into public.household_members (household_id, user_id) values (new_household_id, u.id);
    -- migrate existing fridge items
    update public.fridge_items set household_id = new_household_id where user_id = u.id and household_id is null;
    -- migrate existing shopping items
    update public.shopping_list_items set household_id = new_household_id where user_id = u.id and household_id is null;
  end loop;
end;
$$;
