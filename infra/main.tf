terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.6"
    }
  }
}

provider "docker" {}

# -------------------
# Сеть
# -------------------
resource "docker_network" "app_network" {
  name = "app-network"
}

# -------------------
# Volumes
# -------------------
resource "docker_volume" "mongo_data" {
  name = "mongo-data"
}

resource "docker_volume" "jenkins_home" {
  name = "jenkins_home"
}

# -------------------
# MongoDB
# -------------------
resource "docker_container" "mongo" {
  name  = "mongo"
  image = "mongo:6"

  ports {
    internal = 27017
    external = 27017
  }

  volumes {
    volume_name    = docker_volume.mongo_data.name
    container_path = "/data/db"
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["mongo"]
  }
}

# -------------------
# Redis
# -------------------
resource "docker_container" "redis" {
  name  = "redis"
  image = "redis:7"

  ports {
    internal = 6379
    external = 6379
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["redis"]
  }
}

# -------------------
# Backend
# -------------------
resource "docker_container" "backend" {
  name  = "backend"
  image = "game-project-backend:latest"

  ports {
    internal = 3000
    external = 5002
  }

  env = [
    "NODE_ENV=development"
  ]

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["backend"]
  }

  depends_on = [
    docker_container.mongo,
    docker_container.redis
  ]
}

# -------------------
# Frontend
# -------------------
resource "docker_container" "frontend" {
  name  = "frontend"
  image = "game-project-frontend:latest"

  ports {
    internal = 3000
    external = 3002
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["frontend"]
  }

  depends_on = [
    docker_container.backend
  ]
}

# -------------------
# Alertmanager
# -------------------
resource "docker_container" "alertmanager" {
  name  = "alertmanager"
  image = "prom/alertmanager:latest"

  command = [
    "--config.file=/etc/alertmanager/alertmanager.yml"
  ]

  ports {
    internal = 9093
    external = 9093
  }

  volumes {
    host_path      = "/absolute/path/to/prometheus/alertmanager.yml"
    container_path = "/etc/alertmanager/alertmanager.yml"
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["alertmanager"]
  }
}

# -------------------
# Prometheus
# -------------------
resource "docker_container" "prometheus" {
  name  = "prometheus"
  image = "prom/prometheus:latest"

  ports {
    internal = 9090
    external = 9090
  }

  volumes {
    host_path      = "/absolute/path/to/prometheus/prometheus.yml"
    container_path = "/etc/prometheus/prometheus.yml"
  }

  volumes {
    host_path      = "/absolute/path/to/prometheus/alert_rules.yml"
    container_path = "/etc/prometheus/alert_rules.yml"
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["prometheus"]
  }

  depends_on = [
    docker_container.alertmanager
  ]
}

# -------------------
# Grafana
# -------------------
resource "docker_container" "grafana" {
  name  = "grafana"
  image = "grafana/grafana:latest"

  ports {
    internal = 3000
    external = 3003
  }

  env = [
    "GF_SECURITY_ADMIN_USER=admin",
    "GF_SECURITY_ADMIN_PASSWORD=admin",
    "GF_PATHS_PROVISIONING=/etc/grafana/provisioning"
  ]

  volumes {
    host_path      = "/absolute/path/to/prometheus/grafana/provisioning"
    container_path = "/etc/grafana/provisioning/datasources"
  }

  volumes {
    host_path      = "/absolute/path/to/prometheus/grafana/provisioning"
    container_path = "/etc/grafana/provisioning/dashboards"
  }

  volumes {
    host_path      = "/absolute/path/to/prometheus/grafana/dashboards"
    container_path = "/var/lib/grafana/dashboards"
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["grafana"]
  }

  depends_on = [
    docker_container.prometheus,
    docker_container.loki
  ]
}

# -------------------
# Loki
# -------------------
resource "docker_container" "loki" {
  name  = "loki"
  image = "grafana/loki:2.9.0"

  ports {
    internal = 3100
    external = 3100
  }

  command = ["-config.file=/etc/loki/local-config.yaml"]

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["loki"]
  }
}

# -------------------
# Promtail
# -------------------
resource "docker_container" "promtail" {
  name  = "promtail"
  image = "grafana/promtail:2.9.0"

  command = ["-config.file=/etc/promtail/config.yaml"]

  volumes {
    host_path      = "/var/log"
    container_path = "/var/log"
  }

  volumes {
    host_path      = "/absolute/path/to/promtail-config.yaml"
    container_path = "/etc/promtail/config.yaml"
  }

  volumes {
    host_path      = "/absolute/path/to/backend/logs"
    container_path = "/app/logs"
  }

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["promtail"]
  }

  depends_on = [
    docker_container.loki
  ]
}