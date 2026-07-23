#!/bin/bash

# Acción por defecto: "up" si no se pasa parámetro o si viene vacío
ACTION="${1:-up}"

# Tiempo de espera (en segundos) antes de levantar el frontend en el 'up'
FRONTEND_WAIT_TIME=5

# Guardar la raíz absoluta del proyecto
PROJECT_ROOT="$(pwd)"

# Archivo temporal para guardar el PID del frontend
PID_FILE="$PROJECT_ROOT/.frontend.pid"

case "$ACTION" in
    up|start)
        echo "🚀 Iniciando entorno de desarrollo completo en segundo plano..."

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

        # 2. Espera de cortesía para el backend
        echo "⏳ Esperando ${FRONTEND_WAIT_TIME}s para que los servicios base se estabilicen..."
        sleep "$FRONTEND_WAIT_TIME"

        # 3. Arrancar Frontend en segundo plano (desacoplado)
        echo "💻 Lanzando servidor de desarrollo de Frontend en segundo plano..."
        if [ -d "frontend" ]; then
            cd frontend || exit 1
            
            # Se lanza en background sin bloquear stdout/stderr y se guarda su PID
            nohup npm run dev > /dev/null 2>&1 &
            FRONTEND_PID=$!
            echo "$FRONTEND_PID" > "$PID_FILE"
            
            cd "$PROJECT_ROOT" || exit 1
            echo "✅ Frontend iniciado con PID $FRONTEND_PID (Escuchando en http://localhost:3000)."
            echo "✨ Terminal libre. Usa './run.sh down' para apagar todo el entorno."
        else
            echo "❌ Error: No existe la ruta frontend"
            exit 1
        fi
        ;;

    down|stop)
        echo "🛑 Deteniendo todo el entorno..."

        # 1. Tumbar proceso de Frontend y sus hijos
        echo "💻 Deteniendo el servidor Frontend (Next.js)..."
        
        # Eliminación por PID guardado y su árbol de hijos (pkill -P)
        if [ -f "$PID_FILE" ]; then
            SAVED_PID=$(cat "$PID_FILE")
            if [ -n "$SAVED_PID" ]; then
                # Mata los procesos hijos generados por npm
                pkill -P "$SAVED_PID" 2>/dev/null || true
                kill -9 "$SAVED_PID" 2>/dev/null || true
            fi
            rm -f "$PID_FILE"
        fi

        # Limpieza por puerto 3000 (funciona en Linux/macOS)
        if command -v lsof >/dev/null 2>&1; then
            PORT_PID=$(lsof -t -i:3000 2>/dev/null)
            if [ -n "$PORT_PID" ]; then
                kill -9 $PORT_PID 2>/dev/null || true
            fi
        fi

        # Fallback para Git Bash / MINGW64 en Windows (taskkill libera el puerto al instante)
        if command -v netstat >/dev/null 2>&1; then
            WIN_PID=$(netstat -ano 2>/dev/null | grep ":3000 " | grep "LISTENING" | awk '{print $5}' | head -n 1)
            if [ -n "$WIN_PID" ] && [ "$WIN_PID" -ne 0 ] 2>/dev/null; then
                taskkill //F //PID "$WIN_PID" >/dev/null 2>&1 || true
            fi
        fi

        # Barrido de seguridad sobre ejecutables comunes de dev
        pkill -f "next dev" 2>/dev/null || pkill -f "next-server" 2>/dev/null || true
        echo "✅ Frontend detenido correctamente."

        # 2. Parar Backend delegando en su propio script
        echo "📂 Entrando a backend/scripts para apagar el clúster..."
        if [ -d "backend/scripts" ]; then
            cd backend/scripts || exit 1
            chmod +x launch-cluster.sh 2>/dev/null || true
            ./launch-cluster.sh down
            
            cd "$PROJECT_ROOT" || exit 1
            echo "✅ Entorno detenido completamente."
        else
            echo "❌ Error: No existe la ruta backend/scripts"
            exit 1
        fi
        ;;

    *)
        echo "❌ Uso no válido."
        echo "Sintaxis: ./run.sh [up|down]"
        echo "  - Sin parámetros / 'up' : Levanta backend y frontend en segundo plano"
        echo "  - 'down'               : Apaga la infraestructura del backend y del frontend"
        exit 1
        ;;
esac