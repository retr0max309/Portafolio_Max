output "public_ip" {
  description = "IP publica de la VM para SSH y HTTP."
  value       = oci_core_instance.portfolio.public_ip
}

output "instance_ocid" {
  description = "OCID de la VM para OCI Run Command."
  value       = oci_core_instance.portfolio.id
}

output "http_url" {
  description = "URL HTTP de respaldo para la IP publica."
  value       = "http://${oci_core_instance.portfolio.public_ip}"
}

output "https_origin_url" {
  description = "Origen HTTPS servido por Nginx en el puerto 443 de la VM."
  value       = "https://portafolio.${replace(oci_core_instance.portfolio.public_ip, ".", "-")}.sslip.io"
}

output "ssh_command" {
  description = "Ejemplo de conexion; agrega -i con la ruta a tu clave privada."
  value       = "ssh ubuntu@${oci_core_instance.portfolio.public_ip}"
}
