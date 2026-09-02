export default function handler(
  _req: Request,
  res: any,
) {
  res.status(200).json({
    ok: true,
    message: "SiloCamp Vercel API fonctionne",
  });
}