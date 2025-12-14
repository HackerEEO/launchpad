#!/bin/bash
# CryptoLaunch Subgraph Deployment Script
# Usage: ./scripts/deploy-subgraph.sh <network> <mode>
#   network: sepolia | arbitrum | base | polygon | mainnet
#   mode: local | hosted | studio

set -e

NETWORK=${1:-sepolia}
MODE=${2:-local}

echo "🚀 Deploying CryptoLaunch subgraph to $NETWORK ($MODE)"

# Navigate to subgraph directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate types
echo "📝 Generating types..."
npm run codegen

# Build subgraph
echo "🔨 Building subgraph..."
npm run build

# Deploy based on mode
case $MODE in
    local)
        echo "🏠 Deploying to local Graph node..."
        # Create if doesn't exist
        npm run create:local 2>/dev/null || true
        npm run deploy:local
        ;;
    hosted)
        if [ -z "$GRAPH_ACCESS_TOKEN" ]; then
            echo "❌ Error: GRAPH_ACCESS_TOKEN environment variable is required"
            exit 1
        fi
        if [ -z "$SUBGRAPH_NAME" ]; then
            echo "❌ Error: SUBGRAPH_NAME environment variable is required"
            exit 1
        fi
        echo "☁️ Deploying to hosted service..."
        npm run deploy:hosted
        ;;
    studio)
        if [ -z "$SUBGRAPH_NAME" ]; then
            echo "❌ Error: SUBGRAPH_NAME environment variable is required"
            exit 1
        fi
        echo "🎬 Deploying to Subgraph Studio..."
        npm run deploy:studio
        ;;
    *)
        echo "❌ Unknown mode: $MODE"
        echo "Usage: ./deploy-subgraph.sh <network> <local|hosted|studio>"
        exit 1
        ;;
esac

echo "✅ Deployment complete!"
echo ""
echo "Query endpoints:"
case $MODE in
    local)
        echo "  GraphQL: http://localhost:8000/subgraphs/name/cryptolaunch/ido"
        ;;
    hosted)
        echo "  GraphQL: https://api.thegraph.com/subgraphs/name/$SUBGRAPH_NAME"
        ;;
    studio)
        echo "  GraphQL: https://api.studio.thegraph.com/query/<id>/$SUBGRAPH_NAME/v0.0.1"
        ;;
esac
