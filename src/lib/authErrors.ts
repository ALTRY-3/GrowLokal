/**
 * Maps NextAuth error codes to user-friendly error messages
 */
export const authErrorMessages: Record<string, string> = {
  // NextAuth default errors
  'Signin': 'There was a problem signing you in. Please try again.',
  'OAuthSignin': 'Unable to connect to authentication provider. Please try again.',
  'OAuthCallback': 'There was an issue during authentication. Please try again.',
  'OAuthCreateAccount': 'Could not create your account. Please try a different method.',
  'EmailCreateAccount': 'Could not create your account. Please try again.',
  'Callback': 'Authentication callback failed. Please try again.',
  'OAuthAccountNotLinked': 'This email is already registered with a different login method. Please sign in using your original method.',
  'EmailSignin': 'Failed to send verification email. Please try again.',
  'CredentialsSignin': 'Invalid email or password. Please check your credentials and try again.',
  'SessionRequired': 'Please sign in to access this page.',
  'AccessDenied': 'Access denied. You don\'t have permission to access this resource.',
  'Verification': 'The verification link has expired or is invalid. Please request a new one.',
  'Configuration': 'There is a problem with the server configuration. Please contact support.',
  
  // Custom errors
  'EMAIL_NOT_VERIFIED': 'Please verify your email address before logging in. Check your inbox for the verification link.',
  'AccountNotVerified': 'Please verify your email address before logging in. Check your inbox for the verification link.',
  'AccountLocked': 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
  'TooManyAttempts': 'Too many attempts. Please wait before trying again.',
  'WeakPassword': 'Password does not meet security requirements. Please choose a stronger password.',
  'PasswordMismatch': 'Passwords do not match. Please try again.',
  'UserExists': 'An account with this email already exists. Please login or use forgot password.',
  'InvalidToken': 'Invalid or expired token. Please request a new one.',
  'TokenExpired': 'This link has expired. Please request a new verification or reset link.',
  'Default': 'An unexpected error occurred. Please try again or contact support if the problem persists.',
};

/**
 * Get a user-friendly error message from a NextAuth error or error string
 * @param error - The error code, error object, or error message
 * @returns User-friendly error message
 */
export function getFriendlyErrorMessage(error: string | Error | undefined): string {
  if (!error) {
    return authErrorMessages['Default'];
  }

  // Handle Error objects
  if (error instanceof Error) {
    error = error.message;
  }

  // Extract error code from URL parameters (common in NextAuth redirects)
  if (error.includes('error=')) {
    const match = error.match(/error=([^&]+)/);
    if (match) {
      error = decodeURIComponent(match[1]);
    }
  }

  // Check for exact matches in our error messages
  if (authErrorMessages[error]) {
    return authErrorMessages[error];
  }

  // Check for partial matches (case-insensitive)
  const lowerError = error.toLowerCase();
  for (const [key, message] of Object.entries(authErrorMessages)) {
    if (lowerError.includes(key.toLowerCase())) {
      return message;
    }
  }

  // Handle rate limiting messages (from our custom implementation)
  if (lowerError.includes('too many') || lowerError.includes('rate limit')) {
    return authErrorMessages['TooManyAttempts'];
  }

  // Handle account locked messages
  if (lowerError.includes('locked') || lowerError.includes('suspended')) {
    return authErrorMessages['AccountLocked'];
  }

  // Handle verification messages
  if (lowerError.includes('verify') || lowerError.includes('verification')) {
    return authErrorMessages['AccountNotVerified'];
  }

  // Return the original error if it's already user-friendly (doesn't look like a code)
  if (error.length > 50 || error.includes(' ')) {
    return error;
  }

  // Default fallback
  return authErrorMessages['Default'];
}

/**
 * Check if error is related to account not being linked
 */
export function isAccountNotLinkedError(error: string | undefined): boolean {
  if (!error) return false;
  const lowerError = error.toLowerCase();
  return lowerError.includes('oauthaccountnotlinked') || 
         lowerError.includes('not linked') ||
         lowerError.includes('different login method');
}

/**
 * Check if error is related to email verification
 */
export function isVerificationError(error: string | undefined): boolean {
  if (!error) return false;
  const lowerError = error.toLowerCase();
  return lowerError.includes('verification') || 
         lowerError.includes('verify') ||
         lowerError.includes('not verified');
}

/**
 * Check if error is related to rate limiting
 */
export function isRateLimitError(error: string | undefined): boolean {
  if (!error) return false;
  const lowerError = error.toLowerCase();
  return lowerError.includes('too many') || 
         lowerError.includes('rate limit') ||
         lowerError.includes('try again later');
}
