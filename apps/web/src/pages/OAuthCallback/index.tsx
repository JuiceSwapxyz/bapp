import { useEffect } from 'react'
import { useNavigate } from 'react-router'

/**
 * OAuth Callback Page
 *
 * Immediately redirects to campaign page after Twitter OAuth completes
 *
 * Query params expected:
 * - twitter=success&username=X  (success case - redirect to /first-squeezer)
 * - twitter=error&message=...   (error case - redirect to /first-squeezer?oauth_error=...)
 */
export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const twitterParam = params.get('twitter')
    const message = params.get('message')

    // Handle error case - pass error to campaign page
    if (twitterParam === 'error') {
      const errorMessage = message || 'Twitter verification failed'
      navigate(`/first-squeezer?oauth_error=${encodeURIComponent(errorMessage)}`)
      return
    }

    // Handle success case or no params - redirect to campaign page
    navigate('/first-squeezer')
  }, [navigate])

  return null
}
