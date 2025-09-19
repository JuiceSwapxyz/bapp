#!/bin/bash

# Setup Branch Protection Rules for JuiceSwap Repository
# Usage: ./scripts/setup-branch-protection.sh [GITHUB_TOKEN]

set -e

REPO="JuiceSwapxyz/bapp"
TOKEN=${1:-$GITHUB_TOKEN}

if [ -z "$TOKEN" ]; then
    echo "Error: GitHub token is required"
    echo "Usage: $0 [GITHUB_TOKEN]"
    echo "Or set GITHUB_TOKEN environment variable"
    exit 1
fi

echo "Setting up branch protection for $REPO..."

# Function to apply branch protection
apply_protection() {
    local BRANCH=$1
    local REVIEWS_REQUIRED=$2
    local ENFORCE_ADMINS=$3

    echo "Configuring protection for branch: $BRANCH"

    curl -X PUT \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/$REPO/branches/$BRANCH/protection" \
        -d @- <<EOF
{
    "required_status_checks": {
        "strict": true,
        "contexts": [
            "Quick Checks",
            "TypeScript Check",
            "Lint",
            "Format Check",
            "Test Packages",
            "Test Web",
            "Test Mobile",
            "Test Extension",
            "Build",
            "Circular Dependencies Check",
            "All Checks Passed"
        ]
    },
    "enforce_admins": $ENFORCE_ADMINS,
    "required_pull_request_reviews": {
        "dismissal_restrictions": {},
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": false,
        "required_approving_review_count": $REVIEWS_REQUIRED,
        "require_last_push_approval": false
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true,
    "lock_branch": false,
    "allow_fork_syncing": false
}
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Branch protection applied successfully for $BRANCH"
    else
        echo "❌ Failed to apply protection for $BRANCH"
    fi
    echo ""
}

# Apply protection to develop branch (1 review required)
apply_protection "develop" 1 false

# Apply protection to main branch (2 reviews required, enforce for admins)
apply_protection "main" 2 true

echo "Branch protection setup complete!"
echo ""
echo "To enable auto-merge for develop branch, run:"
echo "gh repo edit $REPO --enable-auto-merge"