#!/bin/bash
set -e

echo "🐳 [Linux Interno]: Arrancando el servicio de MySQL nativo..."
service mysql start

echo "⏳ Esperando a que MySQL levante el socket interno..."
while ! mysqladmin ping --silent; do
    sleep 1
done

echo "📊 Configurando usuarios y base de datos para Spring Boot..."
mysql -e "CREATE DATABASE IF NOT EXISTS sandbox_db;"
mysql -e "CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root_password';"
mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;"
mysql -e "FLUSH PRIVILEGES;"

echo "✅ [Linux Interno]: ¡Base de datos lista en el puerto 3306!"

# Mantiene el contenedor Ubuntu vivo mostrando los logs
tail -f /var/log/mysql/error.log