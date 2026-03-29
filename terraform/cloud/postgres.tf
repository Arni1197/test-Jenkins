data "twc_database_preset" "app_postgres_preset" {
  location = var.region
  type     = "postgres16"

  cpu  = 2
  ram  = 4096
  disk = 40 * 1024
}

resource "twc_database_cluster" "app_postgres" {
  name      = "app-postgres"
  type      = "postgres16"
  preset_id = data.twc_database_preset.app_postgres_preset.id
}

data "twc_database_preset" "audit_postgres_preset" {
  location = var.region
  type     = "postgres16"

  cpu  = 2
  ram  = 4096
  disk = 40 * 1024
}

resource "twc_database_cluster" "audit_postgres" {
  name      = "audit-postgres"
  type      = "postgres16"
  preset_id = data.twc_database_preset.audit_postgres_preset.id
}