#!/bin/bash

# RUTAS DESDE EL HOST (Windows/Git Bash)
SOURCE_DIR="./data"       # <--- La carpeta de tu Windows donde están los .txt
DEST_CONTAINER="alpine-replica"  # Nombre del contenedor destino
DEST_DIR="/data"          # Carpeta DENTRO del contenedor réplica

# Aseguramos que la carpeta local en Windows exista
mkdir -p "$SOURCE_DIR"

echo "👀 Monitorizando la carpeta local [$SOURCE_DIR] desde el Host..."

while true; do
    # Buscamos el archivo .txt más antiguo en Windows
    OLDEST_FILE=$(ls -tr "$SOURCE_DIR"/*.txt 2>/dev/null | head -n 1)

    if [ -n "$OLDEST_FILE" ] && [ -f "$OLDEST_FILE" ]; then
        FILENAME=$(basename "$OLDEST_FILE")
        
        echo "🚀 [HOST]: Detectado [$FILENAME]. Copiándolo a la réplica..."
        
        # En lugar de SCP, usamos Docker CP que salta directo al contenedor
        docker cp "$SOURCE_DIR/$FILENAME" "$DEST_CONTAINER:$DEST_DIR/$FILENAME"
        
        if [ $? -eq 0 ]; then
            # Forzamos al contenedor a pintar el mensaje de recibido en sus logs
            docker exec $DEST_CONTAINER echo "📥 [RÉPLICA]: Archivo [$FILENAME] recibido correctamente."
            
            echo "✅ [HOST]: Archivo [$FILENAME] enviado con éxito. Purgando local..."
            rm -f "$SOURCE_DIR/$FILENAME"
        else
            echo "❌ [HOST]: Error al copiar [$FILENAME] mediante Docker."
        fi
    fi

    sleep 5
done
