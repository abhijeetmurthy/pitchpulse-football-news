import axios from "axios";
import https from "node:https";

const allowInsecure = process.env.ALLOW_INSECURE_TLS === "true";

if (allowInsecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: !allowInsecure
});

export const httpClient = axios.create({
  timeout: 20000,
  httpsAgent,
  headers: {
    "User-Agent": "PitchPulseBot/1.0 (+https://github.com)"
  }
});
