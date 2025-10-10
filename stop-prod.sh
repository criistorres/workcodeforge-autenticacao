#!/bin/bash
# ===========================================
# WorkCodeForge - Stop Production Environment
# ===========================================

set -e

echo "🛑 Stopping WorkCodeForge production environment..."
echo ""

docker-compose -f docker-compose.yaml -f docker-compose.prod.yml down

echo ""
echo "✅ Production environment stopped!"
echo ""
echo "⚠️  WARNING: To remove volumes (THIS WILL DELETE ALL DATA), run:"
echo "   docker-compose -f docker-compose.yaml -f docker-compose.prod.yml down -v"
