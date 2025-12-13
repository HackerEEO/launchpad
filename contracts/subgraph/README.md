# CryptoLaunch Subgraph

The Graph subgraph for indexing CryptoLaunch IDO platform events. Indexes Investment, TokensClaimed, and Refunded events from IDOPool contracts.

## Quick Start

### Prerequisites

- Node.js 18+
- The Graph CLI: `npm install -g @graphprotocol/graph-cli`
- Docker (for local development)

### Installation

```bash
cd contracts/subgraph
npm install
```

### Configure for Your Network

1. Edit `subgraph.yaml`:
   - Update `source.address` with your LaunchpadFactory contract address
   - Update `source.startBlock` with the deployment block
   - Change `network` to your target network (sepolia, arbitrum-one, base, polygon, mainnet)

2. Copy ABIs from your deployed contracts if different from the included ones.

### Generate Types & Build

```bash
npm run codegen  # Generate AssemblyScript types
npm run build    # Compile subgraph
```

## Deployment

### Local Development (Graph Node + Docker)

1. Start a local Graph node:
```bash
docker-compose up -d  # See graph-node docker-compose in docs
```

2. Deploy locally:
```bash
./scripts/deploy-subgraph.sh sepolia local
```

### Subgraph Studio (Recommended for Production)

1. Create a subgraph at [Subgraph Studio](https://thegraph.com/studio/)
2. Get your deploy key
3. Authenticate:
```bash
graph auth --studio <DEPLOY_KEY>
```
4. Deploy:
```bash
export SUBGRAPH_NAME=cryptolaunch-ido
./scripts/deploy-subgraph.sh sepolia studio
```

### Hosted Service (Legacy)

```bash
export GRAPH_ACCESS_TOKEN=<your-token>
export SUBGRAPH_NAME=<your-github>/<subgraph-name>
./scripts/deploy-subgraph.sh sepolia hosted
```

## Schema

### Entities

| Entity | Description |
|--------|-------------|
| `Investment` | Individual investment records |
| `TokenClaim` | Token claim records |
| `Refund` | Refund records |
| `PoolStats` | Aggregated stats per pool |
| `InvestorStats` | Aggregated stats per investor |

### Example Queries

**Get all investments for a pool:**
```graphql
{
  investments(where: { pool: "0x..." }, orderBy: timestamp, orderDirection: desc) {
    id
    investor
    paymentAmount
    tokenAmount
    timestamp
    transactionHash
  }
}
```

**Get investor stats:**
```graphql
{
  investorStats(id: "0x...") {
    totalInvested
    totalTokensPurchased
    totalTokensClaimed
    poolCount
  }
}
```

**Get pool statistics:**
```graphql
{
  poolStats(id: "0x...") {
    totalRaised
    totalTokensSold
    investmentCount
    investorCount
  }
}
```

**Verify investment by transaction hash:**
```graphql
{
  investments(where: { transactionHash: "0x..." }) {
    id
    investor
    paymentAmount
    tokenAmount
    pool
  }
}
```

## Multi-Network Deployment

To deploy to multiple networks:

1. Create network-specific subgraph.yaml files:
   - `subgraph.sepolia.yaml`
   - `subgraph.arbitrum.yaml`
   - `subgraph.base.yaml`

2. Update the deploy script or use:
```bash
graph deploy --network arbitrum-one --node ... 
```

## Monitoring

### Health Check

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  https://api.thegraph.com/subgraphs/name/YOUR_SUBGRAPH
```

### Subgraph Status

Check indexing status at:
- Studio: https://thegraph.com/studio/subgraph/YOUR_SUBGRAPH
- Hosted: https://thegraph.com/hosted-service/subgraph/YOUR_SUBGRAPH

## Troubleshooting

**Subgraph not indexing?**
- Verify contract address and start block in subgraph.yaml
- Check that events match the ABI signatures exactly
- Review Graph node logs for errors

**Types not generating?**
- Ensure ABIs are valid JSON
- Run `npm run codegen` after any schema changes

**Build failures?**
- Check AssemblyScript syntax (not all TypeScript features supported)
- Verify imports match generated file paths
