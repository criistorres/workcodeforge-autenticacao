#!/bin/bash
# ===========================================
# WorkCodeForge - View Production Logs
# ===========================================

set -e

echo "📊 Viewing production logs..."
echo "Press Ctrl+C to exit"
echo ""

# Se passou argumento de serviço, mostrar só daquele serviço
if [ ! -z "$1" ]; then
    echo "Showing logs for service: $1"
    docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f "$1"
else
    echo "Showing logs for all services"
    echo "💡 Tip: Use ./logs-prod.sh <service-name> to view logs for a specific service"
    echo ""
    docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f
fi
