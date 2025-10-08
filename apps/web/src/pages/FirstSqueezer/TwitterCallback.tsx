import { useAccount } from 'hooks/useAccount'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { firstSqueezerCampaignAPI } from 'services/firstSqueezerCampaign/api'
import { Flex, SpinningLoader, Text, styled } from 'ui/src'

const Container = styled(Flex, {
  width: '100%',
  minHeight: '400px',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  gap: '$gap16',
  padding: '$padding24',
})

const Message = styled(Text, {
  textAlign: 'center',
  maxWidth: '500px',
})

export default function TwitterCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const account = useAccount()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code || !state) {
        setStatus('error')
        setErrorMessage('Missing OAuth parameters')
        setTimeout(() => navigate('/first-squeezer'), 3000)
        return
      }

      // Get wallet address from account or localStorage (in case wallet disconnected during redirect)
      const storedAddress = localStorage.getItem('twitter_oauth_address')
      const walletAddress = account.address || storedAddress

      if (!walletAddress) {
        setStatus('error')
        setErrorMessage('Please connect your wallet')
        setTimeout(() => navigate('/first-squeezer'), 3000)
        return
      }

      try {
        const result = await firstSqueezerCampaignAPI.completeTwitterOAuth(code, state, walletAddress)

        if (result.success && result.verified) {
          setStatus('success')
          // Dispatch event to trigger progress refresh
          window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
          setTimeout(() => navigate('/first-squeezer'), 5000)
        } else {
          setStatus('error')
          setErrorMessage(result.error || 'You must follow @JuiceSwap_com to complete this task')
          setTimeout(() => navigate('/first-squeezer'), 4000)
        }
      } catch (error) {
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Verification failed')
        setTimeout(() => navigate('/first-squeezer'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, account.address])

  return (
    <Container>
      {status === 'processing' && (
        <>
          <SpinningLoader size={48} />
          <Message variant="heading3">Verifying your Twitter account...</Message>
          <Message variant="body2" color="$neutral2">
            Please wait while we check if you follow @JuiceSwap_com
          </Message>
        </>
      )}

      {status === 'success' && (
        <>
          <Text fontSize={64}>✅</Text>
          <Message variant="heading3" color="$statusSuccess">
            Twitter verification successful!
          </Message>
          <Message variant="body2" color="$neutral2">
            Redirecting you back to the campaign page...
          </Message>
        </>
      )}

      {status === 'error' && (
        <>
          <Text fontSize={64}>❌</Text>
          <Message variant="heading3" color="$statusCritical">
            Verification failed
          </Message>
          <Message variant="body2" color="$neutral2">
            {errorMessage}
          </Message>
          <Message variant="body3" color="$neutral3">
            Redirecting you back to the campaign page...
          </Message>
        </>
      )}
    </Container>
  )
}
