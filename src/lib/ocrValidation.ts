// OCR Validation Service for ID Documents
import { createWorker, PSM } from 'tesseract.js';
import crypto from 'crypto';

export interface OCRValidationResult {
  success: boolean;
  extractedText: string;
  confidence: number;
  isValidId: boolean;
  detectedIdType?: string;
  errors: string[];
  warnings: string[];
}

export interface PhilippineIDPatterns {
  // Philippine ID patterns
  nationalId: RegExp;
  driversLicense: RegExp;
  passport: RegExp;
  votersId: RegExp;
  sssId: RegExp;
  philhealthId: RegExp;
  tinId: RegExp;
  postalId: RegExp;
  philsysId: RegExp;
}

export class IDOCRValidator {
  private static worker: Tesseract.Worker | null = null;

  // Philippine ID document patterns
  private static readonly ID_PATTERNS: PhilippineIDPatterns = {
    nationalId: /\b\d{4}-\d{7}-\d{1}\b/g, // National ID format
    driversLicense: /[A-Z]\d{2}-\d{2}-\d{6}/g, // Driver's License
    passport: /[A-Z]{2}\d{7}/g, // Philippine Passport
    votersId: /\d{4}-\d{4}-\d{4}-\d{4}/g, // Voter's ID
    sssId: /\d{2}-\d{7}-\d{1}/g, // SSS ID
    philhealthId: /\d{2}-\d{9}-\d{1}/g, // PhilHealth ID
    tinId: /\d{3}-\d{3}-\d{3}-\d{3}/g, // TIN ID
    postalId: /\d{4}\s?\d{4}\s?\d{4}/g, // Postal ID
    philsysId: /\d{4}-\d{4}-\d{4}-\d{1}/g // PhilSys ID
  };

  // Required keywords that should appear on Philippine IDs
  private static readonly REQUIRED_KEYWORDS = [
    'PHILIPPINES', 'REPUBLIC', 'NATIONAL', 'GOVERNMENT',
    'DEPARTMENT', 'COMMISSION', 'AUTHORITY', 'OFFICE',
    'SOCIAL SECURITY', 'PHILHEALTH', 'POSTAL', 'DRIVERS',
    'PASSPORT', 'VOTER', 'TIN', 'PHILSYS'
  ];

