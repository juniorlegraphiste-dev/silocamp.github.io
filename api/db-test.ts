export default function handler(_req: any, res: any) {
  return res.status(200).json({
    ok: true,
    step: "plain-handler",
    message: "La fonction Vercel s'exécute",
  });
}