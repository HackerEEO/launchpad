# 🔍 Blockchain Indexing & Backend Verification

This guide covers the event indexing pipeline and on-chain transaction verification for CryptoLaunch.

## Overview

CryptoLaunch uses a dual verification approach:

1. **On-Chain Verification** - Direct RPC calls to verify transaction receipts and decode event logs
2. **Subgraph Indexing** (Optional) - The Graph protocol for historical queries and cross-verification

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User Tx   │────▶│  Blockchain  │────▶│   Events    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
         ┌─────────────────┴─────────────────┐   │
         │                                   │   │
         ▼                                   ▼   ▼
┌─────────────────┐                 ┌─────────────────┐
│  Edge Function  │◀────────────────│    Subgraph     │
│  (On-chain RPC) │  cross-check    │  (The Graph)    │
└────────┬────────┘                 └─────────────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│    Database     │
└─────────────────┘
```

## Quick Start

### 1. Deploy Subgraph (Optional)

```bash
cd contracts/subgraph
npm install
npm run codegen
npm run build
./scripts/deploy-subgraph.sh sepolia studio
```

### 2. Configure Environment

Add to your `.env`:

```bash
# Indexing Configuration
INDEXER_CONFIRMATIONS=1          # Required block confirmations
SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/cryptolaunch/v0.0.1

# RPC URLs (per network)
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### 3. Test the Pipeline

```bash
# Dry run (no actual transaction)
node scripts/demo-indexing.js --dry-run

# With actual transaction (requires funded wallet)
export DEMO_PRIVATE_KEY=0x...
export DEMO_POOL_ADDRESS=0x...
node scripts/demo-indexing.js
```

## Components

### 1. The Graph Subgraph

Located in `contracts/subgraph/`, indexes:

| Entity | Event | Description |
|--------|-------|-------------|
| `Investment` | `Investment(address,uint256,uint256,uint256)` | Investment records |
| `TokenClaim` | `TokensClaimed(address,uint256,uint256)` | Token claim records |
| `Refund` | `Refunded(address,uint256,uint256)` | Refund records |
| `PoolStats` | - | Aggregated pool statistics |
| `InvestorStats` | - | Aggregated investor statistics |

**Schema:** See `contracts/subgraph/schema.graphql`

**Deployment Options:**

| Option | Cost | Latency | Decentralized |
|--------|------|---------|---------------|
| Subgraph Studio | $0-50/mo | ~30s | Yes |
| Hosted Service (deprecated) | Free | ~30s | No |
| Self-hosted Graph Node | Server costs | ~15s | No |

### 2. Supabase Edge Functions

Located in `supabase/functions/`:

#### `process-investment`

Verifies and records investment transactions:

```typescript
// Request
POST /functions/v1/process-investment
{
  "project_id": "uuid",
  "user_wallet": "0x...",
  "amount_invested": 0.1,
  "transaction_hash": "0x...",
  "chain_id": 42161
}

// Response
{
  "success": true,
  "investment": { ... },
  "verification": {
    "verified": true,
    "source": "both",  // "onchain" | "subgraph" | "both"
    "confirmations": 3,
    "poolAddress": "0x..."
  }
}
```

#### `claim-tokens`

Verifies and records token claims:

```typescript
// Request
POST /functions/v1/claim-tokens
{
  "investment_id": "uuid",
  "user_wallet": "0x...",
  "transaction_hash": "0x...",
  "chain_id": 42161
}
```

### 3. Verification Flow

