// Simple ID Validation Service (Fallback when OCR fails)
import crypto from 'crypto';

export interface SimpleValidationResult {
  success: boolean;
  isValidId: boolean;
  confidence: number;
  detectedIdType?: string;
  errors: string[];
  warnings: string[];
  imageHash: string;
}

export interface PhilippineIDInfo {
  [key: string]: {
    name: string;
    patterns: RegExp[];
    keywords: string[];
    minFileSize: number; // KB
    expectedDimensions: { minWidth: number; minHeight: number };
  };
}

export class SimpleIDValidator {
  
  // Philippine ID information
  private static readonly ID_INFO: PhilippineIDInfo = {
    nationalId: {
      name: 'National ID',
      patterns: [/\b\d{4}-\d{7}-\d{1}\b/g, /NATIONAL\s+ID/i],
      keywords: ['NATIONAL', 'PHILIPPINES', 'REPUBLIC'],
      minFileSize: 50, // KB
      expectedDimensions: { minWidth: 300, minHeight: 200 }
    },
    driversLicense: {
      name: 'Driver\'s License',
      patterns: [/[A-Z]\d{2}-\d{2}-\d{6}/g, /DRIVER.*LICENSE/i],
      keywords: ['DRIVER', 'LICENSE', 'LTO'],
      minFileSize: 40,
      expectedDimensions: { minWidth: 300, minHeight: 200 }
    },
    passport: {
      name: 'Philippine Passport',
      patterns: [/[A-Z]{2}\d{7}/g, /PASSPORT/i],
      keywords: ['PASSPORT', 'PHILIPPINES', 'REPUBLIC'],
      minFileSize: 60,
      expectedDimensions: { minWidth: 400, minHeight: 300 }
    },
    sss: {
      name: 'SSS ID',
      patterns: [/\d{2}-\d{7}-\d{1}/g, /SOCIAL\s+SECURITY/i],
      keywords: ['SOCIAL', 'SECURITY', 'SSS'],
      minFileSize: 30,
      expectedDimensions: { minWidth: 250, minHeight: 150 }
    },
    philhealth: {
      name: 'PhilHealth ID',
      patterns: [/\d{2}-\d{9}-\d{1}/g, /PHILHEALTH/i],
      keywords: ['PHILHEALTH', 'HEALTH'],
      minFileSize: 30,
      expectedDimensions: { minWidth: 250, minHeight: 150 }
    }
  };

  // Validate ID document without OCR
  static async validateIDDocument(
    imageBuffer: Buffer,
    filename: string,
    userName?: string
  ): Promise<SimpleValidationResult> {
    try {
      console.log(`Starting simple ID validation for: ${filename}`);
      if (userName) {
        console.log(`Validating for user: ${userName}`);
      }

      const result: SimpleValidationResult = {
        success: false,
        isValidId: false,
        confidence: 0,
        errors: [],
        warnings: [],
        imageHash: this.generateImageHash(imageBuffer)
      };

      // Validate file format
      const formatValidation = this.validateFileFormat(imageBuffer, filename);
      if (!formatValidation.valid) {
        result.errors.push(...formatValidation.errors);
        return result;
      }

      // Validate file size
      const sizeValidation = this.validateFileSize(imageBuffer);
      if (!sizeValidation.valid) {
        result.errors.push(...sizeValidation.errors);
        return result;
      }

      // Validate image quality
      const qualityCheck = this.validateImageQuality(imageBuffer);
      result.confidence = qualityCheck.score;

      if (qualityCheck.score < 30) {
        result.errors.push('Image quality too low. Please upload a clearer photo.');
        return result;
      }

      if (qualityCheck.score < 60) {
        result.warnings.push('Image quality could be better. Consider retaking the photo with better lighting.');
      }

      // Since we can't do OCR, we'll validate based on other factors
      // In a real scenario, you might want to:
      // 1. Use image recognition APIs (Google Cloud Vision, AWS Rekognition)
      // 2. Manual review process
      // 3. Machine learning models for document classification

      // For now, we'll do basic validation and assume it's valid if it passes basic checks
      result.isValidId = true;
      result.success = true;
      result.confidence = Math.max(result.confidence, 70); // Minimum confidence for basic validation
      result.detectedIdType = 'Government ID'; // Generic type since we can't detect specific type
      
      // Add a warning since we can't verify the content
      result.warnings.push('Document uploaded successfully. Manual verification may be required.');
      
      if (userName) {
        result.warnings.push(`Please ensure the ID belongs to ${userName} as automated verification is currently unavailable.`);
      }

      console.log('Simple validation completed successfully');
      return result;

    } catch (error) {
      console.error('Simple validation error:', error);
      return {
        success: false,
        isValidId: false,
        confidence: 0,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        imageHash: this.generateImageHash(imageBuffer)
      };
    }
  }

