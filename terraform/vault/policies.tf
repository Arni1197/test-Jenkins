resource "vault_policy" "dev" {
  name = "dev-policy"

  policy = <<EOT
path "${var.kv_mount_path}/data/app/dev/*" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/metadata/app/dev/*" {
  capabilities = ["read", "list"]
}
EOT
}

resource "vault_policy" "stage" {
  name = "stage-policy"

  policy = <<EOT
path "${var.kv_mount_path}/data/app/stage/*" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/metadata/app/stage/*" {
  capabilities = ["read", "list"]
}
EOT
}

resource "vault_policy" "prod" {
  name = "prod-policy"

  policy = <<EOT
path "${var.kv_mount_path}/data/app/prod/*" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/metadata/app/prod/*" {
  capabilities = ["read", "list"]
}
EOT
}