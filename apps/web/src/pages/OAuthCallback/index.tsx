import { useEffect } from 'react'
import { useNavigate } from 'react-router'

/**
 * OAuth Callback Page
 *
 * Immediately redirects to campaign page after OAuth completes (Twitter or Discord)
 *
 * Query params expected:
 * - twitter=success&username=X  (success case - redirect to /first-squeezer)
 * - twitter=error&message=...   (error case - redirect to /first-squeezer?oauth_error=...&oauth_service=twitter)
 * - discord=success&username=X  (success case - redirect to /first-squeezer)
 * - discord=error&message=...   (error case - redirect to /first-squeezer?oauth_error=...&oauth_service=discord)
 */
export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const twitterParam = params.get('twitter')
    const discordParam = params.get('discord')
    const message = params.get('message')

    // Handle Twitter error case
    if (twitterParam === 'error') {
      const errorMessage = message || 'Twitter verification failed'
      navigate(`/first-squeezer?oauth_error=${encodeURIComponent(errorMessage)}&oauth_service=twitter`)
      return
    }

    // Handle Discord error case
    if (discordParam === 'error') {
      const errorMessage = message || 'Discord verification failed'
      navigate(`/first-squeezer?oauth_error=${encodeURIComponent(errorMessage)}&oauth_service=discord`)
      return
    }

    // Handle success case or no params - redirect to campaign page
    navigate('/first-squeezer')
  }, [navigate])

  return null
}
