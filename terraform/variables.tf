variable "timeweb_token" {
  type      = string
  sensitive = true
}

variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "k8s_version" {
  type = string
}

variable "network_driver" {
  type = string
}

variable "ingress_enabled" {
  type = bool
}

variable "apps_nodes_count" {
  type = number
}

variable "infra_nodes_count" {
  type = number
}

variable "monitoring_nodes_count" {
  type = number
}