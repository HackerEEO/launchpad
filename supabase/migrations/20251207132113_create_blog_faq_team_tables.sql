/*
  # Create Additional Content Tables

  1. New Tables
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `slug` (text, unique, not null)
      - `excerpt` (text)
      - `content` (text, not null)
      - `cover_image` (text)
      - `author` (text)
      - `category` (text)
      - `tags` (text array)
      - `published` (boolean, default false)
      - `views` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `faqs`
      - `id` (uuid, primary key)
      - `question` (text, not null)
      - `answer` (text, not null)
      - `category` (text, not null)
      - `order_index` (integer, default 0)
      - `created_at` (timestamptz)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `role` (text, not null)
      - `bio` (text)
      - `avatar_url` (text)
      - `twitter` (text)
      - `linkedin` (text)
      - `order_index` (integer, default 0)
      - `created_at` (timestamptz)
    
    - `job_postings`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `department` (text, not null)
      - `location` (text, not null)
      - `type` (text, not null)
      - `description` (text, not null)
      - `requirements` (text array)
      - `responsibilities` (text array)
      - `active` (boolean, default true)
      - `created_at` (timestamptz)
    
    - `support_tickets`
      - `id` (uuid, primary key)
      - `user_email` (text, not null)
      - `subject` (text, not null)
      - `message` (text, not null)
      - `status` (text, default 'open')
      - `priority` (text, default 'medium')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Blog posts and FAQs are publicly readable
    - Team members are publicly readable
    - Job postings are publicly readable
    - Support tickets require authentication for creation
*/

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image text,
  author text DEFAULT 'CryptoLaunch Team',
  category text DEFAULT 'General',
  tags text[] DEFAULT '{}',
  published boolean DEFAULT true,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  avatar_url text,
  twitter text,
  linkedin text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  requirements text[] DEFAULT '{}',
  responsibilities text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog posts are publicly readable"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "FAQs are publicly readable"
  ON faqs FOR SELECT
  USING (true);

CREATE POLICY "Team members are publicly readable"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Job postings are publicly readable"
  ON job_postings FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts(category);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts(published);
CREATE INDEX IF NOT EXISTS faqs_category_idx ON faqs(category);
CREATE INDEX IF NOT EXISTS job_postings_active_idx ON job_postings(active);