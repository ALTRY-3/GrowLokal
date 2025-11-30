import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import User from '@/models/User'

export async function POST(request: NextRequest) {
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

    // Get user and verify seller status
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Must be an approved seller' },
        { status: 403 }
      )
    }

    // Find products that don't belong to any real user (using dummy IDs)
    // Update them to belong to this user
    const result = await Product.updateMany(
      { artistId: { $exists: true } }, // Find all products
      { 
        $set: { 
          artistId: user._id,
          artistName: user.sellerProfile.businessName || user.name || 'Unknown Artist'
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} products to belong to user ${user.email}`,
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
    console.error('Fix ownership error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix product ownership',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}