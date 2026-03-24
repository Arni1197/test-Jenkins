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