# El agente de esta VM puede consultar exclusivamente sus propias ordenes.
resource "oci_identity_dynamic_group" "portfolio_agent" {
  compartment_id = var.tenancy_ocid
  name           = "portafolio_max_agent"
  description    = "Agente de la VM del portafolio para despliegues mediante OCI Run Command"
  matching_rule  = "instance.id = '${oci_core_instance.portfolio.id}'"
}

resource "oci_identity_policy" "portfolio_run_command" {
  compartment_id = var.tenancy_ocid
  name           = "portafolio_max_run_command"
  description    = "Permite al agente ejecutar solo sus propios comandos"
  statements = [
    "Allow dynamic-group ${oci_identity_dynamic_group.portfolio_agent.name} to use instance-agent-command-execution-family in tenancy where request.instance.id=target.instance.id",
  ]
}
