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


output "app_postgres_networks" {
  value = twc_database_cluster.app_postgres.networks
}

output "audit_postgres_networks" {
  value = twc_database_cluster.audit_postgres.networks
}


output "app_redis_cluster_id" {
  value = twc_database_cluster.app_redis.id
}

output "app_redis_location" {
  value = twc_database_cluster.app_redis.location
}

output "app_redis_port" {
  value = twc_database_cluster.app_redis.port
}

output "app_redis_networks" {
  value = twc_database_cluster.app_redis.networks
}