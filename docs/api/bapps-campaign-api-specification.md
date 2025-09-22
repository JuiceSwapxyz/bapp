# bApps Campaign API Specification

## Overview

This document specifies the complete API requirements for the Citrea bApps Campaign tracking system. The API should be hosted at `https://ponder.juiceswap.com` and will track user progress through swap tasks on the Citrea Testnet.

## Base Configuration

- **Base URL**: `https://ponder.juiceswap.com`
- **Content-Type**: `application/json`
- **Chain ID**: `5115` (Citrea Testnet)
- **CORS**: Must allow origin `http://localhost:3001` and `https://bapp.juiceswap.xyz`

## Campaign Tasks

The campaign consists of 3 specific swap tasks that users must complete:

| Task ID | Task Name | Description | Input Token | Output Token | Contract Addresses |
|---------|-----------|-------------|-------------|--------------|-------------------|
| 1 | NUSD Swap | Swap cBTC to NUSD | Native cBTC | NUSD | Output: `0x9B28B690550522608890C3C7e63c0b4A7eBab9AA` |
| 2 | cUSD Swap | Swap cBTC to cUSD | Native cBTC | cUSD | Output: `0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0` |
| 3 | USDC Swap | Swap cBTC to USDC | Native cBTC | USDC | Output: `0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F` |

## API Endpoints

### 1. Get Campaign Progress

Fetch the current campaign progress for a wallet address.

**Endpoint**: `POST /campaign/progress`

**Request Body**:
```json
{
  "walletAddress": "0x...", // Ethereum wallet address (required)
  "chainId": 5115           // Chain ID (required, must be 5115 for Citrea Testnet)
}
```

