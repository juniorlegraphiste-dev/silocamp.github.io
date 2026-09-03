export default function handler() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "health",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}