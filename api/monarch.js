/**
 * Monarch Money API Proxy for TRMNL
 * 
 * This serverless function authenticates with Monarch Money and fetches
 * recent transactions from all accounts.
 * 
 * Environment Variables Required (choose one method):
 * 
 * Method 1 - Token Auth (for Google OAuth users):
 * - MONARCH_TOKEN: Your Monarch session token (from browser)
 * 
 * Method 2 - Password Auth:
 * - MONARCH_EMAIL: Your Monarch Money email
 * - MONARCH_PASSWORD: Your Monarch Money password
 * - MONARCH_MFA_SECRET: (Optional) TOTP secret for MFA
 */

const MONARCH_BASE = 'https://api.monarchmoney.com';

// Category icons mapping (emoji fallbacks)
const CATEGORY_ICONS = {
  // Income
  'income': '💰',
  'paycheck': '💵',
  'bonus': '🎁',
  'interest': '🏦',
  'investment': '📈',
  'refund': '↩️',
  
  // Food & Drink
  'food & drink': '🍽️',
  'groceries': '🛒',
  'restaurants': '🍴',
  'coffee': '☕',
  'fast food': '🍔',
  'alcohol & bars': '🍺',
  
  // Shopping
  'shopping': '🛍️',
  'clothing': '👕',
  'electronics': '📱',
  'home': '🏠',
  'gifts': '🎁',
  
  // Transportation
  'transportation': '🚗',
  'gas': '⛽',
  'parking': '🅿️',
  'public transit': '🚇',
  'rideshare': '🚕',
  'auto': '🚙',
  
  // Bills & Utilities
  'bills & utilities': '📄',
  'utilities': '💡',
  'phone': '📱',
  'internet': '🌐',
  'insurance': '🛡️',
  'rent': '🏠',
  'mortgage': '🏡',
  
  // Entertainment
  'entertainment': '🎬',
  'streaming': '📺',
  'games': '🎮',
  'music': '🎵',
  'movies': '🎬',
  'sports': '⚽',
  
  // Health
  'health': '❤️',
  'medical': '🏥',
  'pharmacy': '💊',
  'fitness': '💪',
  'gym': '🏋️',
  
  // Travel
  'travel': '✈️',
  'hotels': '🏨',
  'flights': '✈️',
  'vacation': '🏖️',
  
  // Personal
  'personal': '👤',
  'education': '📚',
  'pets': '🐾',
  'subscriptions': '📋',
  
  // Financial
  'transfer': '↔️',
  'fees': '💳',
  'taxes': '📊',
  'savings': '🐷',
  
  // Default
  'default': '💳',
  'uncategorized': '❓',
};

/**
 * Get icon for a category
 */
function getCategoryIcon(categoryName) {
  if (!categoryName) return CATEGORY_ICONS['default'];
  
  const name = categoryName.toLowerCase();
  
  // Direct match
  if (CATEGORY_ICONS[name]) {
    return CATEGORY_ICONS[name];
  }
  
  // Partial match
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }
  
  return CATEGORY_ICONS['default'];
}

/**
 * Login to Monarch Money and get auth token
 */
