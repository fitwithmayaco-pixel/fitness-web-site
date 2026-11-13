-- ==============================================================================
-- FitWithMaya E-Book Library: Complete Supabase Database & Storage Setup
-- Copy and paste this ENTIRE script into your Supabase project's "SQL Editor"
-- and click "RUN" (green button).
-- ==============================================================================

-- 1. Create 'profiles' table for User & Admin Roles
-- You can go to Supabase Dashboard -> Table Editor -> 'profiles'
-- and change any user's role from 'user' to 'admin' to grant admin privileges!
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'books' table
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Unknown Author',
  category TEXT DEFAULT 'Wellness',
  description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  link TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  page_count INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 'link' column exists and 'pdf_url' is nullable if migrating existing table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '';
ALTER TABLE public.books ALTER COLUMN pdf_url DROP NOT NULL;

-- 3. Create 'reading_progress' table
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES public.books(id) ON DELETE CASCADE,
  page INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for 'profiles'
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

CREATE POLICY "Allow public read access on profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow insert to profiles"
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE USING (true);

-- 6. Trigger to automatically create a profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users into profiles if any
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. RLS Policies for 'books'
DROP POLICY IF EXISTS "Allow public read access on books" ON public.books;
DROP POLICY IF EXISTS "Allow all users to insert books" ON public.books;
DROP POLICY IF EXISTS "Allow all users to update books" ON public.books;
DROP POLICY IF EXISTS "Allow all users to delete books" ON public.books;

CREATE POLICY "Allow public read access on books"
  ON public.books FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert books"
  ON public.books FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update books"
  ON public.books FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete books"
  ON public.books FOR DELETE USING (true);

-- 8. RLS Policies for 'reading_progress'
DROP POLICY IF EXISTS "Allow users to read progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Allow users to insert/update progress" ON public.reading_progress;

CREATE POLICY "Allow users to read progress"
  ON public.reading_progress FOR SELECT USING (true);

CREATE POLICY "Allow users to insert/update progress"
  ON public.reading_progress FOR ALL USING (true) WITH CHECK (true);

-- 9. Storage Bucket setup for 'ebooks' (PDFs and Covers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ebooks', 'ebooks', true, 52428800, null)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = null;

-- Storage Policies for 'ebooks' bucket
DROP POLICY IF EXISTS "Public can view ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update ebooks" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete ebooks" ON storage.objects;

CREATE POLICY "Public can view ebooks"
  ON storage.objects FOR SELECT USING (bucket_id = 'ebooks');

CREATE POLICY "Anyone can upload ebooks"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ebooks');

CREATE POLICY "Anyone can update ebooks"
  ON storage.objects FOR UPDATE USING (bucket_id = 'ebooks');

CREATE POLICY "Anyone can delete ebooks"
  ON storage.objects FOR DELETE USING (bucket_id = 'ebooks');
