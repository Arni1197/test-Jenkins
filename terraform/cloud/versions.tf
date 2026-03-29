terraform {
  required_version = ">= 1.5.0"

  required_providers {
    timeweb-cloud = {
      source  = "timeweb-cloud/timeweb-cloud"
      version = "~> 1.6"
    }
  }
}