import ErrorBoundary from 'components/ErrorBoundary'
import { useFeatureFlagUrlOverrides } from 'featureFlags/useFeatureFlagUrlOverrides'
import { Body } from 'pages/App/Body'
import { AppLayout } from 'pages/App/Layout'
import { ResetPageScrollEffect } from 'pages/App/utils/ResetPageScroll'
import { UserPropertyUpdater } from 'pages/App/utils/UserPropertyUpdater'
import { findRouteByPath } from 'pages/RouteDefinitions'
import { useDynamicMetatags } from 'pages/metatags'
import { useEffect, useLayoutEffect } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { Navigate, useLocation } from 'react-router'
import DarkModeQueryParamReader from 'theme/components/DarkModeQueryParamReader'
import { useSporeColors } from 'ui/src'
import { initializeScrollWatcher } from 'uniswap/src/components/modals/ScrollLock'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isPathBlocked } from 'utils/blockedPaths'
import { MICROSITE_LINK } from 'utils/openDownloadApp'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

const OVERRIDE_PAGE_LAYOUT: string[] = []

export default function App() {
  const colors = useSporeColors()

  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(pathname)

  useFeatureFlagUrlOverrides()

  useEffect(() => {
    initializeScrollWatcher()
  }, [])

  const metaTags = useDynamicMetatags()
  const staticTitle = findRouteByPath(pathname)?.getTitle(pathname) ?? 'JuiceSwap Interface'
  const staticDescription = findRouteByPath(pathname)?.getDescription(pathname)

  // redirect address to landing pages until implemented
  const shouldRedirectToAppInstall = pathname.startsWith('/address/')
  useLayoutEffect(() => {
    if (shouldRedirectToAppInstall) {
      window.location.href = MICROSITE_LINK
    }
  }, [shouldRedirectToAppInstall])

  if (shouldRedirectToAppInstall) {
    return null
  }

  const shouldBlockPath = isPathBlocked(pathname)
  if (shouldBlockPath && pathname !== '/swap') {
    return <Navigate to="/swap" replace />
  }

  const shouldOverridePageLayout = OVERRIDE_PAGE_LAYOUT.includes(pathname)

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <Trace page={currentPage}>
        {/*
          This is where *static* page titles are injected into the <head> tag. If you
          want to set a page title based on data that's dynamic or not available on first render,
          you can set it later in the page component itself, since react-helmet-async prefers the most recently rendered title.
        */}
        <Helmet>
          <title>{staticTitle}</title>
          {staticDescription && <meta name="description" content={staticDescription} />}
          {staticDescription && <meta property="og:description" content={staticDescription} />}
          {metaTags.map((tag, index) => (
            <meta key={index} {...tag} />
          ))}
          <style>{`
            html {
              ::-webkit-scrollbar-thumb {
                background-color: ${colors.surface3.val};
              }
              scrollbar-color: ${colors.surface3.val} ${colors.surface1.val};
            }
          `}</style>
        </Helmet>
        <UserPropertyUpdater />
        <ResetPageScrollEffect />
        {shouldOverridePageLayout ? <Body shouldRenderAppChrome={false} /> : <AppLayout />}
      </Trace>
    </ErrorBoundary>
  )
}
