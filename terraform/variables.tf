variable "timeweb_token" {
  description = "TimeWeb Cloud API token"
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  description = "Existing cluster name"
  type        = string
}

variable "k8s_version" {
  description = "Kubernetes version"
  type        = string
}

variable "network_driver" {
  description = "Cluster network driver"
  type        = string
}

variable "ingress_enabled" {
  description = "Enable ingress addon"
  type        = bool
}

variable "apps_nodes_count" {
  description = "Apps pool node count"
  type        = number
}

variable "infra_nodes_count" {
  description = "Infra pool node count"
  type        = number
}

variable "monitoring_nodes_count" {
  description = "Monitoring pool node count"
  type        = number
}

variable "apps_pool_name" {
  description = "Apps node group name"
  type        = string
  default     = "apps-pool"
}

variable "infra_pool_name" {
  description = "Infra node group name"
  type        = string
  default     = "infra-pool"
}

variable "monitoring_pool_name" {
  description = "Monitoring node group name"
  type        = string
  default     = "monitoring-pool"
}

variable "master_cpu" {
  description = "Master preset CPU"
  type        = number
  default     = 4
}

variable "apps_cpu" {
  description = "Apps preset CPU"
  type        = number
  default     = 4
}

variable "infra_cpu" {
  description = "Infra preset CPU"
  type        = number
  default     = 2
}

variable "monitoring_cpu" {
  description = "Monitoring preset CPU"
  type        = number
  default     = 4
}