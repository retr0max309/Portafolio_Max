# Publicación en main y Docker Hub

El workflow `.github/workflows/all-tests.yml` ejecuta tipos, pruebas unitarias, integración, compilación y E2E en cada push a `dev`. Al hacer push a `main`, `.github/workflows/terraform-vm.yml` repite esas pruebas, aplica Terraform, publica las imágenes AMD64 en Docker Hub y las despliega en la VM. Los comandos siguientes sirven para revisar o repetir el proceso manualmente.

## 1. Integrar dev en main

Espera a que **Actions → Todas las pruebas** termine en verde. Después, desde la carpeta del repositorio:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff dev -m "feat(release): publicar portafolio con Docker"
git push origin main
```

Si Git informa conflictos, resuélvelos y vuelve a ejecutar las pruebas antes del push. También puedes abrir un pull request de `dev` a `main` y hacer el merge desde GitHub.

## 2. Preparar variables de producción

```powershell
if (!(Test-Path .env.production)) { Copy-Item .env.production.example .env.production }
notepad .env.production
```

Confirma que `DOCKERHUB_USERNAME` coincide con tu usuario de Docker Hub y que `SUPABASE_PUBLISHABLE_KEY` contiene la clave publicable del proyecto. No subas `.env.production` a Git; está ignorado. La API utiliza `SUPABASE_URL` y la clave en tiempo de ejecución.

## 3. Construir y probar localmente

Para la prueba local, usa el puerto 8081. En la VM, el contenedor web usa el puerto local 8080 y Nginx publica 80/443:

```powershell
$env:WEB_PORT = '8081'
docker compose --env-file .env.production -f compose.prod.yml build
docker compose --env-file .env.production -f compose.prod.yml up -d --wait
docker compose --env-file .env.production -f compose.prod.yml ps
Invoke-WebRequest http://localhost:8081 -UseBasicParsing
docker compose --env-file .env.production -f compose.prod.yml down
Remove-Item Env:\WEB_PORT
```

Si falla el arranque, revisa `docker compose --env-file .env.production -f compose.prod.yml logs api web`. El servicio web solo publica el puerto HTTP; NestJS permanece en la red interna de Compose.

## 4. Subir las imágenes a Docker Hub

Crea los repositorios `portafolio-api` y `portafolio-web` en Docker Hub si quieres definir su visibilidad antes de subirlos. Inicia sesión:

```powershell
docker login -u retr0max309
```

Para que las imágenes funcionen tanto en una VM x86_64 como en una VM ARM de Oracle Cloud, publícalas con Buildx para las dos arquitecturas. Cambia el usuario si tu cuenta de Docker Hub tiene otro nombre:

```powershell
$dockerHubUser = 'retr0max309'
$imageTag = 'v1.0.0'
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.api -t "${dockerHubUser}/portafolio-api:${imageTag}" --push .
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.web -t "${dockerHubUser}/portafolio-web:${imageTag}" --push .
```

`--push` publica directamente las imágenes multiarquitectura. En la VM, establece `IMAGE_TAG=v1.0.0` y `WEB_PORT=8080` en `.env.production`, copia `compose.prod.yml` y ejecuta `docker compose --env-file .env.production -f compose.prod.yml pull` seguido de `docker compose --env-file .env.production -f compose.prod.yml up -d --no-build --wait`. Nginx recibe las conexiones públicas en 80/443 y reenvía al contenedor web local.

El workflow de `dev` no usa credenciales de Docker Hub. El de `main` usa el secreto `DOCKERHUB_TOKEN` para la publicación automática.
