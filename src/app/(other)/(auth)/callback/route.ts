import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'
import { ONBOARDING_FLOW_KEY } from '@/features/onboarding/lib/onboarding'
import { connectUnlabelledXAccountForCurrentUser } from '@/features/x/lib/x-auth'
import { X_OAUTH_SCOPE_STRING } from '@/features/x/lib/x-oauth'

function getSafeNextPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith('/')) {
    return '/app'
  }

  return rawNext
}

function getProxyAwareRedirectUrl(request: NextRequest, nextPath: string) {
  const redirectUrl = new URL(nextPath, request.url)

  if (process.env.NODE_ENV !== 'development') {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')

    if (forwardedHost) {
      redirectUrl.host = forwardedHost
      redirectUrl.protocol = `${forwardedProto ?? 'https'}:`
    }
  }

  return redirectUrl
}

function redirectWithError(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(`/error?error=${encodeURIComponent(message)}`, request.url),
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const nextPath = getSafeNextPath(searchParams.get('next'))

  if (!code) {
    return redirectWithError(request, 'Missing authorization code.')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirectWithError(request, error.message)
  }
  const session = data.session ?? (await supabase.auth.getSession()).data.session
  const provider = session?.user?.app_metadata?.provider
  const providerList = session?.user?.app_metadata?.providers as string[] | undefined
  const providerToken = session?.provider_token
  const providerRefreshToken = session?.provider_refresh_token
  const isXProvider =
    provider === 'x' ||
    provider === 'twitter' ||
    providerList?.includes('x') ||
    providerList?.includes('twitter')

  if (isXProvider && providerToken) {
    try {
      await connectUnlabelledXAccountForCurrentUser({
        access_token: providerToken,
        refresh_token: providerRefreshToken ?? undefined,
        scope: X_OAUTH_SCOPE_STRING,
        token_type: 'bearer',
      })
    } catch {
      // App sign-in should still succeed even if the optional publishing connection cannot be saved.
    }
  }

  let resolvedNextPath = nextPath
  const userId = session?.user?.id

  // Ensure social-auth users complete onboarding before entering the app.
  if (userId && nextPath.startsWith('/app')) {
    const { count: onboardingAnswerCount, error: onboardingAnswersError } = await supabase
      .from('onboarding_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('flow_key', ONBOARDING_FLOW_KEY)

    if (!onboardingAnswersError && (onboardingAnswerCount ?? 0) === 0) {
      resolvedNextPath = '/onboarding'
    }
  }

  return NextResponse.redirect(getProxyAwareRedirectUrl(request, resolvedNextPath))
}
