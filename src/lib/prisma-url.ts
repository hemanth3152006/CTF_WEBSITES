export function getPrismaDatabaseUrl(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  const url = new URL(databaseUrl);
  if (url.port === "6543" || url.hostname.includes("pooler")) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}