import { NextResponse } from 'next/server';

import { scrapeWebsiteForOnboarding } from '@/lib/firecrawl';

function createRequestId() {
  return `scrape_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const payload = (await request.json().catch(() => null)) as
      | { url?: unknown }
      | null;
    const inputUrl = typeof payload?.url === 'string' ? payload.url : '';

    console.log('[API][scrape][start]', {
      requestId,
      inputUrl,
    });

    const result = await scrapeWebsiteForOnboarding({
      url: inputUrl,
      requestId,
    });

    console.log('[API][scrape][success]', {
      requestId,
      domain: result.domain,
      markdownLength: result.markdown.length,
      colorCount: result.brandIdentity.colors.length,
    });

    return NextResponse.json({
      success: true,
      requestId,
      ...result,
    });
  } catch (error) {
    console.error('[API][scrape][failed]', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown scrape error',
    });

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: error instanceof Error ? error.message : 'Unable to scrape this website.',
      },
      { status: 400 },
    );
  }
}