import { getDashboardData } from "../server/snowflakeClient.js";

// Vercel serverless entry point. Locally the same data is served by server/index.js.
export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const payload = await getDashboardData();
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(payload);
  } catch (error) {
    console.error(error.message);
    response.status(500).json({ error: "Data Snowflake tidak dapat dimuat." });
  }
}
