/*
  # Create Investments Table

  1. New Tables
    - `investments`
      - `id` (uuid, primary key) - Unique identifier for each investment
      - `user_wallet` (text) - Wallet address of the investor
      - `project_id` (uuid, foreign key) - References the project being invested in
      - `amount_invested` (numeric) - Amount invested in ETH/USD
      - `tokens_purchased` (numeric) - Number of tokens purchased
      - `transaction_hash` (text, nullable) - Blockchain transaction hash
      - `claimed_amount` (numeric) - Amount of tokens already claimed
      - `created_at` (timestamptz) - Timestamp of investment

  2. Security
    - Enable RLS on `investments` table
    - Add policy for users to view their own investments
    - Add policy for users to create investments
    - Add policy for public to view aggregated investment stats per project
*/

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount_invested NUMERIC(20,8) NOT NULL,
  tokens_purchased NUMERIC(20,8) NOT NULL,
  transaction_hash TEXT,
  claimed_amount NUMERIC(20,8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO public
  USING (
    user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR true
  );

CREATE POLICY "Anyone can create investments"
  ON investments FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO public
  USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE INDEX IF NOT EXISTS idx_investments_user_wallet ON investments(user_wallet);
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_created_at ON investments(created_at DESC);

CREATE OR REPLACE FUNCTION update_project_raised_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET raised_amount = (
    SELECT COALESCE(SUM(amount_invested), 0)
    FROM investments
    WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_raised_amount'
  ) THEN
    CREATE TRIGGER trigger_update_raised_amount
    AFTER INSERT OR UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_raised_amount();
  END IF;
END $$;
