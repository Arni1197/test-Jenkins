resource "vault_kv_secret_v2" "postgres_business_dev" {
  mount = var.kv_mount_path
  name  = "app/dev/postgres/business"

  data_json = jsonencode({
    host     = var.business_postgres_host
    port     = var.business_postgres_port
    database = var.business_postgres_database
    username = var.business_postgres_username
    password = var.business_postgres_password
    sslmode  = var.business_postgres_sslmode
  })
}

resource "vault_kv_secret_v2" "postgres_audit_dev" {
  mount = var.kv_mount_path
  name  = "app/dev/postgres/audit"

  data_json = jsonencode({
    host     = var.audit_postgres_host
    port     = var.audit_postgres_port
    database = var.audit_postgres_database
    username = var.audit_postgres_username
    password = var.audit_postgres_password
    sslmode  = var.audit_postgres_sslmode
  })
}

resource "vault_kv_secret_v2" "postgres_business_stage" {
  mount = var.kv_mount_path
  name  = "app/stage/postgres/business"

  data_json = jsonencode({
    host     = var.business_postgres_host
    port     = var.business_postgres_port
    database = var.business_postgres_database
    username = var.business_postgres_username
    password = var.business_postgres_password
    sslmode  = var.business_postgres_sslmode
  })
}

resource "vault_kv_secret_v2" "postgres_audit_stage" {
  mount = var.kv_mount_path
  name  = "app/stage/postgres/audit"

  data_json = jsonencode({
    host     = var.audit_postgres_host
    port     = var.audit_postgres_port
    database = var.audit_postgres_database
    username = var.audit_postgres_username
    password = var.audit_postgres_password
    sslmode  = var.audit_postgres_sslmode
  })
}

resource "vault_kv_secret_v2" "postgres_business_prod" {
  mount = var.kv_mount_path
  name  = "app/prod/postgres/business"

  data_json = jsonencode({
    host     = var.business_postgres_host
    port     = var.business_postgres_port
    database = var.business_postgres_database
    username = var.business_postgres_username
    password = var.business_postgres_password
    sslmode  = var.business_postgres_sslmode
  })
}

resource "vault_kv_secret_v2" "postgres_audit_prod" {
  mount = var.kv_mount_path
  name  = "app/prod/postgres/audit"

  data_json = jsonencode({
    host     = var.audit_postgres_host
    port     = var.audit_postgres_port
    database = var.audit_postgres_database
    username = var.audit_postgres_username
    password = var.audit_postgres_password
    sslmode  = var.audit_postgres_sslmode
  })
}