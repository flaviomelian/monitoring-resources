FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Actualizamos el Ubuntu real e instalamos el servidor de MySQL a pelo
RUN apt-get update && apt-get install -y \
    mysql-server \
    sudo \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Truco de Sysadmin: Permitir que MySQL escuche conexiones externas (desde la red de Docker)
RUN sed -i 's/127.0.0.1/0.0.0.0/g' /etc/mysql/mysql.conf.d/mysqld.cnf

# Copiamos nuestro script Bash de arranque
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3306

ENTRYPOINT ["/entrypoint.sh"]