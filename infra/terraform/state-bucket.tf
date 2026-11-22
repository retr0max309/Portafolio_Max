# Este bucket guarda el estado remoto despues de la migracion inicial.
data "oci_objectstorage_namespace" "portfolio" {
  compartment_id = var.tenancy_ocid
}

resource "oci_objectstorage_bucket" "terraform_state" {
  compartment_id = var.compartment_ocid
  namespace      = data.oci_objectstorage_namespace.portfolio.namespace
  name           = "portafolio-max-tfstate-20261122"
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"
  versioning     = "Enabled"

  lifecycle {
    prevent_destroy = true
  }
}

output "state_bucket_namespace" {
  description = "Namespace de OCI Object Storage para el backend Terraform."
  value       = data.oci_objectstorage_namespace.portfolio.namespace
}
