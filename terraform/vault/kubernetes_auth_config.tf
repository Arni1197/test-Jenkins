resource "vault_kubernetes_auth_backend_config" "kubernetes" {
  backend              = vault_auth_backend.kubernetes.path
  kubernetes_host      = var.kubernetes_host
  kubernetes_ca_cert   = var.kubernetes_ca_cert
  disable_local_ca_jwt = true
}

resource "vault_policy" "external_secrets" {
  name = "external-secrets-policy"

  policy = <<EOT
path "${var.kv_mount_path}/data/app/dev/*" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/metadata/app/dev/*" {
  capabilities = ["read", "list"]
}
EOT
}

resource "vault_kubernetes_auth_backend_role" "external_secrets" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "external-secrets-role"
  bound_service_account_names      = ["external-secrets"]
  bound_service_account_namespaces = ["external-secrets"]
  token_policies                   = [vault_policy.external_secrets.name]
}