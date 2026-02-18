const fallbackClientKey = "test_ck_Z1aOwX7K8my5wez79D1B8yQxzvNP";
const fallbackAmount = 990;

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  const clientKey = process.env.TOSS_CLIENT_KEY || fallbackClientKey;
  const amount = Number(process.env.PRODUCT_AMOUNT || fallbackAmount);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify({ clientKey, amount })
  };
}
