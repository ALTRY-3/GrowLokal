import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/products/[id] - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id).select('-__v');

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch product',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (requires seller authentication)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Seller approval required' },
        { status: 403 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find product and verify ownership
    const product = await Product.findOne({
      _id: id,
      artistId: user._id
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...body,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update product',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Partially update product (requires seller authentication)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user and verify seller status
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Seller approval required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find product and verify ownership
    const product = await Product.findOne({
      _id: id,
      artistId: user._id
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    const updateData = await request.json();

    // Update product with only provided fields
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        ...updatedProduct,
        _id: updatedProduct._id.toString(),
        artistId: updatedProduct.artistId?.toString()
      }
    });

  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to update product',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (requires seller authentication)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user and verify seller status
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Seller approval required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find product and verify ownership
    const product = await Product.findOne({
      _id: id,
      artistId: user._id
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found or access denied' },
        { status: 404 }
      );
    }

    // Hard delete the product
    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete product',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
