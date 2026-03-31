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


variable "vpc_id" {
  description = "VPC ID for private network"
  type        = string
}

variable "redis_version" {
  description = "Redis version label for documentation/reference"
  type        = string
  default     = "redis7"
}