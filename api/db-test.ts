export default async function handler() {
  return Response.json({
    ok: true,
    message: "db-test fonctionne",
    runtime: "vercel",
  });
}