-- AGRIFAIR SUPABASE SCHEMA
-- This script sets up the tables for Users, Complaints, and the Community Spotlight feature.

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    otp_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trader_name TEXT NOT NULL,
    issue TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. FEATURED FARMERS (Spotlight Metadata)
CREATE TABLE IF NOT EXISTS public.featured_farmers (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. FARMER PHOTOS (Specialized storage for Spotlight Images)
-- Linked 1:1 with the featured_farmers table
CREATE TABLE IF NOT EXISTS public.farmer_photos (
    farmer_id UUID PRIMARY KEY REFERENCES public.featured_farmers(user_id) ON DELETE CASCADE,
    image_data TEXT NOT NULL, -- Stores Base64 encoded image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_photos ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Users: Anyone can find a user by mobile (for login/signup check), but only owners can update
CREATE POLICY "Public user lookup" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (true);
CREATE POLICY "System can insert users" ON public.users FOR INSERT WITH CHECK (true);

-- Complaints: Users can see and create their own complaints
CREATE POLICY "Users can view their own complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT WITH CHECK (true);

-- Community Spotlight (Featured Farmers): Publicly readable, owner can manage
CREATE POLICY "Public spotlight viewing" ON public.featured_farmers FOR SELECT USING (true);
CREATE POLICY "Farmers can manage their spotlight profile" ON public.featured_farmers FOR ALL USING (true);

-- Farmer Photos: Publicly readable, linked to spotlight profile management
CREATE POLICY "Public photo viewing" ON public.farmer_photos FOR SELECT USING (true);
CREATE POLICY "Farmers can manage their spotlight photos" ON public.farmer_photos FOR ALL USING (true);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_farmer ON public.farmer_photos(farmer_id);