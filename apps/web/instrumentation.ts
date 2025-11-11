/**
 * Next.js Instrumentation
 * Runs on server startup to verify connectivity to required services
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await checkStartupHealth();
  }
}

async function checkStartupHealth() {
  // eslint-disable-next-line no-console
  console.log('🔍 [Web] Checking startup health...');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Check API connectivity
  try {
    // eslint-disable-next-line no-console
    console.log(`🔗 [Web] Checking API connection: ${apiUrl}/api/health`);

    // eslint-disable-next-line no-undef
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${apiUrl}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // eslint-disable-next-line no-console
      console.log(`✅ [Web] API connection successful: ${data.status || 'ok'}`);
    } else {
      console.warn(
        `⚠️  [Web] API returned status ${response.status}, but server will continue`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(
        '⚠️  [Web] API health check timeout (5s) - API may not be ready yet',
      );
    } else {
      console.warn(
        `⚠️  [Web] Could not connect to API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
    console.warn(
      '⚠️  [Web] Server will start anyway, but API requests may fail',
    );
  }

  // eslint-disable-next-line no-console
  console.log('✅ [Web] Startup health check completed\n');
}
