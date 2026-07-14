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

# Instalamos la compatibilidad con glibc para que JNA pueda cargar el socket de Docker
RUN apk add --no-cache libc6-compat gcompat

# Forzamos al cargador dinámico de Alpine a precargar la biblioteca de compatibilidad
ENV LD_PRELOAD=/lib/libc6-compat.so.0

# Copiamos el JAR recién generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Forzamos a la JVM a desactivar cualquier comportamiento que bloquee llamadas nativas de JNA
ENTRYPOINT ["java", "-Djna.nosys=true", "-jar", "app.jar"]