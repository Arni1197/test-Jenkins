output "server_id" {
  description = "Timeweb server ID"
  value       = twc_server.loadtest_vm.id
}

output "server_name" {
  description = "Server name"
  value       = twc_server.loadtest_vm.name
}

output "main_ipv4" {
  description = "Main IPv4 from server resource"
  value       = twc_server.loadtest_vm.main_ipv4
}

output "floating_ip" {
  description = "Floating public IP"
  value       = twc_floating_ip.loadtest_ip.ip
}

output "floating_ip_id" {
  description = "Floating IP resource ID"
  value       = twc_floating_ip.loadtest_ip.id
}