**Response (200 OK)**:
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "chainId": 5115,
  "tasks": [
    {
      "id": 1,
      "name": "Swap cBTC to NUSD",
      "description": "Complete a swap from cBTC to NUSD",
      "completed": false,
      "completedAt": null,
      "txHash": null
    },
    {
      "id": 2,
      "name": "Swap cBTC to cUSD",
      "description": "Complete a swap from cBTC to cUSD",
      "completed": true,
      "completedAt": "2024-09-22T14:30:00Z",
      "txHash": "0xabc..."
    },
    {
      "id": 3,
      "name": "Swap cBTC to USDC",
      "description": "Complete a swap from cBTC to USDC",
      "completed": false,
      "completedAt": null,
      "txHash": null
    }
  ],
  "totalTasks": 3,
  "completedTasks": 1,
  "progress": 33.33,
  "nftClaimed": false,
  "claimTxHash": null
}
```

**Error Responses**:
- `400 Bad Request`: Invalid wallet address or chainId
- `500 Internal Server Error`: Server error

### 2. Submit Task Completion

Record that a user has completed a specific task.

**Endpoint**: `POST /campaign/complete-task`

**Request Body**:
```json
{
  "walletAddress": "0x...",              // Ethereum wallet address (required)
  "taskId": 1,                           // Task ID (1, 2, or 3) (required)
  "txHash": "0x...",                     // Transaction hash of the swap (required)
  "chainId": 5115,                       // Chain ID (required)
  "timestamp": "2024-09-22T14:30:00Z"    // ISO 8601 timestamp (required)
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task completed successfully",
  "taskId": 1,
  "walletAddress": "0x...",
  "updatedProgress": {
    "completedTasks": 2,
    "totalTasks": 3,
    "progress": 66.67
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid parameters, task already completed, or invalid task ID
- `404 Not Found`: Transaction not found or doesn't match task requirements
- `500 Internal Server Error`: Server error

### 3. Check Swap Task Completion

Verify if a transaction hash corresponds to a campaign task and which one.

**Endpoint**: `POST /campaign/check-swap`

**Request Body**:
```json
{
  "txHash": "0x...",         // Transaction hash to check (required)
  "walletAddress": "0x...",  // Wallet address that made the swap (required)
  "chainId": 5115            // Chain ID (required)
}
```

**Response (200 OK)**:
```json
{
  "taskId": 1,                    // Task ID if swap matches a task, null otherwise
  "taskName": "Swap cBTC to NUSD",
  "isValid": true,
  "details": {
    "inputToken": "NATIVE",       // cBTC (native token)
    "outputToken": "NUSD",
    "outputAddress": "0x9B28B690550522608890C3C7e63c0b4A7eBab9AA",
    "amount": "0.001",
    "timestamp": "2024-09-22T14:30:00Z"
  }
}
```

**Response when no task matches**:
```json
{
  "taskId": null,
  "isValid": false,
  "reason": "Swap does not match any campaign tasks"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid transaction hash or parameters
- `404 Not Found`: Transaction not found on chain
- `500 Internal Server Error`: Server error

## Transaction Validation Logic

To determine if a swap transaction completes a task, the API should:

1. **Fetch the transaction** from Citrea Testnet blockchain
2. **Decode the transaction data** to identify:
   - Input token (should be native cBTC/ETH)
   - Output token address
   - Sender address (must match walletAddress)
   - Transaction status (must be successful)

3. **Match against tasks**:
   - Task 1: Output token = `0x9B28B690550522608890C3C7e63c0b4A7eBab9AA` (NUSD)
   - Task 2: Output token = `0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0` (cUSD)
   - Task 3: Output token = `0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F` (USDC)

4. **Validate swap direction**:
   - Input must be native token (cBTC on Citrea)
   - Output must match one of the task token addresses
   - Transaction must be a swap (not a transfer or other operation)

## Data Storage Requirements

The API should persist:

1. **User Progress**:
   - Wallet address
   - Completed tasks (array of task IDs)
   - Completion timestamps
   - Transaction hashes for each completed task

2. **Campaign Stats** (optional):
   - Total participants
   - Total completed tasks
   - Most/least completed tasks
   - Campaign completion rate

## Implementation Notes

### Blockchain Integration

You'll need to connect to Citrea Testnet to verify transactions:

- **RPC Endpoint**: `https://rpc.testnet.citrea.xyz`
- **Chain ID**: 5115
- **Explorer API**: `https://explorer.testnet.citrea.xyz/api`

### Swap Detection

**JuiceSwap Router Addresses on Citrea Testnet**:
- **SwapRouter02**: `0x610c98EAD0df13EA906854b6041122e8A8D14413` (Primary V3 Router - used in most swaps)
- **SwapRouter**: `0xb2A4E33e9A9aC7c46045A2D0318a4F50194dafDE` (Alternative V3 Router)
- **SwapRouter (Alt)**: `0x3012E9049d05B4B5369D690114D5A5861EbB85cb` (Alternative V3 Router)
- **UniswapV2Router02**: `0xb45670f668EE53E62b5F170B5B1d3C6701C8d03A` (V2 Router for legacy swaps)

**Important**: Most JuiceSwap transactions on Citrea Testnet will use the SwapRouter02 (`0x610c98EAD0df13EA906854b6041122e8A8D14413`).

**Detection Steps**:
- Check if `to` address matches one of the router addresses above
- Look for `Swap` events in transaction logs
- Verify token addresses match campaign requirements

### Database Schema (Suggested)

```sql
-- User progress table
CREATE TABLE campaign_progress (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, chain_id)
);

-- Task completions table
CREATE TABLE task_completions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  task_id INTEGER NOT NULL,
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  completed_at TIMESTAMP NOT NULL,
  chain_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, task_id, chain_id)
);

-- Optional: Transaction cache
CREATE TABLE transaction_cache (
  tx_hash VARCHAR(66) PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  from_address VARCHAR(42),
  to_address VARCHAR(42),
  input_token VARCHAR(42),
  output_token VARCHAR(42),
  block_number BIGINT,
  timestamp TIMESTAMP,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Rate Limiting

Recommended rate limits:
- 10 requests per second per IP
- 100 requests per minute per wallet address

### Caching

Recommended caching strategy:
- Cache transaction lookups for 5 minutes
- Cache user progress for 30 seconds
- Use Redis or similar for caching layer

## Testing

### Test Wallet Addresses
```
0xc89E49490020fc4e8eE681553A2354234Fc3F1D4
0x1234567890123456789012345678901234567890
```

### Test Transaction Hashes (Examples)
You'll need to generate these from actual swaps on Citrea Testnet.

### Test Scenarios

1. **New User**: No completed tasks
2. **Partial Progress**: 1-2 tasks completed
3. **Completed Campaign**: All 3 tasks done
4. **Invalid Transaction**: Non-swap transaction
5. **Wrong Token Pair**: Swap not matching campaign requirements
6. **Duplicate Submission**: Same task submitted twice

## Security Considerations

1. **Input Validation**:
   - Validate all Ethereum addresses (checksum)
   - Verify chainId is 5115
   - Sanitize all inputs

2. **Transaction Verification**:
   - Always verify on-chain, don't trust client data
   - Check transaction is confirmed (minimum 3 blocks)
   - Verify sender matches claimed wallet address

3. **Rate Limiting**:
   - Implement per-IP and per-wallet rate limits
   - Add exponential backoff for repeated failures

4. **CORS Configuration**:
   - Only allow specific origins
   - Include credentials if needed

## Environment Variables

Recommended environment variables for your API:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/bapps_campaign

# Blockchain
CITREA_RPC_URL=https://rpc.testnet.citrea.xyz
CITREA_CHAIN_ID=5115

# Redis Cache (optional)
REDIS_URL=redis://localhost:6379

# API Configuration
PORT=3000
CORS_ORIGINS=http://localhost:3001,https://bapp.juiceswap.xyz

# Rate Limiting
RATE_LIMIT_PER_SECOND=10
RATE_LIMIT_PER_MINUTE=100
```

## Example Implementation (Node.js/Express)

```javascript
// Example endpoint implementation
app.post('/campaign/progress', async (req, res) => {
  try {
    const { walletAddress, chainId } = req.body;

    // Validate inputs
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (chainId !== 5115) {
      return res.status(400).json({ error: 'Invalid chain ID' });
    }

    // Fetch progress from database
    const progress = await getCampaignProgress(walletAddress);

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Monitoring & Analytics

Track these metrics:
- API response times
- Error rates by endpoint
- Task completion rates
- Active users (daily/weekly)
- Most common failure points

## Contact & Support

For questions about this specification:
- Frontend Integration: JuiceSwap Team
- Campaign Details: Citrea bApps Team
- Technical Issues: Create issue in repository