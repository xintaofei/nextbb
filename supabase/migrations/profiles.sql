-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar text,
  email text not null unique,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: allow users to read/write their own profile
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

