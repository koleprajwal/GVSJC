-- Create Teacher Subjects assignment table
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class, subject)
);

-- Create Class Teachers assignment table
CREATE TABLE IF NOT EXISTS public.class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class TEXT UNIQUE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add taken_by tracking to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS taken_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- Create Policies
DO $$ BEGIN
  CREATE POLICY "Public read – teacher_subjects" ON public.teacher_subjects FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon write – teacher_subjects" ON public.teacher_subjects FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read – class_teachers" ON public.class_teachers FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon write – class_teachers" ON public.class_teachers FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed a dummy faculty member with the mock teacher ID if not already there
INSERT INTO public.faculty (id, name, subject, qualification, exp, teacher_id, email, password)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Hon. Shri. Pravin Mali',
  'English',
  'M.A. English, B.Ed.',
  '12 years',
  'TCH-0001',
  'teacher@school.com',
  'teacher@gvsc'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  teacher_id = EXCLUDED.teacher_id,
  email = EXCLUDED.email,
  password = EXCLUDED.password;

-- Seed mock teacher subjects (mock teacher teaches English to Class 5 and Class 6)
INSERT INTO public.teacher_subjects (teacher_id, class, subject)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Class 5', 'English'),
  ('00000000-0000-0000-0000-000000000000', 'Class 6', 'English')
ON CONFLICT (class, subject) DO NOTHING;

-- Seed mock class teacher (mock teacher is class teacher of Class 5)
INSERT INTO public.class_teachers (class, teacher_id)
VALUES ('Class 5', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (class) DO NOTHING;
