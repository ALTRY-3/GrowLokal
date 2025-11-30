import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import User from '@/models/User'

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

    // Get user and check status
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({
        debug: {
          message: 'User not found',
          email: session.user.email,
          userExists: false
        }
      })
    }

    // Count total products in database
    const totalProducts = await Product.countDocuments()
    
    // Count products for this user
    const userProducts = await Product.countDocuments({ artistId: user._id })
    
    // Get first few products for this user
    const sampleProducts = await Product.find({ artistId: user._id }).limit(3).lean()
    
    return NextResponse.json({
      debug: {
        message: 'Debug info retrieved',
        user: {
          id: user._id,
          email: user.email,
          sellerStatus: user.sellerProfile?.applicationStatus || 'no seller profile'
        },
        database: {
          totalProducts,
          userProducts,
          sampleProducts: sampleProducts.map(p => ({
            id: p._id,
            name: p.name,
            artistId: p.artistId
          }))
        }
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}