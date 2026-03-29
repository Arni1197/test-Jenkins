output "app_postgres_host" {
  value = twc_database_cluster.app_postgres.host
}

output "audit_postgres_host" {
  value = twc_database_cluster.audit_postgres.host
}

output "app_postgres_user" {
  value = twc_database_user.app_user.name
}

output "audit_postgres_user" {
  value = twc_database_user.audit_user.name
}