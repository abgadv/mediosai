export const config = { runtime: "nodejs" };

export default async function handler(req: Request) {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "API reached successfully"
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}
