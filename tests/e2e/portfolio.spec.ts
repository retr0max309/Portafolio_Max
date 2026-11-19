import { expect, test } from '@playwright/test';

test('muestra el perfil, las secciones y el CV', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Maximiliano.*Turdera Colque/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Habilidades' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Descargar CV (PDF)' })).toHaveAttribute('href', /Maximiliano_Turdera_Colque_CV.pdf/);
});

test('navega a proyectos desde el menú móvil y muestra datos publicados', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menuButton = page.getByRole('button', { name: 'Abrir menú' });
  await expect(menuButton).toBeEnabled();
  await menuButton.click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Proyectos' }).click();
  await expect(page).toHaveURL(/#proyectos$/);
  await expect(page.locator('#proyectos article')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Barbara Ocasión' })).toBeVisible();
});

test('envía un mensaje de contacto y confirma el guardado', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nombre').fill('Visitante de prueba');
  await page.getByLabel('Correo electrónico').fill('visita@example.com');
  await page.getByLabel('Mensaje').fill('Hola Maximiliano, este es un mensaje de prueba E2E.');
  const submitButton = page.getByRole('button', { name: /Enviar mensaje/ });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(page.getByRole('status')).toContainText('Tu mensaje quedó guardado');
});

test('tolera un atributo de extensión añadido al body antes de hidratar', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && /hydrated but some attributes/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const addAttribute = () => {
      if (!document.body) return false;
      document.body.setAttribute('cz-shortcut-listen', 'true');
      return true;
    };
    if (!addAttribute()) {
      const observer = new MutationObserver(() => {
        if (addAttribute()) observer.disconnect();
      });
      observer.observe(document, { childList: true, subtree: true });
    }
  });

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('cz-shortcut-listen', 'true');
  await expect(page.getByRole('button', { name: /Enviar mensaje/ })).toBeEnabled();
  expect(hydrationErrors).toEqual([]);
});