async function login(email, password, mfaSecret = null) {
  const loginData = {
    username: email,
    password: password,
    supports_mfa: true,
    trusted_device: false,
  };

  // If MFA secret is provided, generate TOTP code
  if (mfaSecret) {
    // Simple TOTP implementation would go here
    // For now, we'll handle MFA error and inform user
  }

  const response = await fetch(`${MONARCH_BASE}/auth/login/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Client-Platform': 'web',
    },
    body: JSON.stringify(loginData),
  });

  if (response.status === 403) {
    throw new Error('MFA_REQUIRED: Multi-factor authentication is required. Please add MONARCH_MFA_SECRET to your environment variables.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.token) {
    throw new Error('No auth token received from Monarch');
  }

  return data.token;
}

/**
 * Fetch transactions from Monarch Money using GraphQL
 */
async function fetchTransactions(token, limit = 10, startDate = null, endDate = null) {
  const query = `
    query GetTransactionsList($offset: Int, $limit: Int, $filters: TransactionFilterInput, $orderBy: TransactionOrdering) {
      allTransactions(filters: $filters) {
        totalCount
        results(offset: $offset, limit: $limit, orderBy: $orderBy) {
          id
          amount
          pending
          date
          hideFromReports
          plaidName
          notes
          isRecurring
          reviewStatus
          needsReview
          isSplitTransaction
          createdAt
          updatedAt
          category {
            id
            name
            __typename
          }
          merchant {
            name
            id
            __typename
          }
          account {
            id
            displayName
            __typename
          }
          tags {
            id
            name
            color
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `;

  const variables = {
    offset: 0,
    limit: limit,
    orderBy: 'date',
    filters: {
      search: '',
      categories: [],
      accounts: [],
      tags: [],
    },
  };

  // Add date filters if provided
  if (startDate && endDate) {
    variables.filters.startDate = startDate;
    variables.filters.endDate = endDate;
  }

  const response = await fetch(`${MONARCH_BASE}/graphql`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
      'Client-Platform': 'web',
    },
    body: JSON.stringify({
      operationName: 'GetTransactionsList',
      query: query,
      variables: variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Format amount for display
 */
function formatAmount(amount) {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  
  // Positive amounts are income (remove negative sign display)
  // Negative amounts are expenses
  return amount >= 0 ? `+${formatted}` : formatted;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Check for token-based auth first (for Google OAuth users)
  const directToken = process.env.MONARCH_TOKEN;
  const email = process.env.MONARCH_EMAIL;
  const password = process.env.MONARCH_PASSWORD;
  const mfaSecret = process.env.MONARCH_MFA_SECRET;
  
  if (!directToken && (!email || !password)) {
    return res.status(500).json({
      status: 'error',
      message: 'Monarch credentials not configured. Set MONARCH_TOKEN (for Google OAuth) or MONARCH_EMAIL and MONARCH_PASSWORD environment variables.',
    });
  }

  try {
    // Get transaction limit from query params (default 10)
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    // Get date range from query params (optional)
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;
    
    // Use direct token if available, otherwise login with credentials
    let token;
    if (directToken) {
      token = directToken;
    } else {
      token = await login(email, password, mfaSecret);
    }
    
    // Fetch transactions
    const transactionData = await fetchTransactions(token, limit, startDate, endDate);
    const transactions = transactionData.allTransactions?.results || [];
    const totalCount = transactionData.allTransactions?.totalCount || 0;
    
    // Transform transactions for TRMNL
    const items = transactions.map(tx => {
      const categoryName = tx.category?.name || 'Uncategorized';
      const isIncome = tx.amount > 0;
      
      return {
        id: tx.id,
        amount: tx.amount,
        amount_formatted: formatAmount(tx.amount),
        is_income: isIncome,
        is_expense: !isIncome,
        pending: tx.pending,
        date: tx.date,
        date_formatted: formatDate(tx.date),
        merchant: tx.merchant?.name || tx.plaidName || 'Unknown',
        category: categoryName,
        category_icon: getCategoryIcon(categoryName),
        account: tx.account?.displayName || 'Unknown Account',
        notes: tx.notes || '',
        is_recurring: tx.isRecurring,
        tags: tx.tags?.map(t => t.name) || [],
      };
    });

    // Calculate summary stats
    const totalExpenses = items
      .filter(i => i.is_expense)
      .reduce((sum, i) => sum + Math.abs(i.amount), 0);
    const totalIncome = items
      .filter(i => i.is_income)
      .reduce((sum, i) => sum + i.amount, 0);

    // Return formatted response for TRMNL
    return res.status(200).json({
      status: 'success',
      title: 'Monarch Money',
      description: `${items.length} recent transactions`,
      summary: {
        total_transactions: totalCount,
        displayed: items.length,
        total_expenses: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        total_income: totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      },
      items: items,
    });
    
  } catch (error) {
    console.error('Monarch API Error:', error);
    
    // Check if it's an MFA error
    if (error.message.includes('MFA_REQUIRED')) {
      return res.status(401).json({
        status: 'error',
        message: 'Multi-factor authentication required. Add MONARCH_MFA_SECRET to your environment.',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch transactions from Monarch Money',
    });
  }
}
