terraform {
  required_providers {
    twc = {
      source = "timeweb-cloud/timeweb-cloud"
    }
  }
}

provider "twc" {
  token = var.timeweb_token
}