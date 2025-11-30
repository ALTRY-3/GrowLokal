/**
 * Password Policy Configuration and Validation
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength?: number;
}

export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  feedback: string[];
  meets: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}

// Default password requirements
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  if (requirements.maxLength && password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-4)
 * Based on length, character variety, and common patterns
 */
export function calculatePasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      feedback: ['Enter a password'],
      meets: {
        length: false,
        uppercase: false,
        lowercase: false,
        numbers: false,
        specialChars: false,
      },
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Check requirements
  const meets = {
    length: password.length >= requirements.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Base score on requirements met
  if (meets.length) score++;
  if (meets.uppercase) score++;
  if (meets.lowercase) score++;
  if (meets.numbers) score++;
  if (meets.specialChars) score++;

  // Bonus for length
  if (password.length >= 12) {
    score += 0.5;
  }
  if (password.length >= 16) {
    score += 0.5;
  }

  // Penalties for common patterns
  const commonPatterns = [
    /^(.)\1+$/, // All same character
    /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential
    /^(qwerty|asdfgh|zxcvbn|password|admin|user|letmein|welcome|monkey|dragon|master|sunshine)/i, // Common words
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid common patterns and words');
      break;
    }
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, Math.round(score)));

  // Generate feedback
  if (!meets.length) feedback.push(`Use at least ${requirements.minLength} characters`);
  if (!meets.uppercase && requirements.requireUppercase) feedback.push('Add uppercase letters');
  if (!meets.lowercase && requirements.requireLowercase) feedback.push('Add lowercase letters');
  if (!meets.numbers && requirements.requireNumbers) feedback.push('Add numbers');
  if (!meets.specialChars && requirements.requireSpecialChars) feedback.push('Add special characters');

  if (score >= 4 && feedback.length === 0) {
    feedback.push('Excellent password strength!');
  }

  // Determine label
  let label: PasswordStrength['label'];
  switch (score) {
    case 0:
    case 1:
      label = 'Very Weak';
      break;
    case 2:
      label = 'Weak';
      break;
    case 3:
      label = 'Fair';
      break;
    case 4:
      label = 'Strong';
      break;
    default:
      label = 'Very Strong';
  }

  return {
    score,
    label,
    feedback,
    meets,
  };
}

/**
 * Check if password has been breached using Have I Been Pwned API (optional)
 * Uses k-anonymity model - only first 5 chars of SHA-1 hash are sent
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count: number;
  error?: string;
}> {
  try {
    // Generate SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Send only first 5 characters of hash (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Additional privacy protection
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check password breach');
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix is in the results
    for (const line of hashes) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        return { breached: true, count };
      }
    }

    return { breached: false, count: 0 };
  } catch (error: any) {
    console.error('Password breach check error:', error);
    return {
      breached: false,
      count: 0,
      error: error.message || 'Failed to check password breach',
    };
  }
}

/**
 * Generate password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return '#d32f2f'; // Red
    case 2:
      return '#f57c00'; // Orange
    case 3:
      return '#fbc02d'; // Yellow
    case 4:
      return '#388e3c'; // Green
    default:
      return '#1976d2'; // Blue
  }
}

/**
 * Get password strength percentage for progress bar
 */
export function getPasswordStrengthPercentage(score: number): number {
  return (score / 4) * 100;
}
