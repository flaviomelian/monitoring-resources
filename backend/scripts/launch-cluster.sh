#!/bin/bash

# Acción por defecto si no se pasa parámetro: "up"
ACTION="${1:-up}"

# Convención de nombres y red del clúster
REPLICA_FILTER="name=alpine-replica-"
NETWORK_NAME="monitoring-resources_monitor-net"

echo "🚀 Ejecutando gestión del clúster [Acción: $ACTION]..."

# 1. Asegurar finales de línea Unix (LF) en los scripts
if [ -d "./scripts" ]; then
    sed -i 's/\r$//' ./scripts/*.sh 2>/dev/null || true
    chmod +x ./scripts/*.sh 2>/dev/null || true
fi

case "$ACTION" in
    up|start)
        echo "🐳 Levantando la infraestructura base (docker-compose)..."
        docker-compose up -d

        echo "🔄 Buscando réplicas dinámicas existentes para arrancar..."
        EXISTING_REPLICAS=$(docker ps -a -q --filter "$REPLICA_FILTER")
        
        if [ -n "$EXISTING_REPLICAS" ]; then
            echo "⚡ Reasociando red y arrancando réplicas dinámicas..."
            for CONTAINER_ID in $EXISTING_REPLICAS; do
                # Desconecta cualquier referencia de red antigua huérfana y vincula a la actual
                docker network disconnect -f "$NETWORK_NAME" "$CONTAINER_ID" 2>/dev/null || true
                docker network connect "$NETWORK_NAME" "$CONTAINER_ID"
            done
            
            # Arranca las réplicas ya reconectadas a la red activa
            docker start $EXISTING_REPLICAS
        else
            echo "ℹ️ No hay réplicas dinámicas previas. Clúster en estado base."
        fi
        ;;

    down|stop)
        echo "⏸️ Deteniendo réplicas dinámicas..."
        RUNNING_REPLICAS=$(docker ps -q --filter "$REPLICA_FILTER")
        
        if [ -n "$RUNNING_REPLICAS" ]; then
            docker stop $RUNNING_REPLICAS
            echo "✅ Réplicas dinámicas pausadas."
        else
            echo "ℹ️ No había réplicas dinámicas ejecutándose."
        fi

        echo "🛑 Bajando la infraestructura base de docker-compose..."
        docker-compose down
        ;;

    *)
        echo "❌ Uso no válido: ./launch-cluster.sh [up|down]"
        exit 1
        ;;
esac

echo ""
echo "📊 Estado actual de todos los contenedores del clúster:"
docker ps -a --filter "name=alpine-" --filter "name=backend" --filter "name=mysql" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"