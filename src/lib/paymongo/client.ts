// PayMongo API Client
// Uses PayMongo REST API directly without SDK

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';

if (!PAYMONGO_SECRET_KEY) {
  console.warn('Warning: PAYMONGO_SECRET_KEY is not set in environment variables');
}

// Base64 encode the secret key for Basic Auth
const authHeader = `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`;

export interface PaymentIntentData {
  amount: number; // Amount in cents (e.g., 10000 = ₱100.00)
  currency: string; // 'PHP'
  description: string;
  statement_descriptor?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMethodData {
  type: 'card' | 'gcash' | 'grab_pay' | 'paymaya';
  details: {
    card_number?: string;
    exp_month?: number;
    exp_year?: number;
    cvc?: string;
  };
  billing?: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface SourceData {
  type: 'gcash' | 'grab_pay';
  amount: number;
  currency: string;
  redirect: {
    success: string;
    failed: string;
  };
  billing?: {
    name: string;
    email: string;
    phone: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Create a Payment Intent
 * Payment Intents are used for card payments
 */
export async function createPaymentIntent(data: PaymentIntentData) {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: data.amount,
            currency: data.currency,
            description: data.description,
            statement_descriptor: data.statement_descriptor || 'GrowLokal',
            metadata: data.metadata || {},
            payment_method_allowed: ['card'],
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment intent');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo createPaymentIntent error:', error);
    throw error;
  }
}

/**
 * Attach Payment Method to Payment Intent
 */
export async function attachPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string,
  options?: { clientKey?: string; returnUrl?: string }
) {
  try {
    const attributes: Record<string, any> = {
      payment_method: paymentMethodId,
    };

    if (options?.clientKey) {
      attributes.client_key = options.clientKey;
    }

    if (options?.returnUrl) {
      attributes.return_url = options.returnUrl;
    }

    const response = await fetch(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              ...attributes,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to attach payment method');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo attachPaymentIntent error:', error);
    throw error;
  }
}

/**
 * Retrieve Payment Intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const response = await fetch(
      `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to retrieve payment intent');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo retrievePaymentIntent error:', error);
    throw error;
  }
}

/**
 * Create a Source (for GCash, GrabPay, etc.)
 */
export async function createSource(data: SourceData) {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: data.type,
            amount: data.amount,
            currency: data.currency,
            redirect: data.redirect,
            billing: data.billing,
            metadata: data.metadata,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create source');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo createSource error:', error);
    throw error;
  }
}

/**
 * Create a Payment (for sources like GCash)
 */
export async function createPayment(
  sourceId: string,
  description: string,
  metadata?: Record<string, any>
) {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            source: {
              id: sourceId,
              type: 'source',
            },
            description,
            currency: 'PHP',
            metadata,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo createPayment error:', error);
    throw error;
  }
}

/**
 * Retrieve a Payment
 */
export async function retrievePayment(paymentId: string) {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to retrieve payment');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo retrievePayment error:', error);
    throw error;
  }
}

/**
 * Create Webhook
 */
export async function createWebhook(url: string, events: string[]) {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            url,
            events,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to create webhook');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('PayMongo createWebhook error:', error);
    throw error;
  }
}

export default {
  createPaymentIntent,
  attachPaymentIntent,
  retrievePaymentIntent,
  createSource,
  createPayment,
  retrievePayment,
  createWebhook,
};
