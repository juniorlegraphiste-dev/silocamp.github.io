export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    service: "SiloCamp API",
    message: "Vercel Function OK",
  });
}