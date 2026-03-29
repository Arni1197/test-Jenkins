output "app_postgres_cluster_id" {
  value = twc_database_cluster.app_postgres.id
}

output "audit_postgres_cluster_id" {
  value = twc_database_cluster.audit_postgres.id
}

output "app_postgres_location" {
  value = twc_database_cluster.app_postgres.location
}

output "audit_postgres_location" {
  value = twc_database_cluster.audit_postgres.location
}

output "app_postgres_port" {
  value = twc_database_cluster.app_postgres.port
}

output "audit_postgres_port" {
  value = twc_database_cluster.audit_postgres.port
}