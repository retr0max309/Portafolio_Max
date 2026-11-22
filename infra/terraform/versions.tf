terraform {
  required_version = ">= 1.12.0"

  backend "oci" {
    bucket    = "portafolio-max-tfstate-20261122"
    namespace = "gryos5ba7doe"
    key       = "portafolio/terraform.tfstate"
    region    = "sa-saopaulo-1"
  }

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 7.0"
    }
  }
}

provider "oci" {
  region = var.region
}
