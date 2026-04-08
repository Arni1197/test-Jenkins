terraform {
  required_version = ">= 1.5.0"

  required_providers {
    twc = {
      source  = "tf.timeweb.cloud/timeweb-cloud/timeweb-cloud"
      version = "~> 1.6"
    }
  }

  cloud {
    organization = "LAB-DEVOPS1997"

    workspaces {
      name = "LOAD_VM"
    }
  }
}

provider "twc" {}

data "twc_os" "debian_13" {
  name    = "debian"
  version = "13"
}

data "twc_configurator" "nvme_spb" {
  location  = var.location
  disk_type = "nvme"
}

data "twc_ssh_keys" "main" {
  name = var.ssh_key_name
}

resource "twc_server" "loadtest_vm" {
  name                      = var.server_name
  os_id                     = data.twc_os.debian_13.id
  availability_zone         = var.availability_zone
  ssh_keys_ids              = [data.twc_ssh_keys.main.id]
  is_root_password_required = false
  comment                   = "Persistent VM for k6 load testing and future GitHub self-hosted runner"

  configuration {
    configurator_id = data.twc_configurator.nvme_spb.id
    cpu             = var.cpu
    ram             = var.ram_mb
    disk            = var.disk_mb
  }

  cloud_init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    admin_user = var.admin_user
  })
}

resource "twc_floating_ip" "loadtest_ip" {
  availability_zone = var.availability_zone
  comment           = "Floating IP for ${var.server_name}"

  resource {
    type = "server"
    id   = twc_server.loadtest_vm.id
  }
}