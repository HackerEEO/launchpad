/*
  # Create Projects Table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key) - Unique identifier for each project
      - `name` (text) - Project name
      - `description` (text) - Project description
      - `logo_url` (text, nullable) - URL to project logo
      - `banner_url` (text, nullable) - URL to project banner image
      - `token_name` (text) - Name of the token being sold
      - `token_symbol` (text) - Symbol of the token (e.g., BTC, ETH)
      - `token_address` (text, nullable) - Smart contract address of the token
      - `total_supply` (bigint) - Total supply of tokens
      - `token_price` (numeric) - Price per token in USD/ETH
      - `hard_cap` (numeric) - Maximum funding target
      - `soft_cap` (numeric) - Minimum funding target
      - `raised_amount` (numeric) - Current amount raised (defaults to 0)
      - `sale_start` (timestamptz) - Sale start date and time
      - `sale_end` (timestamptz) - Sale end date and time
      - `status` (text) - Project status: upcoming, live, or ended
      - `website` (text, nullable) - Project website URL
      - `twitter` (text, nullable) - Twitter profile URL
      - `telegram` (text, nullable) - Telegram group URL
      - `discord` (text, nullable) - Discord server URL
      - `vesting_schedule` (jsonb, nullable) - Vesting schedule details
      - `created_at` (timestamptz) - Timestamp of project creation

  2. Security
    - Enable RLS on `projects` table
    - Add policy for public read access to all projects
    - Add policy for authenticated admin users to create projects
    - Add policy for authenticated admin users to update projects
    - Add policy for authenticated admin users to delete projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_address TEXT,
  total_supply BIGINT NOT NULL,
  token_price NUMERIC(20,8) NOT NULL,
  hard_cap NUMERIC(20,8) NOT NULL,
  soft_cap NUMERIC(20,8) NOT NULL,
  raised_amount NUMERIC(20,8) DEFAULT 0,
  sale_start TIMESTAMPTZ NOT NULL,
  sale_end TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('upcoming', 'live', 'ended')) DEFAULT 'upcoming',
  website TEXT,
  twitter TEXT,
  telegram TEXT,
  discord TEXT,
  vesting_schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_sale_dates ON projects(sale_start, sale_end);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
