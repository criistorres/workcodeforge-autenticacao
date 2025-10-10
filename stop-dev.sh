#!/bin/bash
# ===========================================
# WorkCodeForge - Stop Development Environment
# ===========================================

set -e

echo "🛑 Stopping WorkCodeForge development environment..."
echo ""

docker-compose down

echo ""
echo "✅ Development environment stopped!"
echo ""
echo "💡 To remove volumes (DATABASE WILL BE DELETED), run:"
echo "   docker-compose down -v"
