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

    // Get user and verify seller status
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      console.log('User not found for email:', session.user.email)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('User found:', user.email, 'Seller status:', user.sellerProfile?.applicationStatus)

    if (user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Seller approval required', status: user.sellerProfile?.applicationStatus },
        { status: 403 }
      )
    }

    // Fetch all products for this seller
    const products = await Product.find({ artistId: user._id })
      .sort({ createdAt: -1 }) // Most recent first
      .lean()

    console.log('Found products for user:', user._id, 'Count:', products.length)

    // Transform products to match frontend expectations
    const formattedProducts = products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      images: product.images || [],
      thumbnailUrl: product.thumbnailUrl,
      isActive: product.isActive !== false, // Default to true if not set
      isAvailable: product.isAvailable !== false, // Default to true if not set
      artistId: product.artistId?.toString(),
      artistName: product.artistName,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }))

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length
    })

  } catch (error) {
    console.error('Error fetching seller products:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}