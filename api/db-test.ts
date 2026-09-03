export default function handler() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "db-test",
      message: "Serverless function OK",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}