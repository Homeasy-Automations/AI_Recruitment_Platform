import type { MetadataRoute } from "next";

interface JobItem {
  id: number;
  job_title?: string;
  company_name?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://ai-recruitment-platform-kappa.vercel.app"
  ).replace(/\/+$/, "");

  const now = new Date();

  // Core static pages with priority and change frequencies
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/student`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/student/guidance`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/resume-builder`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/self-introduction`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/mock-interview`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/company`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/recruiter`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/company-interview`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/college`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/college/dashboard`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamically fetch public job postings from backend if available
  const backendUrl =
    process.env.BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

  let jobRoutes: MetadataRoute.Sitemap = [];

  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/+$/, "")}/jobs`, {
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const jobs: JobItem[] = await response.json();
        if (Array.isArray(jobs)) {
          jobRoutes = jobs.map((job) => ({
            url: `${siteUrl}/company-interview?job_id=${job.id}`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
          }));
        }
      }
    } catch {
      // If backend is waking up or unreachable during build, gracefully return static routes
    }
  }

  return [...staticRoutes, ...jobRoutes];
}
