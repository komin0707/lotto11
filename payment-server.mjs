import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.join(__dirname, "public");
const port = Number(process.env.PORT || 5187);

const tossSecretKey = process.env.TOSS_SECRET_KEY || "";
const tossClientKey = process.env.TOSS_CLIENT_KEY || "test_ck_Z1aOwX7K8my5wez79D1B8yQxzvNP";
const productAmount = Number(process.env.PRODUCT_AMOUNT || 990);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeStaticPath(urlPath) {
  let pathname = decodeURIComponent(urlPath || "/");
  if (pathname === "/") pathname = "/index.html";
  if (pathname.startsWith("/sub/")) pathname = pathname.slice(4);
  const cleaned = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  return cleaned.startsWith("/") ? cleaned.slice(1) : cleaned;
}

async function serveStatic(req, res, pathname) {
  const relativePath = normalizeStaticPath(pathname);
  const filePath = path.join(webRoot, relativePath);
  if (!filePath.startsWith(webRoot)) {
    sendJson(res, 403, { message: "Forbidden" });
    return;
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendJson(res, 404, { message: "Not Found" });
      return;
    }
    sendJson(res, 500, { message: "Failed to read static file" });
  }
}

async function handleConfirm(req, res) {
  if (!tossSecretKey) {
    sendJson(res, 500, {
      message: "TOSS_SECRET_KEY가 설정되지 않았습니다. 서버 환경변수를 확인해 주세요."
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { message: "요청 JSON 형식이 올바르지 않습니다." });
    return;
  }

  const paymentKey = body?.paymentKey;
  const orderId = body?.orderId;
  const amount = Number(body?.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    sendJson(res, 400, { message: "paymentKey, orderId, amount가 필요합니다." });
    return;
  }

  if (amount !== productAmount) {
    sendJson(res, 400, { message: `결제 금액이 다릅니다. expected=${productAmount}, actual=${amount}` });
    return;
  }

  try {
    const token = Buffer.from(`${tossSecretKey}:`).toString("base64");
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      sendJson(res, response.status, {
        message: data?.message || "토스 결제 승인에 실패했습니다.",
        code: data?.code || "TOSS_CONFIRM_FAILED"
      });
      return;
    }

    sendJson(res, 200, {
      orderId: data.orderId,
      orderName: data.orderName,
      totalAmount: data.totalAmount,
      method: data.method,
      approvedAt: data.approvedAt,
      receiptUrl: data?.receipt?.url || ""
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "결제 승인 요청 중 서버 오류가 발생했습니다."
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/payment/config") {
    sendJson(res, 200, { clientKey: tossClientKey, amount: productAmount });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/payment/confirm") {
    await handleConfirm(req, res);
    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res, url.pathname);
    return;
  }

  sendJson(res, 405, { message: "Method Not Allowed" });
});

server.listen(port, () => {
  process.stdout.write(
    `Payment server running: http://localhost:${port}\n` +
    `clientKey: ${tossClientKey ? "set" : "missing"} / secretKey: ${tossSecretKey ? "set" : "missing"}\n`
  );
});
