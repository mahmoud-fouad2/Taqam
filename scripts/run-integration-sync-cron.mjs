const baseUrl = process.env.INTEGRATION_SYNC_CRON_TARGET_URL || process.env.NEXT_PUBLIC_APP_URL;
const secret = process.env.INTEGRATION_SYNC_CRON_SECRET;

if (!baseUrl) {
  throw new Error("INTEGRATION_SYNC_CRON_TARGET_URL or NEXT_PUBLIC_APP_URL is required");
}

if (!secret) {
  throw new Error("INTEGRATION_SYNC_CRON_SECRET is required");
}

const targetUrl = `${baseUrl.replace(/\/+$/, "")}/api/internal/integrations/sync-jobs`;

const response = await fetch(targetUrl, {
  method: "POST",
  headers: {
    authorization: `Bearer ${secret}`,
    "content-type": "application/json"
  }
});

const bodyText = await response.text();
process.stdout.write(`${bodyText}\n`);

if (!response.ok) {
  process.exit(1);
}
