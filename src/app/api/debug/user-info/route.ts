import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User, { IUser } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get user with full details
    const user = await User.findOne({ email: session.user.email }).lean() as IUser | null
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        email: session.user.email
      })
    }

    return NextResponse.json({
      success: true,
      userInfo: {
        email: user.email,
        name: user.name,
        isSeller: user.isSeller,
        sellerProfile: user.sellerProfile ? {
          shopName: user.sellerProfile.shopName,
          applicationStatus: user.sellerProfile.applicationStatus,
          applicationSubmittedAt: user.sellerProfile.applicationSubmittedAt,
          approvedAt: user.sellerProfile.approvedAt,
          rejectedAt: user.sellerProfile.rejectedAt,
          rejectionReason: user.sellerProfile.rejectionReason
        } : null
      }
    })

  } catch (error) {
    console.error('User info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get user info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}