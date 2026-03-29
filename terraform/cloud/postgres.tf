# -------------------------------
# BUSINESS POSTGRES
# -------------------------------
resource "twc_database_cluster" "app_postgres" {
  name     = "app-postgres"
  type     = "postgresql"
  version  = var.postgres_version
  region   = var.region

  configuration {
    cpu    = 2
    ram    = 4096
    disk   = 40
  }
}

resource "twc_database_database" "app_db" {
  cluster_id = twc_database_cluster.app_postgres.id
  name       = "app_db"
}

resource "twc_database_user" "app_user" {
  cluster_id = twc_database_cluster.app_postgres.id
  name       = "app_user"
  password   = random_password.app.result
}

# -------------------------------
# AUDIT POSTGRES
# -------------------------------
resource "twc_database_cluster" "audit_postgres" {
  name     = "audit-postgres"
  type     = "postgresql"
  version  = var.postgres_version
  region   = var.region

  configuration {
    cpu    = 2
    ram    = 4096
    disk   = 40
  }
}

resource "twc_database_database" "audit_db" {
  cluster_id = twc_database_cluster.audit_postgres.id
  name       = "audit_db"
}

resource "twc_database_user" "audit_user" {
  cluster_id = twc_database_cluster.audit_postgres.id
  name       = "audit_user"
  password   = random_password.audit.result
}

# -------------------------------
# PASSWORDS
# -------------------------------
resource "random_password" "app" {
  length  = 20
  special = true
}

resource "random_password" "audit" {
  length  = 20
  special = true
}