#!/bin/bash

# Configuración de la conexión SSH
SSH_USER="Flavio"
SSH_HOST="host.docker.internal"
ORIGINAL_KEY_PATH="/root/.ssh/id_local_ssh"
TEMP_KEY_PATH="/tmp/id_local_ssh"

# Copiar clave con permisos estrictos
cp "$ORIGINAL_KEY_PATH" "$TEMP_KEY_PATH"
chmod 600 "$TEMP_KEY_PATH"

# Añadimos BatchMode=yes para que no pida contraseña en teclado y redirigimos entrada desde /dev/null
SSH_CMD="ssh -i ${TEMP_KEY_PATH} -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes ${SSH_USER}@${SSH_HOST}"

echo "Calculando el siguiente índice de réplica..."

# 1. Obtener nombres de contenedores asegurando entrada nula (</dev/null)
NOMBRES_CONTENEDORES=$($SSH_CMD "wsl docker ps -a --format '{{.Names}}'" </dev/null 2>/dev/null | tr -d '\r')

# 2. Extraer el último número activo
ULTIMO_NUM=$(echo "$NOMBRES_CONTENEDORES" | \
             grep -oE 'alpine-replica-[0-9]+' | \
             sed 's/alpine-replica-//' | \
             sort -n | \
             tail -n 1)

if [ -z "$ULTIMO_NUM" ]; then
    echo "No se detectaron réplicas previas. Empezando en la réplica 3."
    NUEVO_NUM=3
else
    NUEVO_NUM=$((ULTIMO_NUM + 1))
fi

NUEVA_REPLICA="alpine-replica-${NUEVO_NUM}"
RED_DOCKER="monitoring-resources_monitor-net" 
NUEVO_PUERTO=$((8081 + NUEVO_NUM))

# RUTA DE WINDOWS ADAPTADA PARA WSL: /mnt/c/... en lugar de /c/...
VOLUMEN_HOST_WSL="/mnt/c/Users/Flavio/tu-proyecto/data/replica${NUEVO_NUM}" 

echo "La última réplica detectada fue la alpine-replica-${ULTIMO_NUM:-2}."
echo "Creando ${NUEVA_REPLICA} en el puerto del Host: ${NUEVO_PUERTO}..."

# Crear directorio en la máquina Windows mediante WSL
$SSH_CMD "wsl mkdir -p ${VOLUMEN_HOST_WSL}" </dev/null 2>/dev/null || true

# Limpieza preventiva
echo "Limpiando posibles contenedores con el nombre: monitoring-resources-${NUEVA_REPLICA}..."
$SSH_CMD "wsl docker rm -f monitoring-resources-${NUEVA_REPLICA}" </dev/null>/dev/null 2>&1 || true

# Invocación final de Docker
echo "Levantando contenedor en Docker..."
$SSH_CMD "wsl docker run -d --name monitoring-resources-${NUEVA_REPLICA} --network ${RED_DOCKER} -p ${NUEVO_PUERTO}:8080 -v ${VOLUMEN_HOST_WSL}:/monitored/replica${NUEVO_NUM}:rw -e SPRING_DATASOURCE_URL=\"jdbc:mysql://custom-linux-db:3306/sandbox_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true\" -e SPRING_DATASOURCE_USERNAME=root -e SPRING_DATASOURCE_PASSWORD=root_password -e STORAGE_PATH=/monitored/replica${NUEVO_NUM} monitoring-resources-alpine-replica-1" </dev/null

if [ $? -eq 0 ]; then
    echo "¡Contenedor ${NUEVA_REPLICA} levantado con éxito en el puerto ${NUEVO_PUERTO}!"
else
    echo "Error crítico al ejecutar el comando Docker por SSH."
    exit 1
fi