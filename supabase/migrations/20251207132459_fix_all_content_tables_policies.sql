/*
  # Fix All Content Tables Policies

  1. Changes
    - Drop existing restrictive policies
    - Add permissive policies to allow seeding and content management
  
  2. Security
    - Allow inserts on all content tables for seeding purposes
    - Keep read policies public for published content
*/

DROP POLICY IF EXISTS "Blog posts are publicly readable" ON blog_posts;
DROP POLICY IF EXISTS "Allow blog post inserts for seeding" ON blog_posts;

CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Anyone can insert blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert FAQs"
  ON faqs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert team members"
  ON team_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert job postings"
  ON job_postings FOR INSERT
  WITH CHECK (true);