import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// GET /api/seller/orders - Get orders for seller's products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get seller user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a seller (using isSeller field)
    if (!user.isSeller) {
      return NextResponse.json(
        { error: 'Seller access required. Please register as a seller first.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get seller's shop name from sellerProfile
    const sellerShopName = user.sellerProfile?.shopName;
    const sellerName = user.fullName || user.name;

    // Get seller's products - check multiple possible linkages
    const sellerProducts = await Product.find({ 
      $or: [
        { artistId: user._id },
        { seller: user._id },
        ...(sellerShopName ? [{ artistName: sellerShopName }] : []),
        ...(sellerName ? [{ artistName: sellerName }] : [])
      ]
    }).select('_id name');

    console.log('Seller orders debug:', {
      userId: user._id,
      email: user.email,
      shopName: sellerShopName,
      sellerName,
      productsFound: sellerProducts.length,
      productIds: sellerProducts.map(p => p._id.toString())
    });

    const sellerProductIds = sellerProducts.map(p => p._id.toString());
    const productNameMap = new Map(sellerProducts.map(p => [p._id.toString(), p.name]));

    if (sellerProductIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          totalOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          periodRevenue: 0
        },
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    // Find orders containing seller's products
    const orderQuery: Record<string, unknown> = {
      'items.productId': { $in: sellerProductIds.map(id => new (require('mongoose').Types.ObjectId)(id)) }
    };

    // Status filter
    if (status && status !== 'all') {
      orderQuery.status = status;
    }

    // Get all matching orders for summary
    const allSellerOrders = await Order.find(orderQuery).lean();
    
    // Calculate summary
    const summary = {
      totalOrders: allSellerOrders.length,
      pendingOrders: allSellerOrders.filter(o => o.status === 'pending').length,
      processingOrders: allSellerOrders.filter(o => o.status === 'processing').length,
      shippedOrders: allSellerOrders.filter(o => o.status === 'shipped').length,
      deliveredOrders: allSellerOrders.filter(o => o.status === 'delivered').length,
      cancelledOrders: allSellerOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: 0,
      periodRevenue: 0
    };

    // Calculate revenue from seller's items only
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    allSellerOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        const sellerItems = order.items.filter((item: { productId: { toString: () => string } }) => 
          sellerProductIds.includes(item.productId.toString())
        );
        const orderRevenue = sellerItems.reduce((sum: number, item: { price: number; quantity: number }) => 
          sum + (item.price * item.quantity), 0
        );
        summary.totalRevenue += orderRevenue;
        
        if (new Date(order.createdAt) >= thirtyDaysAgo) {
          summary.periodRevenue += orderRevenue;
        }
      }
    });

    // Sort configuration
    const sortConfig: Record<string, 1 | -1> = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch paginated orders
    let orders = await Order.find(orderQuery)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .lean();

    // Search filter (applied after fetch for flexibility)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => 
        order.orderId?.toLowerCase().includes(searchLower) ||
        order.shippingAddress?.fullName?.toLowerCase().includes(searchLower) ||
        order.items.some((item: { name?: string }) => item.name?.toLowerCase().includes(searchLower))
      );
    }

    // Transform orders to include only seller's items with additional info
    const transformedOrders = orders.map(order => {
      // Filter to only include seller's products
      const sellerItems = order.items.filter((item: { productId: { toString: () => string } }) => 
        sellerProductIds.includes(item.productId.toString())
      );
      
      // Calculate seller's portion of the order
      const sellerTotal = sellerItems.reduce((sum: number, item: { price: number; quantity: number }) => 
        sum + (item.price * item.quantity), 0
      );

      return {
        _id: order._id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        status: order.status,
        customer: {
          name: order.shippingAddress?.fullName || 'Guest',
          email: order.shippingAddress?.email || '',
          phone: order.shippingAddress?.phone || '',
        },
        shippingAddress: order.shippingAddress,
        items: sellerItems,
        itemCount: sellerItems.length,
        sellerTotal,
        orderTotal: order.total,
        paymentMethod: order.paymentDetails?.method || 'N/A',
        paymentStatus: order.paymentDetails?.status || 'pending',
        trackingNumber: order.trackingNumber,
        notes: order.notes,
      };
    });

    const total = await Order.countDocuments(orderQuery);

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/seller/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    
    if (!user || !user.isSeller) {
      return NextResponse.json(
        { error: 'Seller access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, status, trackingNumber, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find the order - support both MongoDB _id and readable orderId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = isValidObjectId 
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId: orderId });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get seller's shop name from sellerProfile
    const sellerShopName = user.sellerProfile?.shopName;
    const sellerName = user.fullName || user.name;

    // Verify seller owns products in this order
    const sellerProducts = await Product.find({ 
      $or: [
        { artistId: user._id },
        { seller: user._id },
        ...(sellerShopName ? [{ artistName: sellerShopName }] : []),
        ...(sellerName ? [{ artistName: sellerName }] : [])
      ]
    }).select('_id');

    const sellerProductIds = sellerProducts.map(p => p._id.toString());
    const hasSellerProducts = order.items.some((item: { productId: { toString: () => string } }) => 
      sellerProductIds.includes(item.productId.toString())
    );

    if (!hasSellerProducts) {
      return NextResponse.json(
        { error: 'You do not have permission to update this order' },
        { status: 403 }
      );
    }

    // Update order using the order's _id (not the readable orderId)
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedAt = new Date();

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,  // Use the actual MongoDB _id
      { $set: updateData },
      { new: true }
    ).lean();

    console.log('Order status updated:', {
      orderId: order.orderId,
      oldStatus: order.status,
      newStatus: status,
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
