cluster_name           = "game-platform-spb"
k8s_version            = "v1.35.1+k0s.1"
network_driver         = "cilium"
ingress_enabled        = true

apps_nodes_count       = 2
infra_nodes_count      = 2
monitoring_nodes_count = 2

apps_pool_name         = "apps-pool"
infra_pool_name        = "infra-pool"
monitoring_pool_name   = "monitoring-pool"

master_cpu             = 4
apps_cpu               = 4
infra_cpu              = 2
monitoring_cpu         = 4