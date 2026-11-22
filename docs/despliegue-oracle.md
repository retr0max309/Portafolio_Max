# Despliegue en Oracle Cloud: qué hace cada etapa

La prueba en `localhost:8081` confirma que las imágenes funcionan en tu computadora. Una VM en Oracle Cloud las ejecutará con una IP pública para que la página siga disponible aunque apagues tu PC.

**Estado del 22 de noviembre de 2026:** Terraform creó en el compartimento raíz la VCN, la puerta de enlace, la tabla de rutas, la lista de seguridad, la subred, la VM `portafolioMax`, un bucket privado para el estado y la política que permite OCI Run Command en esa VM. La IP pública asignada es `168.138.148.187`. Se comprobó por SSH que la VM ejecuta Ubuntu 24.04.5 LTS `x86_64`. El OCID de la imagen quedó fijado como variable del repositorio en GitHub para evitar reemplazos por una actualización del catálogo de imágenes.

## 1. Terraform: crear infraestructura

[`infra/terraform`](../infra/terraform) describe los recursos de OCI como código:

| Recurso | Por qué se necesita |
| --- | --- |
| VCN `10.42.0.0/16` | Red privada de tu proyecto dentro de Oracle Cloud. |
| Subred pública `10.42.1.0/24` | Ubicación de la VM dentro de la VCN. |
| Internet Gateway y tabla de rutas | Permiten que la subred alcance Internet para descargar imágenes y responder a visitantes. |
| Security list | Abre 80 y 443 al público; limita SSH 22 a tu IP. Es el filtro de red de OCI. |
| VM Ubuntu 24.04 | Ejecuta Docker y el portafolio. Usa la forma AMD fija `VM.Standard.E2.2` de tus capturas: 2 OCPU y 16 GB, compatible con tu imagen `linux/amd64`. |
| IP pública | Dirección que usarán SSH y los visitantes. |

La regla del puerto 443 **todavía no crea HTTPS**. Para servir HTTPS faltará un dominio y un proxy con certificado. La primera publicación se prueba con `http://<IP_PUBLICA>` por el puerto 80.

En tus capturas seleccionas `VM.Standard.E2.2` (forma fija AMD de 2 OCPU y 16 GB), la VCN existente `vcn-20260924-1027` en el compartimento raíz y una subred nueva `10.0.0.0/24`. Esta configuración Terraform usa la misma forma de VM, pero **crea una VCN nueva** y una subred propia en el compartimento raíz, como indicaste después. La forma fija no lleva `shape_config`: sus CPU y memoria ya están determinadas por el nombre de la forma.

### Datos que debes obtener de tu cuenta OCI

1. Configura la autenticación del proveedor OCI con las variables de entorno `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT` y `OCI_PRIVATE_KEY_PATH`, mediante la **API signing key** PEM que ya tienes. El PEM privado se queda fuera del repositorio. Terraform no necesita crear `~/.oci/config` para este método.
2. La región será `sa-saopaulo-1` y todos los recursos se crearán en el compartimento raíz, cuyo OCID coincide con el del tenancy. Terraform consulta a OCI el nombre completo de AD 1 para evitar errores al transcribirlo. La forma E2.2 puede generar cobros según tu cuenta; revisa el cálculo de OCI antes de `apply`.
3. Ya tienes un par SSH `ssh-key-2026-10-01.key` y `.key.pub` en la carpeta `TareasFinales`. Terraform lee la copia **pública** `infra/terraform/portfolio.pub` del repositorio; `ssh` y `scp` usan la **privada** que permanece fuera de Git. Nunca copies una clave privada al repositorio.
4. Averigua tu IP pública actual y escribe `IP/32` en `ssh_ingress_cidr`. Esa regla protege SSH. Si tu IP cambia, tendrás que actualizar la regla para poder reconectar.

En la consola OCI, el menú de perfil muestra **Tenancy** (copia su OCID) y **User settings** (copia el OCID del usuario y revisa el fingerprint de la API key). El OCID del tenancy funciona también como OCID del compartimento raíz. Estos OCID identifican dónde se crean los recursos y con qué usuario se autentica Terraform; no son claves privadas.

En este equipo, `infra/terraform/terraform.tfvars` ya contiene la región, el compartimento raíz, la forma de VM, la ruta a la clave SSH pública y el CIDR autorizado para SSH. Está ignorado por Git; no lo sustituyas copiando el ejemplo. Al abrir una terminal nueva, el proveedor OCI necesita nuevamente las cuatro variables de entorno de autenticación. Sustituye los marcadores por los datos de tu cuenta y la ruta al PEM privado:

```powershell
$env:OCI_TENANCY_OCID = '<OCID_DEL_TENANCY>'
$env:OCI_USER_OCID = '<OCID_DEL_USUARIO>'
$env:OCI_FINGERPRINT = '<FINGERPRINT_DE_LA_API_KEY>'
$env:OCI_PRIVATE_KEY_PATH = 'C:\ruta\a\tu\clave-api.pem'
cd infra\terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
```

`init` configura el proveedor y el backend OCI; `validate` revisa la configuración; `plan` muestra los cambios propuestos. El archivo `terraform.tfvars` y los planes están ignorados por Git. El estado se migró a un bucket privado de OCI Object Storage con versionado; así GitHub Actions y tu equipo comparten el mismo inventario de recursos. La copia local anterior quedó como respaldo ignorado por Git. `terraform output public_ip` muestra la IP pública.

## 2. Script Bash: configurar y desplegar en la VM

