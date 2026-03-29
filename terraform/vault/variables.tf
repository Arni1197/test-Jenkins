variable "kv_mount_path" {
  description = "Path for KV secrets engine"
  type        = string
  default     = "kv"
}

variable "kubernetes_auth_path" {
  description = "Path for Kubernetes auth backend"
  type        = string
  default     = "kubernetes"
}

variable "dev_namespace" {
  description = "Kubernetes namespace for dev"
  type        = string
  default     = "dev"
}

variable "stage_namespace" {
  description = "Kubernetes namespace for stage"
  type        = string
  default     = "stage"
}

variable "prod_namespace" {
  description = "Kubernetes namespace for prod"
  type        = string
  default     = "prod"
}


variable "business_postgres_host" {
  description = "Business PostgreSQL host"
  type        = string
  default     = "CHANGE_ME_BUSINESS_HOST"
}

variable "business_postgres_port" {
  description = "Business PostgreSQL port"
  type        = number
  default     = 5432
}

variable "business_postgres_database" {
  description = "Business PostgreSQL database name"
  type        = string
  default     = "app_db"
}

variable "business_postgres_username" {
  description = "Business PostgreSQL username"
  type        = string
  default     = "app_user"
}

variable "business_postgres_password" {
  description = "Business PostgreSQL password"
  type        = string
  sensitive   = true
  default     = "CHANGE_ME_BUSINESS_PASSWORD"
}

variable "business_postgres_sslmode" {
  description = "Business PostgreSQL sslmode"
  type        = string
  default     = "require"
}

variable "audit_postgres_host" {
  description = "Audit PostgreSQL host"
  type        = string
  default     = "CHANGE_ME_AUDIT_HOST"
}

variable "audit_postgres_port" {
  description = "Audit PostgreSQL port"
  type        = number
  default     = 5432
}

variable "audit_postgres_database" {
  description = "Audit PostgreSQL database name"
  type        = string
  default     = "audit_db"
}

variable "audit_postgres_username" {
  description = "Audit PostgreSQL username"
  type        = string
  default     = "audit_user"
}

variable "audit_postgres_password" {
  description = "Audit PostgreSQL password"
  type        = string
  sensitive   = true
  default     = "CHANGE_ME_AUDIT_PASSWORD"
}

variable "audit_postgres_sslmode" {
  description = "Audit PostgreSQL sslmode"
  type        = string
  default     = "require"
}