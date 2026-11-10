#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-ec2.sh – Instala Docker y levanta el clúster RabbitMQ en Ubuntu EC2
# Ejecutar con: bash setup-ec2.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [1/5] Actualizando paquetes ==="
sudo apt update -y

echo "=== [2/5] Instalando Docker ==="
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker

# Agregar usuario ubuntu al grupo docker para no usar sudo
sudo usermod -aG docker ubuntu
echo "NOTA: Cierra y vuelve a conectarte para que el grupo docker tenga efecto"

echo "=== [3/5] Verificando versiones ==="
sudo docker --version
sudo docker compose version

echo "=== [4/5] Levantando clúster RabbitMQ ==="
# Asegurarse de que .env existe
if [ ! -f .env ]; then
    echo "ERROR: Falta el archivo .env. Cópialo desde .env.example y completa los valores."
    exit 1
fi

sudo docker compose -f docker-compose.cluster.yml up -d

echo "=== [5/5] Esperando que rabbit1 esté listo (~20s) ==="
sleep 20

echo "=== Uniendo rabbit2 al clúster ==="
sudo docker exec rabbit2 rabbitmqctl stop_app
sudo docker exec rabbit2 rabbitmqctl reset
sudo docker exec rabbit2 rabbitmqctl join_cluster rabbit@rabbit1
sudo docker exec rabbit2 rabbitmqctl start_app

echo "=== Verificando estado del clúster ==="
sudo docker exec rabbit1 rabbitmqctl cluster_status

echo ""
echo "✓ Clúster listo. Accede a Management UI via túnel SSH:"
echo "  ssh -i TU_LLAVE.pem -L 15673:127.0.0.1:15672 ubuntu@IP_EC2"
echo "  Luego abre: http://localhost:15673"
