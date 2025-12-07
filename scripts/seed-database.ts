import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const mockProjects = [
  {
    name: 'MetaVerse Finance',
    description: 'Revolutionary DeFi platform bringing traditional finance to the metaverse. Earn yield on your crypto assets while exploring virtual worlds with innovative yield farming strategies.',
    logo_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop',
    token_name: 'MetaVerse Token',
    token_symbol: 'MVT',
    total_supply: 1000000000,
    token_price: 0.05,
    hard_cap: 2500000,
    soft_cap: 1000000,
    raised_amount: 0,
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
    description: 'Next-generation blockchain security solution powered by AI. Protect your smart contracts and digital assets with advanced threat detection and real-time monitoring.',
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
    description: 'Sustainable blockchain for renewable energy trading. Connect solar panel owners with energy consumers in a decentralized marketplace built on carbon-neutral infrastructure.',
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
    description: 'Play-to-earn gaming ecosystem with cross-game asset interoperability. Build, trade, and earn in multiple blockchain games with true ownership.',
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
    description: 'High-speed decentralized exchange with zero-knowledge proofs. Trade any token with instant finality and complete privacy powered by cutting-edge cryptography.',
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
  {
    name: 'AI Oracle Network',
    description: 'Decentralized oracle network powered by artificial intelligence. Bringing real-world data on-chain with unprecedented accuracy and reliability.',
    logo_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=400&fit=crop',
    token_name: 'AI Oracle Token',
    token_symbol: 'AIO',
    total_supply: 800000000,
    token_price: 0.10,
    hard_cap: 3500000,
    soft_cap: 1800000,
    raised_amount: 2100000,
    sale_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'live',
    website: 'https://aioracle.example.com',
    twitter: 'https://twitter.com/aioracle',
    telegram: 'https://t.me/aioracle',
    discord: 'https://discord.gg/aioracle',
    vesting_schedule: {
      tge_percent: 18,
      cliff_months: 3,
      vesting_months: 15,
      description: '18% at TGE, 3-month cliff, then 15-month linear vesting',
    },
  },
  {
    name: 'NexGen NFT Marketplace',
    description: 'Next-generation NFT marketplace with AI-powered discovery and dynamic pricing. Trade digital art, collectibles, and virtual real estate seamlessly.',
    logo_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&h=400&fit=crop',
    token_name: 'NexGen Token',
    token_symbol: 'NXG',
    total_supply: 600000000,
    token_price: 0.06,
    hard_cap: 2000000,
    soft_cap: 1000000,
    raised_amount: 0,
    sale_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    website: 'https://nexgennft.example.com',
    twitter: 'https://twitter.com/nexgennft',
    telegram: 'https://t.me/nexgennft',
    vesting_schedule: {
      tge_percent: 25,
      cliff_months: 2,
      vesting_months: 10,
      description: '25% at TGE, 2-month cliff, then 10-month linear vesting',
    },
  },
  {
    name: 'CrossChain Bridge Protocol',
    description: 'Universal bridge protocol enabling seamless asset transfers across all major blockchain networks with minimal fees and maximum security.',
    logo_url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1200&h=400&fit=crop',
    token_name: 'CrossChain Token',
    token_symbol: 'XCB',
    total_supply: 900000000,
    token_price: 0.09,
    hard_cap: 4500000,
    soft_cap: 2250000,
    raised_amount: 2800000,
    sale_start: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    sale_end: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'live',
    website: 'https://crosschain.example.com',
    twitter: 'https://twitter.com/crosschain',
    telegram: 'https://t.me/crosschain',
    discord: 'https://discord.gg/crosschain',
    vesting_schedule: {
      tge_percent: 22,
      cliff_months: 3,
      vesting_months: 14,
      description: '22% at TGE, 3-month cliff, then 14-month linear vesting',
    },
  },
];

const blogPosts = [
  {
    title: 'Understanding Token Vesting: A Complete Guide',
    slug: 'understanding-token-vesting-complete-guide',
    excerpt: 'Learn everything about token vesting schedules, why they matter, and how they protect your investment in crypto projects.',
    content: 'Token vesting is a critical mechanism in cryptocurrency projects that ensures long-term commitment from team members and early investors. By locking tokens and releasing them gradually over time, vesting schedules align incentives and reduce the risk of immediate sell pressure after a token launch. In this comprehensive guide, we explore the different types of vesting schedules, including cliff periods, linear vesting, and milestone-based releases. We also discuss why vesting is crucial for project success and how it protects both investors and project teams. Understanding vesting terms is essential before participating in any token sale.',
    cover_image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop',
    author_name: 'Sarah Chen',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    category: 'Education',
    tags: ['vesting', 'tokenomics', 'education'],
    reading_time: 8,
    published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'How to Evaluate IDO Projects in 2024',
    slug: 'how-to-evaluate-ido-projects-2024',
    excerpt: 'Expert tips on conducting due diligence before investing in Initial DEX Offerings.',
    content: 'Evaluating IDO projects requires a systematic approach to identify legitimate opportunities and avoid scams. Start by thoroughly reviewing the team credentials - look for doxxed team members with verifiable blockchain industry experience. Examine audit reports from reputable firms like CertiK or PeckShield to ensure smart contract security. Analyze the tokenomics carefully, checking for reasonable allocations, fair vesting schedules, and sustainable utility. Review the whitepaper for technical feasibility and market fit. Check community engagement across social media platforms. Verify partnerships and backers. Always DYOR (Do Your Own Research) and never invest more than you can afford to lose.',
    cover_image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&h=400&fit=crop',
    author_name: 'Michael Roberts',
    author_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    category: 'Investment',
    tags: ['ido', 'investment', 'due diligence'],
    reading_time: 12,
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Top 10 DeFi Trends to Watch This Year',
    slug: 'top-10-defi-trends-2024',
    excerpt: 'Discover the emerging trends shaping the future of decentralized finance.',
    content: 'The DeFi landscape is rapidly evolving with groundbreaking innovations. Liquid staking derivatives are revolutionizing how users earn yields while maintaining liquidity. Real-world asset tokenization is bringing traditional finance on-chain, from real estate to treasury bonds. AI-powered protocols are optimizing yield strategies automatically. Cross-chain bridges are enabling seamless asset transfers across ecosystems. Decentralized identity solutions are enhancing privacy and compliance. Account abstraction is making Web3 more user-friendly. Modular blockchain architectures are improving scalability. Social trading and copy trading platforms are democratizing DeFi strategies. Zero-knowledge proofs are enabling private DeFi transactions. Regulatory-compliant DeFi is emerging to attract institutional capital.',
    cover_image: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=800&h=400&fit=crop',
    author_name: 'Emma Thompson',
    author_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    category: 'Trends',
    tags: ['defi', 'trends', 'innovation'],
    reading_time: 10,
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Security Best Practices for Crypto Investors',
    slug: 'security-best-practices-crypto-investors',
    excerpt: 'Protect your digital assets with these essential security measures and best practices.',
    content: 'Cryptocurrency security is paramount in protecting your digital assets from theft and loss. Always use hardware wallets like Ledger or Trezor for storing significant holdings. Enable two-factor authentication on all exchange accounts and use authenticator apps instead of SMS. Never share your seed phrase with anyone - legitimate services will never ask for it. Be wary of phishing attacks through emails, social media, and fake websites. Use strong, unique passwords for each platform and consider a password manager. Keep your software and wallet firmware updated. Verify smart contract addresses before interacting with them. Use a separate computer or phone for crypto transactions. Consider multi-signature wallets for large amounts. Always do test transactions first.',
    cover_image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop',
    author_name: 'David Park',
    author_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    category: 'Security',
    tags: ['security', 'wallet', 'best practices'],
    reading_time: 9,
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'The Rise of Layer 2 Scaling Solutions',
    slug: 'rise-of-layer-2-scaling-solutions',
    excerpt: 'Exploring how Layer 2 networks are solving blockchain scalability challenges.',
    content: 'Layer 2 scaling solutions have emerged as the answer to blockchain scalability trilemma. Optimistic Rollups like Arbitrum and Optimism are processing thousands of transactions per second at fraction of Layer 1 costs. ZK-Rollups are bringing zero-knowledge proofs to mainstream adoption with projects like zkSync and StarkNet. State channels enable instant, feeless transactions for specific use cases. Sidechains provide EVM compatibility with faster block times. Plasma chains offer security guarantees for specific applications. Each solution makes different trade-offs between security, decentralization, and scalability. The future of blockchain lies in this modular, multi-chain ecosystem where different layers serve different purposes.',
    cover_image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&h=400&fit=crop',
    author_name: 'Alex Chen',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    category: 'Technology',
    tags: ['layer2', 'scaling', 'blockchain'],
    reading_time: 11,
    published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const faqs = [
  { question: 'What is an IDO launchpad?', answer: 'An IDO (Initial DEX Offering) launchpad is a platform that helps crypto projects launch their tokens through decentralized exchanges. It provides a fair and transparent way for investors to participate in early-stage token sales.', category: 'General', order_index: 1 },
  { question: 'How do I participate in a token sale?', answer: 'To participate in a token sale on our platform, you need to connect your Web3 wallet (like MetaMask), complete KYC verification if required, and then commit funds to the project during its sale period. Make sure you have sufficient ETH or the required cryptocurrency for gas fees.', category: 'General', order_index: 2 },
  { question: 'What is token vesting?', answer: 'Token vesting is a mechanism that locks purchased tokens and releases them gradually over time. This ensures long-term commitment from investors and project teams, reducing the risk of immediate sell pressure after launch.', category: 'Tokenomics', order_index: 3 },
  { question: 'Are the projects audited?', answer: 'Yes, we require all projects to undergo smart contract audits by reputable firms like CertiK, PeckShield, or Hacken before launching on our platform. Audit reports are always available in the project details.', category: 'Security', order_index: 4 },
  { question: 'What are the fees for using the launchpad?', answer: 'Investors pay no platform fees for participating in token sales. You only need to cover blockchain gas fees. Projects pay a listing fee and a small percentage of raised funds to access our platform.', category: 'Fees', order_index: 5 },
  { question: 'How do I claim my tokens?', answer: 'After the token sale ends, tokens will be available for claiming based on the vesting schedule. Visit your Dashboard, find the project, and click "Claim Tokens" when they are unlocked. You will need to pay gas fees for the claiming transaction.', category: 'General', order_index: 6 },
  { question: 'What happens if a project does not reach its soft cap?', answer: 'If a project fails to reach its soft cap by the end of the sale period, the sale is considered unsuccessful and all funds are automatically refunded to investors. You can claim your refund from the project page.', category: 'Investment', order_index: 7 },
  { question: 'Can I get a refund after investing?', answer: 'Once you commit funds to a project, the transaction is final and cannot be reversed unless the project fails to reach its soft cap. Always conduct thorough research before investing.', category: 'Investment', order_index: 8 },
  { question: 'Which wallets are supported?', answer: 'We support all major Web3 wallets including MetaMask, WalletConnect, Coinbase Wallet, Trust Wallet, and Ledger hardware wallets. Make sure your wallet is connected to the correct network.', category: 'Technical', order_index: 9 },
  { question: 'How do I submit my project for listing?', answer: 'To list your project on our launchpad, fill out the application form on our website with detailed information about your project, team, tokenomics, and roadmap. Our team will review your submission and contact you within 5-7 business days.', category: 'For Projects', order_index: 10 },
];

const teamMembers = [
  { name: 'Alex Chen', role: 'CEO & Co-Founder', bio: 'Former blockchain architect at ConsenSys with 10+ years in crypto', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', twitter: 'https://twitter.com/alexchen', linkedin: 'https://linkedin.com/in/alexchen', order_index: 1 },
  { name: 'Sarah Martinez', role: 'CTO & Co-Founder', bio: 'Ex-Google engineer specializing in distributed systems and smart contracts', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', twitter: 'https://twitter.com/sarahmartinez', linkedin: 'https://linkedin.com/in/sarahmartinez', order_index: 2 },
  { name: 'Michael Kim', role: 'Head of Product', bio: 'Product leader with experience at Coinbase and Binance', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', twitter: 'https://twitter.com/michaelkim', linkedin: 'https://linkedin.com/in/michaelkim', order_index: 3 },
  { name: 'Emily Zhang', role: 'Head of Marketing', bio: 'Growth strategist who scaled multiple DeFi protocols to 100k+ users', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', twitter: 'https://twitter.com/emilyzhang', linkedin: 'https://linkedin.com/in/emilyzhang', order_index: 4 },
  { name: 'David Thompson', role: 'Lead Smart Contract Developer', bio: 'Solidity expert with 50+ audited smart contracts deployed', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', twitter: 'https://twitter.com/davidthompson', linkedin: 'https://linkedin.com/in/davidthompson', order_index: 5 },
  { name: 'Lisa Park', role: 'Head of Community', bio: 'Community builder managing 500k+ members across Web3 projects', avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', twitter: 'https://twitter.com/lisapark', linkedin: 'https://linkedin.com/in/lisapark', order_index: 6 },
];

const jobPostings = [
  {
    title: 'Senior Blockchain Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are seeking an experienced blockchain engineer to help build and scale our launchpad infrastructure. You will work on smart contract development, protocol design, and security implementations.',
    requirements: ['5+ years of software engineering experience', 'Expert knowledge of Solidity and EVM', 'Experience with DeFi protocols', 'Strong understanding of blockchain security'],
    responsibilities: ['Design and implement smart contracts', 'Conduct code reviews and security audits', 'Optimize gas efficiency', 'Collaborate with cross-functional teams'],
  },
  {
    title: 'Product Manager - Web3',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
    description: 'Join our product team to shape the future of decentralized token launches. You will define product strategy, work with designers and engineers, and drive feature development.',
    requirements: ['3+ years of product management experience', 'Deep understanding of Web3 and DeFi', 'Experience with user research and data analysis', 'Strong communication skills'],
    responsibilities: ['Define product roadmap and strategy', 'Gather and prioritize requirements', 'Work with engineering and design teams', 'Analyze metrics and user feedback'],
  },
  {
    title: 'Community Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are looking for a passionate community manager to grow and engage our global community across Discord, Telegram, Twitter, and other platforms.',
    requirements: ['2+ years of community management experience', 'Active participant in crypto communities', 'Excellent written and verbal communication', 'Experience with Discord and Telegram moderation'],
    responsibilities: ['Manage daily community interactions', 'Organize AMAs and events', 'Create engaging content', 'Monitor sentiment and gather feedback'],
  },
  {
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Help us build beautiful and performant user interfaces for our Web3 platform. You will work with React, TypeScript, and Web3 libraries to create seamless user experiences.',
    requirements: ['3+ years of frontend development experience', 'Expert in React and TypeScript', 'Experience with Web3.js or Ethers.js', 'Strong UI/UX sensibility'],
    responsibilities: ['Build responsive web applications', 'Integrate with smart contracts', 'Optimize performance', 'Collaborate with designers'],
  },
];

async function seedDatabase() {
  console.log('Starting comprehensive database seeding...');

  try {
    console.log('Seeding projects...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .insert(mockProjects)
      .select();

    if (projectsError) throw projectsError;
    console.log(`✓ Seeded ${projectsData.length} projects`);

    console.log('Seeding blog posts...');
    const { data: blogData, error: blogError } = await supabase
      .from('blog_posts')
      .insert(blogPosts)
      .select();

    if (blogError) throw blogError;
    console.log(`✓ Seeded ${blogData.length} blog posts`);

    console.log('Seeding FAQs...');
    const { data: faqData, error: faqError } = await supabase
      .from('faqs')
      .insert(faqs)
      .select();

    if (faqError) throw faqError;
    console.log(`✓ Seeded ${faqData.length} FAQs`);

    console.log('Seeding team members...');
    const { data: teamData, error: teamError } = await supabase
      .from('team_members')
      .insert(teamMembers)
      .select();

    if (teamError) throw teamError;
    console.log(`✓ Seeded ${teamData.length} team members`);

    console.log('Seeding job postings...');
    const { data: jobData, error: jobError } = await supabase
      .from('job_postings')
      .insert(jobPostings)
      .select();

    if (jobError) throw jobError;
    console.log(`✓ Seeded ${jobData.length} job postings`);

    console.log('\n✓ Database seeding completed successfully!');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