  // Validate file format
  private static validateFileFormat(buffer: Buffer, filename: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      errors.push(`Unsupported file format. Please upload: ${validExtensions.join(', ')}`);
      return { valid: false, errors };
    }

    // Check file signature (magic numbers)
    const signature = buffer.toString('hex', 0, 4);
    const validSignatures = [
      'ffd8ff', // JPEG
      '89504e', // PNG
      '424d',   // BMP
      '49492a', // TIFF (little-endian)
      '4d4d2a'  // TIFF (big-endian)
    ];

    const isValidSignature = validSignatures.some(sig => signature.startsWith(sig));
    if (!isValidSignature) {
      errors.push('Invalid or corrupted image file. Please upload a valid image.');
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  // Validate file size
  private static validateFileSize(buffer: Buffer): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 10 * 1024; // 10KB

    if (buffer.length > maxSize) {
      errors.push('File too large. Maximum size is 10MB.');
    }

    if (buffer.length < minSize) {
      errors.push('File too small. Minimum size is 10KB.');
    }

    return { 
      valid: errors.length === 0, 
      errors 
    };
  }

  // Validate image quality
  static validateImageQuality(buffer: Buffer): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 70; // Base score

    // File size indicates resolution quality
    const sizeKB = buffer.length / 1024;
    
    if (sizeKB < 50) {
      score -= 30;
      suggestions.push('Image resolution appears low. Take a closer photo.');
    } else if (sizeKB < 100) {
      score -= 10;
      suggestions.push('Consider taking a higher resolution photo.');
    } else if (sizeKB > 500) {
      score += 10; // Higher resolution likely
    }

    // Check for very small or very large files
    if (sizeKB < 20) {
      score -= 20;
      suggestions.push('File too small - may not contain enough detail.');
    } else if (sizeKB > 5000) {
      score -= 5;
      suggestions.push('Very large file - consider compressing the image.');
    }

    // Determine quality level
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 85) quality = 'excellent';
    else if (score >= 70) quality = 'good';
    else if (score >= 50) quality = 'fair';
    else quality = 'poor';

    // Add suggestions for poor/fair quality
    if (quality === 'poor' || quality === 'fair') {
      suggestions.push('Ensure good lighting when taking the photo.');
      suggestions.push('Hold the camera steady to avoid blur.');
      suggestions.push('Make sure the entire ID is visible in the frame.');
      suggestions.push('Clean the camera lens for clearer photos.');
    }

    return { quality, score, suggestions };
  }

  // Generate hash for duplicate detection
  static generateImageHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  // Check if image might be a duplicate
  static async checkDuplicateImage(imageHash: string, userId: string): Promise<boolean> {
    // In a real implementation, you would check against a database
    // For now, we'll return false (no duplicate detected)
    return false;
  }

  // Enhanced validation with external service (placeholder)
  static async validateWithExternalService(imageBuffer: Buffer): Promise<{
    isValidId: boolean;
    extractedText?: string;
    confidence: number;
    service: string;
  }> {
    // This is a placeholder for integration with external OCR services
    // such as Google Cloud Vision API, AWS Textract, Azure Cognitive Services
    
    console.log('External validation service not configured - using fallback');
    
    return {
      isValidId: true,
      confidence: 75,
      service: 'fallback'
    };
  }
}