variable "region" {
  description = "Region de OCI donde se creara el portafolio, por ejemplo sa-saopaulo-1."
  type        = string
}

variable "tenancy_ocid" {
  description = "OCID del tenancy, usado para consultar el AD 1 de la region."
  type        = string
}

variable "compartment_ocid" {
  description = "OCID del compartimento que contendra la red y la VM."
  type        = string
}

variable "ssh_public_key_path" {
  description = "Ruta a la clave publica SSH. Por defecto usa la copia publica incluida en el repositorio."
  type        = string
  default     = "portfolio.pub"
}

variable "ssh_ingress_cidr" {
  description = "IP publica del administrador en formato CIDR, por ejemplo 203.0.113.10/32."
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_ingress_cidr, 0)) && var.ssh_ingress_cidr != "0.0.0.0/0"
    error_message = "Indica una red CIDR valida y restringida; no abras SSH a todo Internet."
  }
}

variable "shape" {
  description = "Forma fija de la VM elegida en Oracle Cloud: 2 OCPU y 16 GB."
  type        = string
  default     = "VM.Standard.E2.2"
}

variable "image_ocid" {
  description = "OCID opcional de una imagen Canonical Ubuntu 24.04 compatible con la forma elegida."
  type        = string
  default     = null
}
