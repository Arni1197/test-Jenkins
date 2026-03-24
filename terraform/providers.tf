terraform {
  required_version = ">= 1.5.0"

  required_providers {
    twc = {
      source  = "timeweb-cloud/timeweb-cloud"
    }
  }
}

provider "twc" {
  token = var.timeweb_token
}