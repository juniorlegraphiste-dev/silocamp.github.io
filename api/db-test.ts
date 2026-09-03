export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    message: "db-test fonctionne sans Prisma",
    method: req.method,
  });
}