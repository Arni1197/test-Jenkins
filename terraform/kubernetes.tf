data "twc_k8s_preset" "master" {
  cpu  = 4
  type = "master"
}

data "twc_k8s_preset" "apps" {
  cpu  = 4
  type = "worker"
}

data "twc_k8s_preset" "infra" {
  cpu  = 2
  type = "worker"
}

data "twc_k8s_preset" "monitoring" {
  cpu  = 4
  type = "worker"
}

resource "twc_k8s_cluster" "main" {
  name           = var.cluster_name
  version        = var.k8s_version
  network_driver = var.network_driver
  ingress        = var.ingress_enabled

  preset_id = data.twc_k8s_preset.master.id
}

resource "twc_k8s_node_group" "apps" {
  cluster_id = twc_k8s_cluster.main.id
  name       = "apps-pool"
  preset_id  = data.twc_k8s_preset.apps.id
  node_count = var.apps_nodes_count
}

resource "twc_k8s_node_group" "infra" {
  cluster_id = twc_k8s_cluster.main.id
  name       = "infra-pool"
  preset_id  = data.twc_k8s_preset.infra.id
  node_count = var.infra_nodes_count
}

resource "twc_k8s_node_group" "monitoring" {
  cluster_id = twc_k8s_cluster.main.id
  name       = "monitoring-pool"
  preset_id  = data.twc_k8s_preset.monitoring.id
  node_count = var.monitoring_nodes_count
}