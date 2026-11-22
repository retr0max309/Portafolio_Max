output "public_ip" {
  description = "IP publica de la VM para SSH y HTTP."
  value       = oci_core_instance.portfolio.public_ip
}

output "instance_ocid" {
  description = "OCID de la VM para OCI Run Command."
  value       = oci_core_instance.portfolio.id
}

output "http_url" {
  description = "URL inicial del portafolio. HTTPS requiere la etapa de dominio y proxy."
  value       = "http://${oci_core_instance.portfolio.public_ip}"
}

output "ssh_command" {
  description = "Ejemplo de conexion; agrega -i con la ruta a tu clave privada."
  value       = "ssh ubuntu@${oci_core_instance.portfolio.public_ip}"
}
