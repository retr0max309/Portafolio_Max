# Publicación manual de main y Docker Hub

El workflow `.github/workflows/dev-tests.yml` ejecuta tipos, pruebas unitarias, integración, compilación y E2E en cada push a `dev`. La publicación de `main` y Docker Hub queda a cargo del propietario.

## 1. Integrar dev en main

Espera a que **Actions → Pruebas en dev** termine en verde. Después, desde la carpeta del repositorio:

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

Para la prueba local, usa el puerto 8080 sin cambiar el puerto 80 previsto para la VM:

```powershell
$env:WEB_PORT = '8080'
docker compose --env-file .env.production -f compose.prod.yml build
docker compose --env-file .env.production -f compose.prod.yml up -d --wait
docker compose --env-file .env.production -f compose.prod.yml ps
Invoke-WebRequest http://localhost:8080
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

`--push` publica directamente las imágenes multiarquitectura. En la VM, establece `IMAGE_TAG=v1.0.0` y `WEB_PORT=80` en `.env.production`, copia `compose.prod.yml` y ejecuta `docker compose --env-file .env.production -f compose.prod.yml pull` seguido de `docker compose --env-file .env.production -f compose.prod.yml up -d --no-build --wait`.

Las imágenes se publican manualmente; el workflow de `dev` no usa credenciales de Docker Hub.
