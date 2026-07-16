# --- ETAPA 1: Compilación interna en Docker ---
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copiamos el POM y el código fuente real
COPY pom.xml .
COPY src ./src

# Compilamos el JAR limpio desde el código fuente
RUN mvn clean package -DskipTests

# --- ETAPA 2: Imagen final de ejecución ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 🔑 Instalamos el cliente de SSH necesario para conectar con el host
RUN apk add --no-cache openssh-client bash

# Creamos el directorio, copiamos tu script dinámico y le damos permisos
RUN mkdir -p /app/scripts
COPY scripts/launch-replica.sh /app/scripts/launch-replica.sh
RUN chmod +x /app/scripts/launch-replica.sh

# Copiamos el JAR recién generado en la etapa de build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# El ENTRYPOINT al final de todo, limpio y sin flags raros de JNA
ENTRYPOINT ["java", "-jar", "app.jar"]