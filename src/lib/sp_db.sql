-- -------------------------------------------------------------
-- 1. Create the 'categories' table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) optionally, or leave open for simple client setups
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated insert/update access to categories" ON public.categories FOR ALL TO public USING (true);


-- -------------------------------------------------------------
-- 2. Create the 'questions' table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium'::text NOT NULL,
    tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
    url_1 TEXT,
    url_2 TEXT,
    status TEXT CHECK (status IN ('Draft', 'Published')) DEFAULT 'Published'::text NOT NULL,
    upvotes INTEGER DEFAULT 0 NOT NULL,
    downvotes INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to questions" ON public.questions FOR SELECT TO public USING (true);
CREATE POLICY "Allow authenticated full access to questions" ON public.questions FOR ALL TO public USING (true);


-- -------------------------------------------------------------
-- 3. Create the 'profiles' table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Will match Auth UUIDs
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user'::text NOT NULL,
    plain_password TEXT, -- For simple display reference of administrative setups
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow full access to profiles" ON public.profiles FOR ALL TO public USING (true);


-- -------------------------------------------------------------
-- 4. Create the 'user_progress' table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('solved', 'retry', 'none')) DEFAULT 'none'::text NOT NULL,
    notes TEXT DEFAULT ''::text NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_question_progress UNIQUE (user_id, question_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to user_progress" ON public.user_progress FOR ALL TO public USING (true);


-- -------------------------------------------------------------
-- 5. Create the 'user_votes' table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    vote TEXT CHECK (vote IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_question_vote UNIQUE (user_id, question_id)
);

ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to user_votes" ON public.user_votes FOR ALL TO public USING (true);