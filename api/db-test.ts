export default function handler(_req: any, res: any) {
  const databaseUrl = process.env.DATABASE_URL;

  return res.status(200).json({
    ok: true,
    databaseUrlExists: Boolean(databaseUrl),
    databaseUrlLength: databaseUrl?.length ?? 0,
  });
}