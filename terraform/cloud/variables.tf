variable "timeweb_token" {
  description = "Timeweb API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Region"
  type        = string
  default     = "ru-1"
}

variable "postgres_version" {
  description = "Postgres version"
  type        = string
  default     = "15"
}