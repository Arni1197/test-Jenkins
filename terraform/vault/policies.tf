resource "vault_policy" "app_read_policy" {
  name = "app-read-policy"

  policy = <<EOT
path "kv/data/app/*" {
  capabilities = ["read"]
}

path "kv/metadata/app/*" {
  capabilities = ["read", "list"]
}
EOT
}