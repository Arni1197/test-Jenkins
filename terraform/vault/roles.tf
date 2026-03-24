resource "vault_kubernetes_auth_backend_role" "dev" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "dev-role"
  bound_service_account_names      = ["*"]
  bound_service_account_namespaces = [var.dev_namespace]
  token_policies                   = [vault_policy.dev.name]
}

resource "vault_kubernetes_auth_backend_role" "stage" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "stage-role"
  bound_service_account_names      = ["*"]
  bound_service_account_namespaces = [var.stage_namespace]
  token_policies                   = [vault_policy.stage.name]
}

resource "vault_kubernetes_auth_backend_role" "prod" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "prod-role"
  bound_service_account_names      = ["*"]
  bound_service_account_namespaces = [var.prod_namespace]
  token_policies                   = [vault_policy.prod.name]
}