const fallbackAmount = 990;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(payload)
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { message: "Method Not Allowed" });
  }

  const tossSecretKey = process.env.TOSS_SECRET_KEY || "";
  const productAmount = Number(process.env.PRODUCT_AMOUNT || fallbackAmount);

  if (!tossSecretKey) {
    return json(500, {
      message: "TOSS_SECRET_KEY가 설정되지 않았습니다. Netlify 환경변수를 확인해 주세요."
    });
  }

  let parsed;
  try {
    parsed = event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    return json(400, { message: "요청 JSON 형식이 올바르지 않습니다." });
  }

  const paymentKey = parsed?.paymentKey;
  const orderId = parsed?.orderId;
  const amount = Number(parsed?.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return json(400, { message: "paymentKey, orderId, amount가 필요합니다." });
  }

  if (amount !== productAmount) {
    return json(400, {
      message: `결제 금액이 다릅니다. expected=${productAmount}, actual=${amount}`
    });
  }

  try {
    const token = Buffer.from(`${tossSecretKey}:`).toString("base64");
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(response.status, {
        message: data?.message || "토스 결제 승인에 실패했습니다.",
        code: data?.code || "TOSS_CONFIRM_FAILED"
      });
    }

    return json(200, {
      orderId: data.orderId,
      orderName: data.orderName,
      totalAmount: data.totalAmount,
      method: data.method,
      approvedAt: data.approvedAt,
      receiptUrl: data?.receipt?.url || ""
    });
  } catch (error) {
    return json(500, { message: "결제 승인 요청 중 서버 오류가 발생했습니다." });
  }
}
