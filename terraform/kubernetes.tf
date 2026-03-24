data "twc_k8s_preset" "master" {
  cpu  = var.master_cpu
  type = "master"
}

data "twc_k8s_preset" "apps" {
  cpu  = var.apps_cpu
  type = "worker"
}

data "twc_k8s_preset" "infra" {
  cpu  = var.infra_cpu
  type = "worker"
}

data "twc_k8s_preset" "monitoring" {
  cpu  = var.monitoring_cpu
  type = "worker"
}

resource "twc_k8s_cluster" "main" {
  name           = var.cluster_name
  version        = var.k8s_version
  network_driver = var.network_driver
  ingress        = var.ingress_enabled

  preset_id = data.twc_k8s_preset.master.id

  lifecycle {
    prevent_destroy = true
  }
}

resource "twc_k8s_node_group" "apps" {
  cluster_id = twc_k8s_cluster.main.id
  name       = var.apps_pool_name
  preset_id  = data.twc_k8s_preset.apps.id
  node_count = var.apps_nodes_count

  lifecycle {
    prevent_destroy = true
  }
}

resource "twc_k8s_node_group" "infra" {
  cluster_id = twc_k8s_cluster.main.id
  name       = var.infra_pool_name
  preset_id  = data.twc_k8s_preset.infra.id
  node_count = var.infra_nodes_count

  lifecycle {
    prevent_destroy = true
  }
}

resource "twc_k8s_node_group" "monitoring" {
  cluster_id = twc_k8s_cluster.main.id
  name       = var.monitoring_pool_name
  preset_id  = data.twc_k8s_preset.monitoring.id
  node_count = var.monitoring_nodes_count

  lifecycle {
    prevent_destroy = true
  }
}