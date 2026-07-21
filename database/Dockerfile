FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Añadimos dos2unix a las herramientas de instalación
RUN apt-get update && apt-get install -y \
    mysql-server \
    sudo \
    curl \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

RUN sed -i 's/127.0.0.1/0.0.0.0/g' /etc/mysql/mysql.conf.d/mysqld.cnf

COPY entrypoint.sh ./entrypoint.sh

# Forzamos la conversión a formato Unix antes de darle permisos
RUN dos2unix ./entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 3306

ENTRYPOINT ["./entrypoint.sh"]