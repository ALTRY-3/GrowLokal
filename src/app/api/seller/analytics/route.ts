import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

interface OrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
}

interface OrderDocument {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  paymentDetails?: {
    status: string;
  };
}

interface ProductDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  viewCount: number;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user and verify seller status
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.sellerProfile?.applicationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Seller approval required' },
        { status: 403 }
      );
    }

    const sellerId = user._id;

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Fetch all products for this seller
    const products = await Product.find({ artistId: sellerId }).lean() as ProductDocument[];

    // Get all product IDs for this seller
    const productIds = products.map(p => p._id);

    // Fetch all orders that contain products from this seller
    const allOrders = await Order.find({
      'items.productId': { $in: productIds },
      status: { $ne: 'cancelled' }
    }).lean() as OrderDocument[];

    // Filter order items to only include this seller's products
    const sellerOrders = allOrders.map(order => {
      const sellerItems = order.items.filter(item => 
        productIds.some(pid => pid.toString() === item.productId.toString())
      );
      return {
        ...order,
        items: sellerItems,
        sellerTotal: sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
    });

    // Recent orders (within period)
    const recentOrders = sellerOrders.filter(order => 
      new Date(order.createdAt) >= startDate
    );

    // Calculate sales metrics
    const totalSales = sellerOrders.reduce((sum, order) => sum + order.sellerTotal, 0);
    const periodSales = recentOrders.reduce((sum, order) => sum + order.sellerTotal, 0);
    const totalOrders = sellerOrders.length;
    const periodOrders = recentOrders.length;

    // Calculate previous period for growth comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    const prevPeriodOrders = sellerOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= prevStartDate && orderDate < startDate;
    });
    const prevPeriodSales = prevPeriodOrders.reduce((sum, order) => sum + order.sellerTotal, 0);

    // Sales growth calculation
    const salesGrowth = prevPeriodSales > 0 
      ? ((periodSales - prevPeriodSales) / prevPeriodSales) * 100 
      : periodSales > 0 ? 100 : 0;

    // Average order value
    const averageOrderValue = periodOrders > 0 ? periodSales / periodOrders : 0;

    // Sales trend by date (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesByMonth: Record<string, { sales: number; orders: number }> = {};
    sellerOrders
      .filter(order => new Date(order.createdAt) >= sixMonthsAgo)
      .forEach(order => {
        const monthKey = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = { sales: 0, orders: 0 };
        }
        salesByMonth[monthKey].sales += order.sellerTotal;
        salesByMonth[monthKey].orders += 1;
      });

    const salesTrend = Object.entries(salesByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        sales: Math.round(data.sales * 100) / 100,
        orders: data.orders
      }));

    // Top selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
    sellerOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            category: products.find(p => p._id.toString() === productId)?.category || 'Unknown'
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.price * item.quantity;
      });
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const leastSellingProducts = Object.values(productSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 3);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    products.forEach(product => {
      const cat = product.category.charAt(0).toUpperCase() + product.category.slice(1);
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = 0;
      }
      categoryBreakdown[cat] += 1;
    });

    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
      name: name === 'Beauty' ? 'Beauty & Wellness' : name,
      value
    }));

    // Sales by category
    const salesByCategory: Record<string, number> = {};
    sellerOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.productId.toString());
        if (product) {
          const cat = product.category.charAt(0).toUpperCase() + product.category.slice(1);
          const catName = cat === 'Beauty' ? 'Beauty & Wellness' : cat;
          if (!salesByCategory[catName]) {
            salesByCategory[catName] = 0;
          }
          salesByCategory[catName] += item.price * item.quantity;
        }
      });
    });

    const salesByCategoryData = Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }));

    // Stock levels
    const stockLevels = products.map(product => ({
      name: product.name,
      stock: product.stock,
      status: product.stock === 0 ? 'Out' : product.stock <= 5 ? 'Low' : 'Sufficient'
    }));

    const lowStockProducts = stockLevels.filter(p => p.status === 'Low' || p.status === 'Out');
    const lowStockCount = lowStockProducts.length;

    // Product reviews summary
    const productReviews = products
      .filter(p => p.totalReviews > 0)
      .map(product => ({
        name: product.name,
        avgRating: product.averageRating,
        reviews: product.totalReviews
      }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 5);

    // Overall rating
    const totalReviews = products.reduce((sum, p) => sum + p.totalReviews, 0);
    const weightedRating = products.reduce((sum, p) => sum + (p.averageRating * p.totalReviews), 0);
    const averageRating = totalReviews > 0 ? Math.round((weightedRating / totalReviews) * 10) / 10 : 0;

    // Customer metrics (unique buyers)
    const uniqueCustomers = new Set(sellerOrders.map(order => order.userId));
    const recentCustomers = new Set(recentOrders.map(order => order.userId));
    
    // Returning customers (bought more than once)
    const customerOrderCounts: Record<string, number> = {};
    sellerOrders.forEach(order => {
      customerOrderCounts[order.userId] = (customerOrderCounts[order.userId] || 0) + 1;
    });
    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = uniqueCustomers.size - returningCustomers;
    const retentionRate = uniqueCustomers.size > 0 
      ? Math.round((returningCustomers / uniqueCustomers.size) * 100) 
      : 0;

    // Engagement trends (using view counts as proxy)
    const totalViews = products.reduce((sum, p) => sum + (p.viewCount || 0), 0);

    // Shop info
    const shopInfo = {
      name: user.sellerProfile?.shopName || user.name,
      owner: user.fullName || user.name,
      location: user.sellerProfile?.pickupAddress?.barangay || user.address?.barangay || 'Not specified',
      picture: user.profilePicture || user.image || '',
      description: user.sellerProfile?.shopDescription || ''
    };

    // Daily orders for the period
    const dailyOrders: Record<string, number> = {};
    recentOrders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().slice(0, 10);
      dailyOrders[dateKey] = (dailyOrders[dateKey] || 0) + 1;
    });

    const dailyOrdersData = Object.entries(dailyOrders)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, orders]) => ({ date, orders }));

    // Top performer
    const topPerformer = topSellingProducts.length > 0 
      ? { name: topSellingProducts[0].name, sold: topSellingProducts[0].quantity }
      : { name: 'No sales yet', sold: 0 };

    return NextResponse.json({
      success: true,
      data: {
        // Shop info
        shopInfo,
        shopRating: {
          averageRating,
          totalReviews
        },

        // Sales tracking
        salesMetrics: {
          totalSales: Math.round(totalSales * 100) / 100,
          periodSales: Math.round(periodSales * 100) / 100,
          totalOrders,
          periodOrders,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          salesGrowth: Math.round(salesGrowth * 10) / 10
        },
        salesTrend,
        dailyOrders: dailyOrdersData,

        // Product management
        productMetrics: {
          totalProducts: products.length,
          activeProducts: products.filter(p => p.isActive !== false).length,
          lowStockCount,
          topPerformer
        },
        topSellingProducts,
        leastSellingProducts,
        stockLevels,
        categoryBreakdown: categoryData,
        salesByCategory: salesByCategoryData,
        productReviews,

        // Marketing insights
        customerMetrics: {
          totalCustomers: uniqueCustomers.size,
          newCustomers,
          returningCustomers,
          retentionRate,
          totalViews
        },
        
        // Metadata
        period: periodDays,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
