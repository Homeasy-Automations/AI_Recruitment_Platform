const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";
const PRODUCTION_RENDER_BACKEND = "https://ai-recruitment-platform-2iwv.onrender.com";

export async function GET() {
  const backendUrl =
    process.env.BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? LOCAL_BACKEND_URL : PRODUCTION_RENDER_BACKEND);

  const normalizedUrl = backendUrl.replace(/\/+$/, "");

  try {
    const healthPromise = fetch(`${normalizedUrl}/health`, {
      cache: "no-store",
    });
    const rolesPromise = fetch(`${normalizedUrl}/students/target-roles`, {
      cache: "no-store",
    });

    const [healthRes, rolesRes] = await Promise.allSettled([
      healthPromise,
      rolesPromise,
    ]);

    const healthStatus =
      healthRes.status === "fulfilled" ? healthRes.value.status : "failed";
    const rolesStatus =
      rolesRes.status === "fulfilled" ? rolesRes.value.status : "failed";

    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      backendUrl: normalizedUrl,
      healthCheckStatus: healthStatus,
      rolesStatus: rolesStatus,
    });
  } catch (error) {
    return Response.json(
      {
        status: "ping_dispatched",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}

export const dynamic = "force-dynamic";