```
1. Frontend submits tx hash
2. Edge function fetches tx receipt from RPC
3. Verify: receipt.status === 1
4. Verify: block confirmations >= INDEXER_CONFIRMATIONS
5. Decode event logs using contract ABI
6. Validate: event.investor === expected wallet
7. (Optional) Cross-check with subgraph
8. Insert/update Supabase record
9. Return verification result
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `INDEXER_CONFIRMATIONS` | Required block confirmations (default: 1) | No |
| `SUBGRAPH_URL` | The Graph endpoint for cross-verification | No |
| `MAINNET_RPC_URL` | Ethereum mainnet RPC | If using mainnet |
| `ARBITRUM_RPC_URL` | Arbitrum One RPC | If using Arbitrum |
| `BASE_RPC_URL` | Base mainnet RPC | If using Base |
| `POLYGON_RPC_URL` | Polygon mainnet RPC | If using Polygon |
| `OPTIMISM_RPC_URL` | Optimism mainnet RPC | If using Optimism |
| `SEPOLIA_RPC_URL` | Sepolia testnet RPC | If using Sepolia |

### Recommended Confirmations

| Network | Recommended | Minimum |
|---------|-------------|---------|
| Ethereum | 12 | 3 |
| Arbitrum | 1 | 1 |
| Base | 1 | 1 |
| Optimism | 1 | 1 |
| Polygon | 32 | 10 |
| Sepolia | 1 | 1 |

### GitHub Secrets for CI

Add these to your repository secrets:

```
GRAPH_ACCESS_TOKEN    - The Graph deploy token
SUBGRAPH_NAME         - e.g., "yourname/cryptolaunch"
ALCHEMY_API_KEY       - For RPC endpoints
```

## Monitoring & Alerts

### Subgraph Health Check

```bash
# Check subgraph status
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  $SUBGRAPH_URL
```

Expected response:
```json
{
  "data": {
    "_meta": {
      "block": { "number": 12345678 }
    }
  }
}
```

### Indexing Lag Alert

Set up alerts for:
- **Warning**: Indexed block > 5 minutes behind chain head
- **Critical**: Indexed block > 15 minutes behind

### Edge Function Monitoring

Monitor in Supabase Dashboard:
- Function invocations
- Error rates
- Response times

### SLOs

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Indexer lag | < 30s | > 5 min |
| Edge function success rate | > 99% | < 95% |
| Edge function latency | < 2s | > 5s |
| RPC availability | > 99.9% | < 99% |

## Troubleshooting

### Transaction Not Found

```
Error: Transaction not found or not yet confirmed
```

**Causes:**
- Transaction pending in mempool
- Wrong chain ID
- Transaction reverted

**Solution:**
- Wait for confirmation
- Verify chain ID matches
- Check transaction on block explorer

### Insufficient Confirmations

```
Error: Insufficient confirmations: 0/3
```

**Solution:**
- Wait for more blocks
- Lower `INDEXER_CONFIRMATIONS` for testnets

### No Investment Event Found

```
Error: No Investment event found in transaction logs
```

**Causes:**
- Transaction is not to an IDO pool
- Contract uses different event signature
- Wrong ABI

**Solution:**
- Verify transaction on block explorer
- Check event signatures match ABI

### Subgraph Not Indexing

**Causes:**
- Wrong contract address in subgraph.yaml
- Start block too high
- Mapping errors

**Solution:**
- Check subgraph dashboard for errors
- Verify contract addresses
- Re-deploy with correct start block

## Security Considerations

1. **Always verify on-chain** - Never trust client-provided data alone
2. **Check confirmations** - Prevent accepting reorged transactions
3. **Validate event data** - Ensure investor address matches
4. **Rate limit RPC calls** - Prevent DoS on RPC endpoints
5. **Cross-verify with indexer** - Use subgraph as second source of truth

## Alternative Indexing Solutions

### Alchemy Webhooks

For simpler setup without The Graph:

1. Create webhook at [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Configure for contract events
3. Endpoint: `${SUPABASE_URL}/functions/v1/alchemy-webhook`

### Custom Indexer

For full control:

```javascript
// Simple block scanner
const provider = new ethers.JsonRpcProvider(RPC_URL);
const pool = new ethers.Contract(POOL_ADDRESS, ABI, provider);

pool.on('Investment', async (investor, amount, tokens, timestamp, event) => {
  await supabase.from('investments').insert({
    investor,
    amount: amount.toString(),
    tokens: tokens.toString(),
    tx_hash: event.transactionHash,
  });
});
```

## Demo Script

Run the demo to test the full pipeline:

```bash
# Set environment
export VITE_RPC_URL=https://rpc.sepolia.org
export SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../cryptolaunch/v0.0.1
export VITE_SUPABASE_URL=https://xxx.supabase.co
export VITE_SUPABASE_SUPABASE_ANON_KEY=xxx

# Dry run
node scripts/demo-indexing.js --dry-run

# With real transaction
export DEMO_PRIVATE_KEY=0x...
export DEMO_POOL_ADDRESS=0x...
node scripts/demo-indexing.js
```

## References

- [The Graph Documentation](https://thegraph.com/docs/)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Alchemy Webhooks](https://docs.alchemy.com/reference/notify-api-quickstart)
