'use client';

import { useState, useEffect } from 'react';
import {
  calculatePasswordStrength,
  checkPasswordBreach,
  getPasswordStrengthColor,
  getPasswordStrengthPercentage,
  type PasswordStrength,
  type PasswordRequirements,
  DEFAULT_PASSWORD_REQUIREMENTS,
} from '@/lib/passwordPolicy';
import './PasswordStrengthMeter.css';

interface PasswordStrengthMeterProps {
  password: string;
  requirements?: PasswordRequirements;
  checkBreaches?: boolean; // Enable HIBP breach checking
  onChange?: (strength: PasswordStrength, isBreached?: boolean) => void;
}

export default function PasswordStrengthMeter({
  password,
  requirements = DEFAULT_PASSWORD_REQUIREMENTS,
  checkBreaches = false,
  onChange,
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [checkingBreach, setCheckingBreach] = useState(false);

  useEffect(() => {
    if (!password) {
      setStrength(null);
      setIsBreached(false);
      onChange?.(calculatePasswordStrength(''), false);
      return;
    }

    // Calculate strength immediately
    const newStrength = calculatePasswordStrength(password, requirements);
    setStrength(newStrength);

    // Check for breaches if enabled (debounced)
    if (checkBreaches && password.length >= requirements.minLength) {
      const timer = setTimeout(async () => {
        setCheckingBreach(true);
        try {
          const result = await checkPasswordBreach(password);
          setIsBreached(result.breached);
          onChange?.(newStrength, result.breached);
        } catch (error) {
          console.error('Breach check failed:', error);
          onChange?.(newStrength, false);
        } finally {
          setCheckingBreach(false);
        }
      }, 500); // Debounce 500ms

      return () => clearTimeout(timer);
    } else {
      onChange?.(newStrength, false);
    }
  }, [password, requirements, checkBreaches]);

  if (!password || !strength) {
    return null;
  }

  const strengthColor = getPasswordStrengthColor(strength.score);
  const strengthPercentage = getPasswordStrengthPercentage(strength.score);

  return (
    <div className="password-strength-meter">
      {/* Strength Bar */}
      <div className="strength-bar-container">
        <div
          className="strength-bar"
          style={{
            width: `${strengthPercentage}%`,
            backgroundColor: strengthColor,
          }}
        />
      </div>

      {/* Strength Label */}
      <div className="strength-info">
        <span className="strength-label" style={{ color: strengthColor }}>
          {strength.label}
        </span>
        {checkingBreach && <span className="checking-breach">Checking...</span>}
      </div>

      {/* Requirements Checklist */}
      <div className="requirements-list">
        <div className={`requirement ${strength.meets.length ? 'met' : ''}`}>
          {strength.meets.length ? '✓' : '○'} At least {requirements.minLength} characters
        </div>
        {requirements.requireUppercase && (
          <div className={`requirement ${strength.meets.uppercase ? 'met' : ''}`}>
            {strength.meets.uppercase ? '✓' : '○'} Uppercase letter
          </div>
        )}
        {requirements.requireLowercase && (
          <div className={`requirement ${strength.meets.lowercase ? 'met' : ''}`}>
            {strength.meets.lowercase ? '✓' : '○'} Lowercase letter
          </div>
        )}
        {requirements.requireNumbers && (
          <div className={`requirement ${strength.meets.numbers ? 'met' : ''}`}>
            {strength.meets.numbers ? '✓' : '○'} Number
          </div>
        )}
        {requirements.requireSpecialChars && (
          <div className={`requirement ${strength.meets.specialChars ? 'met' : ''}`}>
            {strength.meets.specialChars ? '✓' : '○'} Special character (!@#$%^&*...)
          </div>
        )}
      </div>

      {/* Feedback section removed - validation only, no hints */}
    </div>
  );
}
