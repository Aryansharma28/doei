// Shared helper — get a short-lived GoCardless access token
export async function getGCToken(): Promise<string> {
  const res = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
  });
  if (!res.ok) throw new Error(`GoCardless token error: ${res.status}`);
  const data = await res.json();
  return data.access as string;
}
