import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { IDOCRValidator } from "@/lib/ocrValidation";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const {
      shopName,
      businessType,
      shopDescription,
      pickupAddress,
      shopEmail,
      shopPhone,
      socialMediaLinks,
      sellerStoryTitle,
      sellerStory,
      sellerPhoto,
      validIdUrl,
      agreedToTerms,
      agreedToCommission,
      agreedToShipping
    } = body;

    const normalizedBusinessType =
      businessType && typeof businessType === "string"
        ? businessType.trim().slice(0, 80)
        : "Handicrafts";

    // Validation
    if (!shopName || shopName.length < 3 || shopName.length > 50) {
      return NextResponse.json(
        { success: false, message: "Shop name must be 3-50 characters" },
        { status: 400 }
      );
    }

    // Shop description is now optional
    if (shopDescription && (shopDescription.length < 10 || shopDescription.length > 500)) {
      return NextResponse.json(
        { success: false, message: "Shop description must be 10-500 characters if provided" },
        { status: 400 }
      );
    }

    if (!pickupAddress?.barangay || !pickupAddress?.otherDetails) {
      return NextResponse.json(
        { success: false, message: "Complete pickup address is required" },
        { status: 400 }
      );
    }

    if (!shopEmail || !shopPhone) {
      return NextResponse.json(
        { success: false, message: "Shop email and phone are required" },
        { status: 400 }
      );
    }

    if (!sellerStoryTitle || !sellerStory || sellerStory.length < 10) {
      return NextResponse.json(
        { success: false, message: "Seller story is required (min 10 characters)" },
        { status: 400 }
      );
    }

    if (!validIdUrl) {
      return NextResponse.json(
        { success: false, message: "Valid ID upload is required" },
        { status: 400 }
      );
    }

    // OCR Validation for ID document
    try {
      console.log("Starting OCR validation for uploaded ID...");
      
      // Get user information for name matching
      const user = await User.findOne({ email: session.user.email });
      const userName = user?.name || user?.fullName;
      
      // Extract file data from validIdUrl (assuming it's a data URL or file path)
      // In production, you might need to fetch the file from storage
      if (validIdUrl.startsWith('data:')) {
        // Handle base64 data URL
        const base64Data = validIdUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = 'uploaded-id.jpg'; // Default filename
        
        const ocrResult = await IDOCRValidator.validateIDDocument(buffer, filename, userName);
        
        console.log("OCR Validation Result:", {
          success: ocrResult.success,
          confidence: ocrResult.confidence,
          isValidId: ocrResult.isValidId,
          detectedIdType: ocrResult.detectedIdType,
          errorsCount: ocrResult.errors.length
        });
        
        if (!ocrResult.success) {
          return NextResponse.json(
            { 
              success: false, 
              message: "ID validation failed: " + ocrResult.errors.join(', '),
              ocrErrors: ocrResult.errors
            },
            { status: 400 }
          );
        }
        
        if (!ocrResult.isValidId) {
          return NextResponse.json(
            { 
              success: false, 
              message: "Uploaded document does not appear to be a valid Philippine government ID",
              ocrWarnings: ocrResult.warnings
            },
            { status: 400 }
          );
        }
        
        // Log successful validation
        console.log(`ID validation successful. Detected: ${ocrResult.detectedIdType || 'Government ID'} with ${ocrResult.confidence}% confidence`);
        
      } else {
        console.log("Skipping OCR validation - file not in expected format");
      }
      
    } catch (ocrError) {
      console.error("OCR validation error:", ocrError);
      // Don't fail the application for OCR errors, but log them
      console.log("Proceeding with application despite OCR error");
    }

    if (!agreedToTerms || !agreedToCommission || !agreedToShipping) {
      return NextResponse.json(
        { success: false, message: "All agreements must be accepted" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const user = await User.findOne({ email: session.user.email });
    
    console.log("Existing user status:", {
      email: session.user.email,
      userExists: !!user,
      isSeller: user?.isSeller,
      applicationStatus: user?.sellerProfile?.applicationStatus,
      hasSellerProfile: !!user?.sellerProfile
    });
    
    if (!user) {
      console.error("User not found for email:", session.user.email);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    if (user?.isSeller && user?.sellerProfile?.applicationStatus === 'approved') {
      return NextResponse.json(
        { success: false, message: "You are already registered as a seller. Use the profile section to update your information." },
        { status: 400 }
      );
    }

    // Allow resubmission if previous application was rejected or incomplete

    // Create timestamps
    const now = new Date();
    
    // Log the data being saved
    console.log("Saving seller profile:", {
      shopName,
      businessType,
      shopDescription,
      pickupAddress,
      shopEmail,
      shopPhone,
      sellerStoryTitle,
      sellerStory
    });
    
    // Update user with seller application
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          isSeller: true, // Immediately set to true for instant My Shop access
          sellerProfile: {
            shopName,
            businessType,
            shopDescription,
            businessType: normalizedBusinessType,
            pickupAddress,
            shopEmail,
            shopPhone,
            socialMediaLinks: socialMediaLinks || {},
            sellerStoryTitle,
            sellerStory,
            sellerPhoto: sellerPhoto || "",
            validIdUrl,
            agreedToTerms,
            agreedToCommission,
            agreedToShipping,
            applicationStatus: 'approved', // Auto-approve for instant access
            applicationSubmittedAt: now,
            approvedAt: now
          }
        }
      },
      { new: true }
    );
    
    console.log("Database update result:", {
      success: !!updatedUser,
      userId: updatedUser?._id,
      isSeller: updatedUser?.isSeller,
      applicationStatus: updatedUser?.sellerProfile?.applicationStatus,
      shopName: updatedUser?.sellerProfile?.shopName
    });

    if (!updatedUser) {
      console.error("Failed to update user in database");
      return NextResponse.json(
        { success: false, message: "Failed to update user" },
        { status: 500 }
      );
    }

    // Verify the update was successful by re-querying
    const verifyUser = await User.findOne({ email: session.user.email })
      .select('isSeller sellerProfile.applicationStatus sellerProfile.shopName');
    
    console.log("Verification query result:", {
      isSeller: verifyUser?.isSeller,
      applicationStatus: verifyUser?.sellerProfile?.applicationStatus,
      shopName: verifyUser?.sellerProfile?.shopName
    });

    return NextResponse.json({
      success: true,
      message: "Seller application submitted successfully",
      data: {
        isSeller: true,
        applicationStatus: 'approved',
        submittedAt: now,
        shopName: shopName
      }
    });

  } catch (error) {
    console.error("Error submitting seller application:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit application" },
      { status: 500 }
    );
  }
}
