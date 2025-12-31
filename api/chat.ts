// 👇 نجبر Vercel يستخدم Node.js عشان process.env يشتغل
export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request): Promise<Response> {
  // السماح بـ POST بس
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  // 🔐 تحقق إن الـ API Key موجود
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "API Configuration Error: Key Missing",
      }),
      { status: 500 }
    );
  }

  try {
    // قراءة الـ body
    const body = await req.json();

    // طلب الـ AI
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: body.model || "gpt-4.1-mini",
          messages: body.messages,
          temperature: body.temperature ?? 0.7,
        }),
      }
    );

    const data = await aiResponse.json();

    // رجوع الرد للـ Frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "AI request failed",
        details: String(error),
      }),
      { status: 500 }
    );
  }
}
