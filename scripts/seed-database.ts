import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const mockProjects = [
  {
    name: 'MetaVerse Finance',
    description: 'Revolutionary DeFi platform bringing traditional finance to the metaverse. Earn yield on your crypto assets while exploring virtual worlds.',
    logo_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop',
    token_name: 'MetaVerse Token',
    token_symbol: 'MVT',
    total_supply: 1000000000,
    token_price: 0.05,
    hard_cap: 2500000,
    soft_cap: 1000000,
    sale_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    website: 'https://metaverse-finance.example.com',
    twitter: 'https://twitter.com/metaverse',
    telegram: 'https://t.me/metaverse',
    vesting_schedule: {
      tge_percent: 20,
      cliff_months: 3,
      vesting_months: 12,
      description: '20% at TGE, 3-month cliff, then 12-month linear vesting',
    },
  },
  {
    name: 'ChainGuard Protocol',
    description: 'Next-generation blockchain security solution powered by AI. Protect your smart contracts and digital assets with advanced threat detection.',
    logo_url: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=1200&h=400&fit=crop',
    token_name: 'ChainGuard Token',
    token_symbol: 'CGT',
    total_supply: 500000000,
    token_price: 0.08,
    hard_cap: 3000000,
    soft_cap: 1500000,
    raised_amount: 1875000,
    sale_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'live',
    website: 'https://chainguard.example.com',
    twitter: 'https://twitter.com/chainguard',
    telegram: 'https://t.me/chainguard',
    discord: 'https://discord.gg/chainguard',
    vesting_schedule: {
      tge_percent: 25,
      cliff_months: 2,
      vesting_months: 10,
      description: '25% at TGE, 2-month cliff, then 10-month linear vesting',
    },
  },
  {
    name: 'GreenChain Energy',
    description: 'Sustainable blockchain for renewable energy trading. Connect solar panel owners with energy consumers in a decentralized marketplace.',
    logo_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=400&fit=crop',
    token_name: 'GreenChain Token',
    token_symbol: 'GCE',
    total_supply: 750000000,
    token_price: 0.12,
    hard_cap: 5000000,
    soft_cap: 2000000,
    raised_amount: 3250000,
    sale_start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'live',
    website: 'https://greenchain.example.com',
    twitter: 'https://twitter.com/greenchain',
    telegram: 'https://t.me/greenchain',
    vesting_schedule: {
      tge_percent: 15,
      cliff_months: 4,
      vesting_months: 16,
      description: '15% at TGE, 4-month cliff, then 16-month linear vesting',
    },
  },
  {
    name: 'GameFi Universe',
    description: 'Play-to-earn gaming ecosystem with cross-game asset interoperability. Build, trade, and earn in multiple blockchain games.',
    logo_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=400&fit=crop',
    token_name: 'GameFi Token',
    token_symbol: 'GFU',
    total_supply: 2000000000,
    token_price: 0.03,
    hard_cap: 1500000,
    soft_cap: 750000,
    raised_amount: 1500000,
    sale_start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ended',
    website: 'https://gamefi-universe.example.com',
    twitter: 'https://twitter.com/gamefi',
    telegram: 'https://t.me/gamefi',
    discord: 'https://discord.gg/gamefi',
    vesting_schedule: {
      tge_percent: 30,
      cliff_months: 1,
      vesting_months: 8,
      description: '30% at TGE, 1-month cliff, then 8-month linear vesting',
    },
  },
  {
    name: 'QuantumSwap DEX',
    description: 'High-speed decentralized exchange with zero-knowledge proofs. Trade any token with instant finality and complete privacy.',
    logo_url: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=1200&h=400&fit=crop',
    token_name: 'QuantumSwap Token',
    token_symbol: 'QSD',
    total_supply: 1500000000,
    token_price: 0.15,
    hard_cap: 4000000,
    soft_cap: 2000000,
    raised_amount: 4000000,
    sale_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ended',
    website: 'https://quantumswap.example.com',
    twitter: 'https://twitter.com/quantumswap',
    telegram: 'https://t.me/quantumswap',
    vesting_schedule: {
      tge_percent: 20,
      cliff_months: 3,
      vesting_months: 12,
      description: '20% at TGE, 3-month cliff, then 12-month linear vesting',
    },
  },
];

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert(mockProjects)
      .select();

    if (error) {
      console.error('Error seeding database:', error);
      throw error;
    }

    console.log(`Successfully seeded ${data.length} projects`);
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
