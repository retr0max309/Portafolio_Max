import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import worker from "./worker.mjs";

const originalFetch = globalThis.fetch;
const environment = { ORIGIN_URL: "https://portafolio.168-138-148-187.sslip.io" };

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("forwards paths and query parameters to the HTTPS origin", async () => {
  globalThis.fetch = async (request) => {
    assert.equal(request.url, `${environment.ORIGIN_URL}/projects?page=2`);
    assert.equal(request.method, "GET");
    return new Response("projects", { status: 200 });
  };
  const response = await worker.fetch(
    new Request("https://portafolio-max.example.workers.dev/projects?page=2"),
    environment,
  );
  assert.equal(await response.text(), "projects");
});

test("forwards contact form POST bodies", async () => {
  globalThis.fetch = async (request) => {
    assert.equal(request.url, `${environment.ORIGIN_URL}/api/contact`);
    assert.equal(request.method, "POST");
    assert.equal(await request.text(), '{"message":"Hola"}');
    return new Response("accepted", { status: 201 });
  };
  const response = await worker.fetch(
    new Request("https://portafolio-max.example.workers.dev/api/contact", {
      method: "POST",
      body: '{"message":"Hola"}',
    }),
    environment,
  );
  assert.equal(response.status, 201);
});

test("rewrites an origin redirect to the public Cloudflare hostname", async () => {
  globalThis.fetch = async () =>
    new Response(null, {
      status: 302,
      headers: { location: `${environment.ORIGIN_URL}/about` },
    });
  const response = await worker.fetch(
    new Request("https://portafolio-max.example.workers.dev/old"),
    environment,
  );
  assert.equal(
    response.headers.get("location"),
    "https://portafolio-max.example.workers.dev/about",
  );
});
