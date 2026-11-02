import { snowflakeStatus } from "../server/snowflakeClient.js";

export default function handler(request, response) {
  response.status(200).json({ ok: true, snowflake: snowflakeStatus() });
}
