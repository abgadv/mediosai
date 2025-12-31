export const config = { runtime: "nodejs" };

const AI_TIMEOUT = 12000;

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "API key missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const body = await req.json();

    const aiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: body.messages,
          temperature: 0.7,
        }),
      }
    );

    const text = await aiRes.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Invalid AI response");
    }

    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg =
      err.name === "AbortError"
        ? "AI timeout"
        : err.message || "AI error";

    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    clearTimeout(timeout);
  }
}
