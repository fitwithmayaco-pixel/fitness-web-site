-- ==============================================================================
-- FitWithMaya E-Book Library: Complete Supabase Database & Storage Setup
-- Copy and paste this ENTIRE script into your Supabase project's "SQL Editor"
-- and click "RUN" (green button).
-- ==============================================================================

-- 1. Create 'books' table
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Unknown Author',
  category TEXT DEFAULT 'Wellness',
  description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  pdf_url TEXT NOT NULL,
  page_count INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'reading_progress' table
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES public.books(id) ON DELETE CASCADE,
  page INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist so you can safely re-run this script
DROP POLICY IF EXISTS "Allow public read access on books" ON public.books;
DROP POLICY IF EXISTS "Allow all users to insert books" ON public.books;
DROP POLICY IF EXISTS "Allow all users to update books" ON public.books;
DROP POLICY IF EXISTS "Allow all users to delete books" ON public.books;

DROP POLICY IF EXISTS "Allow users to read progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Allow users to insert/update progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Allow users to delete progress" ON public.reading_progress;

-- 4. RLS Policies for 'books'
-- Allow everyone to read/view books (so deployed app visitors can see all books)
CREATE POLICY "Allow public read access on books"
  ON public.books FOR SELECT
  USING (true);

-- Allow inserting books
CREATE POLICY "Allow all users to insert books"
  ON public.books FOR INSERT
  WITH CHECK (true);

-- Allow updating books
CREATE POLICY "Allow all users to update books"
  ON public.books FOR UPDATE
  USING (true);

-- Allow deleting books
CREATE POLICY "Allow all users to delete books"
  ON public.books FOR DELETE
  USING (true);

-- 5. RLS Policies for 'reading_progress'
CREATE POLICY "Allow users to read progress"
  ON public.reading_progress FOR SELECT
  USING (true);

CREATE POLICY "Allow users to insert/update progress"
  ON public.reading_progress FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Storage Bucket setup for 'ebooks' (PDFs and Covers)
-- Sets file_size_limit to 52428800 bytes (50 MB) and removes mime-type restrictions
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
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ebooks');

CREATE POLICY "Anyone can upload ebooks"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ebooks');

CREATE POLICY "Anyone can update ebooks"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ebooks');

CREATE POLICY "Anyone can delete ebooks"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ebooks');