  // Initialize Tesseract worker with simpler configuration
  private static async initializeWorker(): Promise<Tesseract.Worker> {
    if (!this.worker) {
      try {
        console.log('Initializing OCR worker...');
        
        // Create worker without custom paths - let Tesseract.js handle it
        this.worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        console.log('OCR worker created, setting parameters...');

        // Optimize for ID documents
        await this.worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,/: ',
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Uniform block of text
          preserve_interword_spaces: '1'
        });
        
        console.log('Tesseract worker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Tesseract worker:', error);
        throw new Error(`OCR initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return this.worker;
  }

  // Main OCR validation function
  static async validateIDDocument(
    imageBuffer: Buffer,
    filename: string,
    userName?: string
  ): Promise<OCRValidationResult> {
    try {
      console.log(`Starting OCR validation for: ${filename}`);
      if (userName) {
        console.log(`Validating for user: ${userName}`);
      }
      
      // Initialize validation result
      const result: OCRValidationResult = {
        success: false,
        extractedText: '',
        confidence: 0,
        isValidId: false,
        errors: [],
        warnings: []
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

      // Perform OCR
      const worker = await this.initializeWorker();
      const { data } = await worker.recognize(imageBuffer);
      
      result.extractedText = data.text;
      result.confidence = data.confidence;

      console.log(`OCR completed. Confidence: ${result.confidence}%`);
      console.log(`Extracted text length: ${result.extractedText.length} characters`);

      // Validate OCR quality
      if (result.confidence < 30) {
        result.errors.push('Image quality too low for reliable text recognition. Please upload a clearer image.');
        return result;
      }

      if (result.confidence < 60) {
        result.warnings.push('Image quality could be better. Consider uploading a clearer photo.');
      }

      // Validate extracted text
      const textValidation = this.validateExtractedText(result.extractedText, userName);
      result.isValidId = textValidation.isValid;
      result.detectedIdType = textValidation.idType;
      result.errors.push(...textValidation.errors);
      result.warnings.push(...textValidation.warnings);

      // Overall success determination
      result.success = result.errors.length === 0 && result.confidence >= 30;

      return result;

    } catch (error) {
      console.error('OCR validation error:', error);
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        isValidId: false,
        errors: [`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
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

  // Validate extracted text for ID patterns
  private static validateExtractedText(text: string, userName?: string): {
    isValid: boolean;
    idType?: string;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const upperText = text.toUpperCase();

    console.log('Analyzing extracted text for ID patterns...');

    // Check minimum text length
    if (text.length < 20) {
      errors.push('Insufficient text extracted. Please ensure the ID is clearly visible and well-lit.');
      return { isValid: false, errors, warnings };
    }

    // Name matching validation
    if (userName) {
      const nameValidation = this.validateNameMatch(text, userName);
      if (!nameValidation.isMatch) {
        errors.push(nameValidation.error || 'Name verification failed');
        return { isValid: false, errors, warnings };
      } else if (nameValidation.warning) {
        warnings.push(nameValidation.warning);
      }
    }

    // Detect ID type based on patterns
    let detectedIdType: string | undefined;
    let hasValidPattern = false;

    for (const [idType, pattern] of Object.entries(this.ID_PATTERNS)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        detectedIdType = this.getIdTypeName(idType);
        hasValidPattern = true;
        console.log(`Detected ${detectedIdType}: ${matches[0]}`);
        break;
      }
    }

    // Check for required government keywords
    const foundKeywords = this.REQUIRED_KEYWORDS.filter(keyword => 
      upperText.includes(keyword)
    );

    console.log(`Found keywords: ${foundKeywords.join(', ')}`);

    // Validation logic
    if (!hasValidPattern && foundKeywords.length < 2) {
      errors.push('This does not appear to be a valid Philippine government-issued ID. Please upload a clear photo of a valid ID.');
      return { isValid: false, errors, warnings };
    }

    if (!hasValidPattern) {
      warnings.push('ID number format not clearly detected. Please ensure the ID number is visible.');
    }

    if (foundKeywords.length < 1) {
      warnings.push('Government agency name not clearly detected. Please ensure the ID is clearly visible.');
    }

    // Check for suspicious patterns
    if (this.hasSuspiciousPatterns(text)) {
      errors.push('Suspicious content detected. Please upload a genuine government ID.');
      return { isValid: false, errors, warnings };
    }

    return {
      isValid: true,
      idType: detectedIdType,
      errors,
      warnings
    };
  }

  // Validate if the extracted text contains the user's name
  private static validateNameMatch(text: string, userName: string): {
    isMatch: boolean;
    error?: string;
    warning?: string;
  } {
    const normalizedText = text.toUpperCase().replace(/[^A-Z\s]/g, ' ');
    const normalizedUserName = userName.toUpperCase().trim();
    
    console.log(`Checking name match for: "${userName}"`);
    console.log(`In extracted text: "${text.substring(0, 200)}..."`);
    
    // Split user name into parts (first, middle, last names)
    const nameParts = normalizedUserName.split(/\s+/).filter(part => part.length >= 2);
    
    if (nameParts.length === 0) {
      return {
        isMatch: false,
        error: "Invalid user name format for verification."
      };
    }
    
    // Check for exact full name match
    if (normalizedText.includes(normalizedUserName)) {
      console.log("✅ Exact full name match found");
      return { isMatch: true };
    }
    
    // Check if at least 2 name parts are found (for partial matches)
    const foundParts = nameParts.filter(part => {
      // Look for the name part with word boundaries
      const regex = new RegExp(`\\b${part}\\b`, 'i');
      return regex.test(normalizedText);
    });
    
    console.log(`Found ${foundParts.length}/${nameParts.length} name parts: [${foundParts.join(', ')}]`);
    
    // Require at least 70% of name parts to match
    const matchPercentage = foundParts.length / nameParts.length;
    
    if (matchPercentage >= 0.7) {
      if (matchPercentage < 1.0) {
        return {
          isMatch: true,
          warning: `Partial name match detected. Please ensure the ID belongs to ${userName}.`
        };
      }
      console.log("✅ Sufficient name parts matched");
      return { isMatch: true };
    }
    
    // Check for common name variations (nicknames, initials)
    if (this.checkNameVariations(normalizedText, nameParts)) {
      console.log("✅ Name variation match found");
      return {
        isMatch: true,
        warning: `Name variation detected. Please verify the ID belongs to ${userName}.`
      };
    }
    
    console.log("❌ Name match failed");
    return {
      isMatch: false,
      error: `The name on the ID does not match your account name (${userName}). Please upload an ID that belongs to you, or update your account name to match your ID.`
    };
  }
  
  // Check for common name variations and abbreviations
  private static checkNameVariations(text: string, nameParts: string[]): boolean {
    // Check for initials (e.g., "John Michael Smith" could appear as "J. M. Smith")
    for (let i = 0; i < nameParts.length; i++) {
      const initial = nameParts[i][0];
      const initialPattern = new RegExp(`\\b${initial}\\.?\\s`, 'i');
      if (initialPattern.test(text)) {
        return true;
      }
    }
    
    // Check for common Filipino name patterns
    const commonNicknames: { [key: string]: string[] } = {
      'JOHN': ['JOHNNY', 'JON'],
      'MARIA': ['MARY', 'MAR'],
      'JOSE': ['JOE', 'PEPE'],
      'ANTONIO': ['TONY', 'ANTON'],
      'FRANCISCO': ['FRANK', 'KIKO'],
      'RICARDO': ['RICK', 'RICKY'],
      'ELIZABETH': ['LIZ', 'BETH'],
      'CATHERINE': ['KATE', 'CATHY'],
      'CHRISTOPHER': ['CHRIS'],
      'MICHAEL': ['MIKE', 'MICK']
    };
    
    for (const namePart of nameParts) {
      if (commonNicknames[namePart]) {
        for (const nickname of commonNicknames[namePart]) {
          if (text.includes(nickname)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  // Check for suspicious patterns (fake IDs, templates, etc.)
  private static hasSuspiciousPatterns(text: string): boolean {
    const suspiciousWords = [
      'SAMPLE', 'TEMPLATE', 'DUMMY', 'FAKE', 'TEST',
      'PHOTOSHOP', 'EDITED', 'COPY', 'DUPLICATE'
    ];

    const upperText = text.toUpperCase();
    return suspiciousWords.some(word => upperText.includes(word));
  }

  // Convert ID type key to readable name
  private static getIdTypeName(idType: string): string {
    const typeNames: Record<string, string> = {
      nationalId: 'National ID',
      driversLicense: 'Driver\'s License',
      passport: 'Philippine Passport',
      votersId: 'Voter\'s ID',
      sssId: 'SSS ID',
      philhealthId: 'PhilHealth ID',
      tinId: 'TIN ID',
      postalId: 'Postal ID',
      philsysId: 'PhilSys ID'
    };
    return typeNames[idType] || 'Government ID';
  }

  // Generate hash for duplicate detection
  static generateImageHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  // Clean up worker when done
  static async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Validate image quality (blur detection, contrast, etc.)
  static async validateImageQuality(buffer: Buffer): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    suggestions: string[];
  }> {
    // Basic quality assessment based on file size and format
    const suggestions: string[] = [];
    let score = 70; // Base score

    // File size indicates resolution quality
    const sizeKB = buffer.length / 1024;
    if (sizeKB < 50) {
      score -= 30;
      suggestions.push('Image resolution appears low. Take a closer photo.');
    } else if (sizeKB > 500) {
      score += 10; // Higher resolution likely
    }

    // Simple quality determination
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 85) quality = 'excellent';
    else if (score >= 70) quality = 'good';
    else if (score >= 50) quality = 'fair';
    else quality = 'poor';

    if (quality === 'poor' || quality === 'fair') {
      suggestions.push('Ensure good lighting when taking the photo.');
      suggestions.push('Hold the camera steady to avoid blur.');
      suggestions.push('Make sure the entire ID is visible in the frame.');
    }

    return { quality, score, suggestions };
  }
}