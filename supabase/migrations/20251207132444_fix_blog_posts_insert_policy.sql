/*
  # Fix Blog Posts Insert Policy

  1. Changes
    - Add policy to allow anyone to insert blog posts (for seeding and admin purposes)
    - This allows the seeding script to populate initial blog content
  
  2. Security
    - In production, this should be restricted to admin users only
    - For now, allowing inserts for development and seeding purposes
*/

CREATE POLICY "Allow blog post inserts for seeding"
  ON blog_posts FOR INSERT
  WITH CHECK (true);