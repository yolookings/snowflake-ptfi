import http from "node:http";

import { getDashboardData, snowflakeStatus } from "./snowflakeClient.js";

const port = Number(process.env.API_PORT || 8787);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, snowflake: snowflakeStatus() });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/dashboard") {
    sendJson(response, 200, await getDashboardData());
    return;
  }

  sendJson(response, 404, { error: "API route tidak ditemukan." });
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error.message);
    sendJson(response, 500, { error: "Data Snowflake tidak dapat dimuat." });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PTFI Snowflake bridge listening on http://127.0.0.1:${port}`);
});
