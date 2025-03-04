# Usar una imagen oficial de Go como base
FROM golang:1.24

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos al contenedor
COPY . .

# Descargar dependencias y compilar el binario
RUN go mod tidy && go build -o app

# Exponer el puerto que usará la aplicación
EXPOSE 8080

# Ejecutar la aplicación
CMD ["./app"]
