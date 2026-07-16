#!/bin/bash

# Configuración de la conexión SSH
SSH_USER="Flavio"
SSH_HOST="host.docker.internal"
ORIGINAL_KEY_PATH="/root/.ssh/id_local_ssh"
TEMP_KEY_PATH="/tmp/id_local_ssh"

# Copiar clave con permisos correctos
cp "$ORIGINAL_KEY_PATH" "$TEMP_KEY_PATH"
chmod 600 "$TEMP_KEY_PATH"

SSH_CMD="ssh -i ${TEMP_KEY_PATH} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${SSH_USER}@${SSH_HOST}"

echo "Calculando el siguiente índice de réplica..."

# 1. Obtenemos los nombres, limpiando avisos de SSH de Windows (stderr) y retornos de carro (\r)
NOMBRES_CONTENEDORES=$($SSH_CMD "docker ps -a --format '{{.Names}}'" 2>/dev/null | tr -d '\r')

# 2. Filtramos de manera robusta extrayendo solo el patrón numérico sin importar prefijos ni saltos de línea raros
ULTIMO_NUM=$(echo "$NOMBRES_CONTENEDORES" | \
             grep -oE 'alpine-replica-[0-9]+' | \
             sed 's/alpine-replica-//' | \
             sort -n | \
             tail -n 1)

# Si la variable está vacía tras el filtrado, empezamos en el 3 (ya que el 1 y el 2 son fijos de tu compose)
if [ -z "$ULTIMO_NUM" ]; then
    echo "No se detectaron réplicas previas de forma segura. Empezando en la réplica 3."
    NUEVO_NUM=3
else
    NUEVO_NUM=$((ULTIMO_NUM + 1))
fi

NUEVA_REPLICA="alpine-replica-${NUEVO_NUM}"
RED_DOCKER="monitor-net" 
NUEVO_PUERTO=$((8081 + NUEVO_NUM))
VOLUMEN_NODO="/c/Users/Flavio/tu-proyecto/data/replica${NUEVO_NUM}" 

echo "La última réplica detectada fue la alpine-replica-${ULTIMO_NUM:-2}."
echo "Creando la nueva: ${NUEVA_REPLICA} en el puerto del Host: ${NUEVO_PUERTO}..."

# Crear directorio en el host (usamos bash -c para asegurar compatibilidad de rutas de Windows en SSH)
$SSH_CMD "bash -c 'mkdir -p ${VOLUMEN_NODO}'" 2>/dev/null

# === LIMPIEZA PREVENTIVA COMPATIBLE ===
echo "Limpiando posibles contenedores huérfanos con el nombre: monitoring-resources-${NUEVA_REPLICA}..."
# Ejecutamos el rm en el host y controlamos el error de salida directamente en la sesión local de Bash
$SSH_CMD "docker rm -f monitoring-resources-${NUEVA_REPLICA}" >/dev/null 2>&1 || true

# === EJECUCIÓN ===
# Evitamos saltos de línea complejos que SSH pueda pasar a la consola de Windows de forma errática.
# Pasamos el comando limpio en una sola línea de ejecución para el daemon de Docker del host.
$SSH_CMD "docker run -d --name monitoring-resources-${NUEVA_REPLICA} --network monitoring-resources_${RED_DOCKER} -p ${NUEVO_PUERTO}:8080 -v ${VOLUMEN_NODO}:/monitored/replica${NUEVO_NUM}:rw -e SPRING_DATASOURCE_URL=\"jdbc:mysql://custom-linux-db:3306/sandbox_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true\" -e SPRING_DATASOURCE_USERNAME=root -e SPRING_DATASOURCE_PASSWORD=root_password -e STORAGE_PATH=/monitored/replica${NUEVO_NUM} monitoring-resources-alpine-replica-1"

if [ $? -eq 0 ]; then
    echo "¡Contenedor ${NUEVA_REPLICA} levantado con éxito en el host en el puerto ${NUEVO_PUERTO}!"
else
    echo "Error al intentar levantar el contenedor por SSH."
    exit 1
fi