#!/bin/bash
# ===========================================
# WorkCodeForge - View Development Logs
# ===========================================

set -e

echo "📊 Viewing development logs..."
echo "Press Ctrl+C to exit"
echo ""

# Se passou argumento de serviço, mostrar só daquele serviço
if [ ! -z "$1" ]; then
    echo "Showing logs for service: $1"
    docker-compose logs -f "$1"
else
    echo "Showing logs for all services"
    echo "💡 Tip: Use ./logs-dev.sh <service-name> to view logs for a specific service"
    echo ""
    docker-compose logs -f
fi
