import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StudentOCRValidator } from '@/lib/studentOcrValidation';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('\n🎓 STUDENT PROJECT - ID Validation Request');

    // Get user information for name matching
    const user = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/profile`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });
    
    let userName: string | undefined;
    if (user.ok) {
      const userData = await user.json();
      userName = userData.name || userData.fullName;
      console.log(`👤 Validating ID for user: ${userName}`);
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('idDocument') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing file: ${file.name}, Size: ${Math.round(file.size / 1024)}KB`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use student-friendly validation
    const validationResult = await StudentOCRValidator.validateStudentID(buffer, file.name, userName);

    // Debug output for learning purposes
    if (process.env.NODE_ENV === 'development') {
      await StudentOCRValidator.debugValidation(buffer, file.name, userName);
    }

    // Prepare student-friendly response
    const response = {
      success: validationResult.success,
      validation: {
        isValidId: validationResult.isValidId,
        nameMatch: validationResult.nameMatch,
        detectedIdType: validationResult.detectedIdType || 'Government ID',
        confidence: validationResult.confidence,
        extractedTextLength: validationResult.extractedText.length,
        imageHash: validationResult.debugInfo.imageHash,
        processingMethod: validationResult.debugInfo.processingMethod,
        nameComparisonDetails: validationResult.debugInfo.nameComparisonDetails
      },
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      // For student project: show more details for learning
      extractedText: validationResult.extractedText.length > 0 ? 
        validationResult.extractedText.substring(0, 200) + '...' : 
        null,
      studentInfo: {
        message: '🎓 This is a simplified validation for educational purposes',
        tips: [
          'Make sure the ID image is clear and well-lit',
          'Ensure your account name matches the name on your ID',
          'Philippine government IDs work best (National ID, Driver\'s License, etc.)',
          'The system is designed to be student-friendly with flexible validation'
        ]
      }
    };

    // Log result for educational monitoring
    console.log('\n📊 STUDENT PROJECT VALIDATION RESULT:');
    console.log(`✅ Overall Success: ${response.success}`);
    console.log(`🆔 Valid ID: ${response.validation.isValidId}`);
    console.log(`👤 Name Match: ${response.validation.nameMatch}`);
    console.log(`🎯 Confidence: ${response.validation.confidence}%`);
    console.log(`📄 ID Type: ${response.validation.detectedIdType}`);
    console.log(`❌ Errors: ${response.errors.length}`);
    console.log(`⚠️ Warnings: ${response.warnings.length}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('🚨 Student ID validation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'ID validation failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: [],
        studentInfo: {
          message: '🎓 Don\'t worry! This is a learning environment.',
          tips: [
            'Try uploading the image again',
            'Make sure the image file is not corrupted',
            'Check that the file is a valid image format',
            'Contact your instructor if the problem persists'
          ]
        }
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}