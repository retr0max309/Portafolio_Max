# Se usa la imagen mas reciente de Ubuntu 24.04 para la arquitectura de la VM.
# image_ocid permite fijar una imagen concreta si OCI no devuelve resultados.
data "oci_identity_availability_domain" "ad1" {
  compartment_id = var.tenancy_ocid
  ad_number      = 1
}

data "oci_core_images" "ubuntu" {
  count                    = var.image_ocid == null ? 1 : 0
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.shape
  state                    = "AVAILABLE"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

locals {
  ubuntu_image_id = var.image_ocid != null ? var.image_ocid : data.oci_core_images.ubuntu[0].images[0].id
}

resource "oci_core_vcn" "portfolio" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.42.0.0/16"]
  display_name   = "portafolio-vcn"
  dns_label      = "portfolio"
}

resource "oci_core_internet_gateway" "portfolio" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portafolio-internet-gateway"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portafolio-public-routes"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.portfolio.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.portfolio.id
  display_name   = "portafolio-public-security"

  # SSH solo desde la IP del administrador.
  ingress_security_rules {
    protocol = "6"
    source   = var.ssh_ingress_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # La regla de 443 deja la red preparada; HTTPS requiere un proxy y dominio.
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.portfolio.id
  cidr_block                 = "10.42.1.0/24"
  display_name               = "portafolio-public-subnet"
  dns_label                  = "web"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
}

resource "oci_core_instance" "portfolio" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domain.ad1.name
  display_name        = "portafolioMax"
  shape               = var.shape

  source_details {
    source_type             = "image"
    source_id               = local.ubuntu_image_id
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = trimspace(file(var.ssh_public_key_path))
  }
}
