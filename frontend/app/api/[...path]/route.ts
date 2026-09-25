const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";

type RouteParameters = {
  params: Promise<{ path: string[] }>;
};

const REQUEST_HEADERS_TO_REMOVE = [
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
];

async function forwardRequest(request: Request, context: RouteParameters) {
  const backendUrl =
    process.env.BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? LOCAL_BACKEND_URL : "");

  if (!backendUrl) {
    return Response.json(
      {
        detail: "BACKEND_URL is not configured for this deployment.",
      },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  let targetUrl: URL;

  try {
    targetUrl = new URL(
      path.map(encodeURIComponent).join("/"),
      `${backendUrl.replace(/\/+$/, "")}/`,
    );
  } catch {
    return Response.json(
      { detail: "BACKEND_URL is not a valid HTTP address." },
      { status: 503 },
    );
  }

  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  REQUEST_HEADERS_TO_REMOVE.forEach((header) => headers.delete(header));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  
  // Buffer body if possible to allow automatic retries during server wake-up/cold starts
  let bodyBuffer: ArrayBuffer | null = null;
  if (hasBody) {
    try {
      bodyBuffer = await request.arrayBuffer();
    } catch {
      // Fallback if body cannot be read as array buffer
      bodyBuffer = null;
    }
  }

  const maxAttempts = 3;
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const options: RequestInit & { duplex?: "half" } = {
        method: request.method,
        headers,
        body: hasBody ? (bodyBuffer || undefined) : undefined,
        cache: "no-store",
      };
      if (hasBody) options.duplex = "half";

      const backendResponse = await fetch(targetUrl, options);
      
      // If backend is still starting up (502 Bad Gateway or 503 Service Unavailable from Render router),
      // wait briefly and retry before failing the user request.
      if (
        [502, 503, 504].includes(backendResponse.status) &&
        attempt < maxAttempts
      ) {
        lastResponse = backendResponse;
        await new Promise((resolve) => setTimeout(resolve, 2500));
        continue;
      }

      const responseHeaders = new Headers(backendResponse.headers);
      responseHeaders.delete("content-encoding");
      responseHeaders.delete("content-length");
      responseHeaders.delete("transfer-encoding");

      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
  }

  if (lastResponse) {
    const responseHeaders = new Headers(lastResponse.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    return new Response(lastResponse.body, {
      status: lastResponse.status,
      statusText: lastResponse.statusText,
      headers: responseHeaders,
    });
  }

  return Response.json(
    {
      detail:
        "The backend is not reachable. Verify BACKEND_URL and the FastAPI service.",
      error: lastError instanceof Error ? lastError.message : undefined,
    },
    { status: 503 },
  );
}

// Allow up to 60 seconds for cold start / wake up before Vercel times out
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;
export const HEAD = forwardRequest;