[`scripts/deploy-vm.sh`](../scripts/deploy-vm.sh) se ejecuta **dentro de Ubuntu** con `sudo`. Instala Git, Docker Engine y Compose desde el repositorio oficial de Docker; añade reglas `iptables` para SSH desde tu IP y los puertos 80/443; guarda esas reglas para reinicios. Después copia los archivos de producción a `/opt/portafolio`, descarga las imágenes de Docker Hub y arranca la API y la web. Se puede volver a ejecutar para actualizar las imágenes, siempre que `IMAGE_TAG` apunte a una etiqueta publicada.

El firewall del sistema y la security list de OCI son dos filtros distintos. La lista de OCI limita SSH a tu IP y permite HTTP/HTTPS. El script coloca la regla SSH específica **antes** de la regla de bloqueo para no cortar el acceso. Docker gestiona reglas propias para los puertos publicados; por eso también debe mantenerse correcta la security list de OCI. El puerto 443 queda abierto, pero el sitio todavía no ofrece HTTPS: hace falta dominio, proxy y certificado.

Antes de cada despliegue, revisa `.env.production` en tu computadora: `DOCKERHUB_USERNAME=retr0max309`, `IMAGE_TAG=v1.0.0`, `WEB_PORT=80`, `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Ese archivo está ignorado por Git y se copia a la VM con permisos `0600` bajo `/opt/portafolio`. **No publiques su contenido ni la clave privada SSH.**

En PowerShell, desde la raíz del repositorio, puedes repetir la copia y la ejecución cuando cambie la versión de las imágenes:

```powershell
$sshKey = 'C:\Users\NITRO\Documents\Proyecto-Sistemas III\TareasFinales\ssh-key-2026-10-01.key'
$knownHosts = Join-Path (Get-Location) 'infra\terraform\known_hosts'
$vm = 'ubuntu@168.138.148.187'
ssh -i $sshKey -o "UserKnownHostsFile=$knownHosts" $vm 'mkdir -p ~/portafolio-stage/scripts && chmod 700 ~/portafolio-stage ~/portafolio-stage/scripts'
scp -i $sshKey -o "UserKnownHostsFile=$knownHosts" scripts/deploy-vm.sh scripts/remote-release.sh "${vm}:portafolio-stage/scripts/"
scp -i $sshKey -o "UserKnownHostsFile=$knownHosts" compose.prod.yml .env.production "${vm}:portafolio-stage/"
ssh -i $sshKey -o "UserKnownHostsFile=$knownHosts" $vm 'chmod 600 ~/portafolio-stage/.env.production && sudo bash ~/portafolio-stage/scripts/deploy-vm.sh 181.115.171.183/32'
```

`ssh` abre la sesión remota, `scp` copia los archivos y `sudo bash` ejecuta la instalación en Ubuntu. El script usa `docker compose pull` y luego `up -d --no-build --wait`: descarga imágenes ya publicadas, las arranca sin compilarlas en la VM y espera a que estén listas. Además instala `remote-release.sh` como comando root para los despliegues automáticos. No ejecuta `docker compose down` en tu PC ni afecta a `localhost:8081`. Si cambia tu IP pública, primero actualiza `SSH_INGRESS_CIDR` en GitHub y ejecuta el workflow de `main` para actualizar la security list de OCI; después configura el firewall de Ubuntu con el nuevo `IP/32`.

## 3. Comprobar el acceso público

```powershell
$vmIp = '<IP_PUBLICA_DE_TERRAFORM>'
Invoke-WebRequest "http://$vmIp" -UseBasicParsing | Select-Object StatusCode
```

Después abre `http://<IP_PUBLICA>` en un navegador, revisa proyectos y envía un mensaje de contacto. Comprueba el mensaje nuevo en la tabla `contact_messages` de Supabase. En la VM, `sudo docker compose --env-file /opt/portafolio/.env.production -f /opt/portafolio/compose.prod.yml ps` permite ver ambos contenedores. La ruta pública `/api/projects` no existe en Next.js; la web consulta esa ruta en NestJS dentro de la red de Compose.

Mientras la VM y los contenedores sigan activos, el portafolio seguirá disponible sin tu PC. `restart: unless-stopped` en Compose ayuda a reiniciar los servicios si Docker o la VM se reinician.

## 4. Pipeline de `main`

El workflow [`main-release.yml`](../.github/workflows/main-release.yml) se ejecuta con cada push a `main` o manualmente desde GitHub Actions. Primero usa Terraform para revisar y aplicar la infraestructura. Si el plan propone borrar o reemplazar un recurso, se detiene: evita destruir la VM por accidente. Después Buildx construye la API y la web para AMD64 y ARM64 y publica cada imagen en Docker Hub con `latest` y `sha-<commit>`.

La última etapa envía a OCI Run Command una orden que ejecuta el script `/usr/local/sbin/portafolio-release` dentro de Ubuntu. Ese script descarga el `compose.prod.yml` del commit publicado, fija `IMAGE_TAG=sha-<commit>`, descarga ambas imágenes y espera su estado saludable. La API mantiene su configuración de Supabase en `/opt/portafolio/.env.production`, archivo que nunca entra en Git ni en el comando remoto. Al final Actions consulta la página por HTTP.

GitHub Actions usa los secretos `DOCKERHUB_TOKEN` y `OCI_PRIVATE_KEY_PEM`; las variables `DOCKERHUB_USERNAME`, `OCI_TENANCY_OCID`, `OCI_USER_OCID`, `OCI_FINGERPRINT`, `OCI_REGION`, `UBUNTU_IMAGE_OCID` y `SSH_INGRESS_CIDR` identifican los recursos y parámetros. El PEM privado se escribe solo en el runner temporal y se borra al terminar. Para revisar una ejecución, abre **GitHub → Actions → Publicar y desplegar main** y mira las tres tareas `infrastructure`, `publish` y `deploy`.
