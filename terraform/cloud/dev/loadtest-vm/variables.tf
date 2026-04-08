variable "server_name" {
  description = "Server name in Timeweb Cloud"
  type        = string
  default     = "game-platform-loadtest-dev"
}

variable "location" {
  description = "Timeweb location"
  type        = string
  default     = "ru-1"
}

variable "availability_zone" {
  description = "Timeweb availability zone"
  type        = string
  default     = "spb-3"
}

variable "cpu" {
  description = "vCPU count"
  type        = number
  default     = 2
}

variable "ram_mb" {
  description = "RAM in MB"
  type        = number
  default     = 2048
}

variable "disk_mb" {
  description = "Disk in MB"
  type        = number
  default     = 40960
}

variable "admin_user" {
  description = "Admin username created by cloud-init"
  type        = string
  default     = "devops"
}

variable "ssh_key_name" {
  description = "Existing SSH key name in Timeweb Cloud"
  type        = string
  default     = "sherlock97@Noutbuk-Arnold.local"
}