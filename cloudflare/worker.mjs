// Cloudflare's stable workers.dev URL forwards the complete portfolio to the VM.
export default {
  async fetch(request, env) {
    const visitorUrl = new URL(request.url);
    const originUrl = new URL(env.ORIGIN_URL);
    originUrl.pathname = visitorUrl.pathname;
    originUrl.search = visitorUrl.search;

    const upstream = new Request(originUrl, request);
    upstream.headers.delete("host");
    upstream.headers.set("x-forwarded-host", visitorUrl.host);

    const originResponse = await fetch(upstream);
    const response = new Response(originResponse.body, originResponse);
    const location = response.headers.get("location");
    if (location) {
      const destination = new URL(location, originUrl);
      if (destination.origin === originUrl.origin) {
        destination.protocol = visitorUrl.protocol;
        destination.host = visitorUrl.host;
        response.headers.set("location", destination.toString());
      }
    }
    return response;
  },
};
