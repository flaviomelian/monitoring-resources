#!/bin/bash

# Acción por defecto: "up" si no se pasa parámetro o si viene vacío
ACTION="${1:-up}"

# Guardar la raíz absoluta del proyecto
PROJECT_ROOT="$(pwd)"

case "$ACTION" in
    up|start)
        echo "🚀 Iniciando entorno de desarrollo completo..."

        # 1. Levantar Backend mediante su script
        echo "📂 Entrando a backend/scripts y ejecutando launch-cluster.sh up..."
        if [ -d "backend/scripts" ]; then
            cd backend/scripts || exit 1
            chmod +x launch-cluster.sh 2>/dev/null || true
            ./launch-cluster.sh up
            
            # Volver a la raíz
            cd "$PROJECT_ROOT" || exit 1
        else
            echo "❌ Error: No existe la ruta backend/scripts"
            exit 1
        fi

        # 2. Arrancar Frontend
        echo "💻 Entrando a frontend e iniciando servidor de desarrollo..."
        if [ -d "frontend" ]; then
            cd frontend || exit 1
            npm run dev
        else
            echo "❌ Error: No existe la ruta frontend"
            exit 1
        fi
        ;;

    down|stop)
        echo "🛑 Deteniendo todo el entorno..."

        # Parar Backend delegando en su propio script
        echo "📂 Entrando a backend/scripts para apagar el clúster..."
        if [ -d "backend/scripts" ]; then
            cd backend/scripts || exit 1
            chmod +x launch-cluster.sh 2>/dev/null || true
            ./launch-cluster.sh down
            
            cd "$PROJECT_ROOT" || exit 1
            echo "✅ Entorno detenido correctamente."
        else
            echo "❌ Error: No existe la ruta backend/scripts"
            exit 1
        fi
        ;;

    *)
        echo "❌ Uso no válido."
        echo "Sintaxis: ./run.sh [up|down]"
        echo "  - Sin parámetros / 'up' : Levanta backend y lanza npm run dev"
        echo "  - 'down'               : Apaga la infraestructura del backend"
        exit 1
        ;;
esac