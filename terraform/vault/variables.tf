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
variable "kubernetes_host" {
  description = "Kubernetes API server URL for Vault auth backend"
  type        = string
}

variable "kubernetes_ca_cert" {
  description = "Kubernetes CA certificate for Vault auth backend"
  type        = string
  sensitive   = true
}

variable "kubernetes_token_reviewer_jwt" {
  description = "Token reviewer JWT for Vault Kubernetes auth backend"
  type        = string
  sensitive   = true
}