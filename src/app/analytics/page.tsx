"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faPesoSign,
  faBoxOpen,
  faExclamationTriangle,
  faUser,
  faUserPlus,
  faStar,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import "./analytics.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AnalyticsData {
  shopInfo: {
    name: string;
    owner: string;
    location: string;
    picture: string;
    category: string;
    craftType: string;
  };
  salesData: {
    totalSales: number;
    periodSales: number;
    totalOrders: number;
    periodOrders: number;
    averageSaleValue: number;
    salesGrowth: number;
    salesTrend: Array<{ date: string; sales: number; orders: number }>;
  };
  productStats: {
    totalProducts: number;
    topPerformer: { name: string; sold: number } | null;
    topSellingProducts: Array<{ name: string; sold: number; revenue: number }>;
    leastSellingProducts: Array<{ name: string; sold: number }>;
  };
  stockLevels: {
    lowStockCount: number;
    outOfStockCount: number;
    lowStockItems: Array<{ name: string; stock: number }>;
    outOfStockItems: Array<{ name: string }>;
  };
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
  };
  shopRating: {
    averageRating: number;
    totalReviews: number;
  };
}

const periodOptions = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3mo" },
  { label: "Last year", value: "1y" },
];

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/seller/analytics?period=" + selectedPeriod, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view your analytics");
        }
        throw new Error("Failed to fetch analytics data");
      }
      
      const result = await response.json();
      
      // Map the API response to the expected format
      if (result.success && result.data) {
        const apiData = result.data;
        const mappedData: AnalyticsData = {
          shopInfo: apiData.shopInfo || {
            name: "My Shop",
            owner: "Owner",
            location: "Location not set",
            picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
            category: "Artisan",
            craftType: "Handmade"
          },
          salesData: {
            totalSales: apiData.salesMetrics?.totalSales || 0,
            periodSales: apiData.salesMetrics?.periodSales || 0,
            totalOrders: apiData.salesMetrics?.totalOrders || 0,
            periodOrders: apiData.salesMetrics?.periodOrders || 0,
            averageSaleValue: apiData.salesMetrics?.averageOrderValue || 0,
            salesGrowth: apiData.salesMetrics?.salesGrowth || 0,
            salesTrend: apiData.salesTrend || []
          },
          productStats: {
            totalProducts: apiData.productMetrics?.totalProducts || 0,
            topPerformer: apiData.productMetrics?.topPerformer || null,
            topSellingProducts: apiData.topSellingProducts || [],
            leastSellingProducts: apiData.leastSellingProducts || []
          },
          stockLevels: {
            lowStockCount: apiData.productMetrics?.lowStockCount || 0,
            outOfStockCount: (apiData.stockLevels || []).filter((s: { status: string }) => s.status === 'Out').length,
            lowStockItems: (apiData.stockLevels || []).filter((s: { status: string }) => s.status === 'Low').map((s: { name: string; stock: number }) => ({ name: s.name, stock: s.stock })),
            outOfStockItems: (apiData.stockLevels || []).filter((s: { status: string }) => s.status === 'Out').map((s: { name: string }) => ({ name: s.name }))
          },
          customerMetrics: {
            totalCustomers: apiData.customerMetrics?.totalCustomers || 0,
            newCustomers: apiData.customerMetrics?.newCustomers || 0,
            returningCustomers: apiData.customerMetrics?.returningCustomers || 0,
            retentionRate: apiData.customerMetrics?.retentionRate || 0
          },
          shopRating: apiData.shopRating || {
            averageRating: 0,
            totalReviews: 0
          }
        };
        setAnalyticsData(mappedData);
      } else {
        throw new Error(result.error || "Failed to load analytics data");
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportExcel = () => {
    if (!analyticsData) return;
    
    const workbook = XLSX.utils.book_new();
    
    const salesSheet = XLSX.utils.json_to_sheet(analyticsData.salesData.salesTrend);
    XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales Trend");
    
    const productsSheet = XLSX.utils.json_to_sheet(analyticsData.productStats.topSellingProducts);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Top Products");
    
    const summaryData = [{
      "Total Sales": analyticsData.salesData.totalSales,
      "Period Sales": analyticsData.salesData.periodSales,
      "Total Orders": analyticsData.salesData.totalOrders,
      "Average Order Value": analyticsData.salesData.averageSaleValue,
      "Sales Growth": analyticsData.salesData.salesGrowth + "%",
      "Total Customers": analyticsData.customerMetrics.totalCustomers,
    }];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const today = new Date().toISOString().split("T")[0];
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "analytics_" + today + ".xlsx"
    );
  };

  const exportPDF = () => {
    if (!analyticsData) return;
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(analyticsData.shopInfo.name + " - Analytics Report", 10, 20);
    doc.setFontSize(12);
    doc.text("Generated: " + new Date().toLocaleDateString(), 10, 30);
    const periodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label || selectedPeriod;
    doc.text("Period: " + periodLabel, 10, 40);
    
    doc.setFontSize(14);
    doc.text("Sales Summary", 10, 55);
    doc.setFontSize(11);
    doc.text("Total Sales: P" + analyticsData.salesData.totalSales.toLocaleString(), 15, 65);
    doc.text("Period Sales: P" + analyticsData.salesData.periodSales.toLocaleString(), 15, 73);
    doc.text("Total Orders: " + analyticsData.salesData.totalOrders, 15, 81);
    doc.text("Sales Growth: " + analyticsData.salesData.salesGrowth + "%", 15, 89);
    
    doc.setFontSize(14);
    doc.text("Product Statistics", 10, 104);
    doc.setFontSize(11);
    doc.text("Total Products: " + analyticsData.productStats.totalProducts, 15, 114);
    if (analyticsData.productStats.topPerformer) {
      doc.text("Top Performer: " + analyticsData.productStats.topPerformer.name + " (" + analyticsData.productStats.topPerformer.sold + " sold)", 15, 122);
    }
    
    const today = new Date().toISOString().split("T")[0];
    doc.save("analytics_" + today + ".pdf");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="analytics-page-wrapper">
          <div className="analytics-loading">
            <div className="loading-spinner"></div>
            <p>Loading your analytics...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="analytics-page-wrapper">
          <div className="analytics-error">
            <h2>Unable to load analytics</h2>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!analyticsData) {
    return (
      <>
        <Navbar />
        <div className="analytics-page-wrapper">
          <div className="analytics-error">
            <h2>No data available</h2>
            <p>Start selling to see your analytics!</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const { shopInfo, salesData, productStats, stockLevels, customerMetrics, shopRating } = analyticsData;

  const getSalesGrowthClass = () => {
    return salesData.salesGrowth >= 0 ? "sales-tracking-card-value gold" : "sales-tracking-card-value negative";
  };

  return (
    <>
      <Navbar />
      <div className="analytics-page-wrapper">
        <div className="dashboard-card">
          <div className="dashboard-title-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 10px", marginBottom: "0" }}>
            <span style={{ fontWeight: 600, fontSize: "2rem", color: "#2e3f36", fontFamily: "Poppins, sans-serif" }}>
              Shop Analytics
            </span>
            <div className="analytics-controls">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="period-selector"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button onClick={fetchAnalytics} className="refresh-button" disabled={refreshing}>
                <FontAwesomeIcon icon={faSync} spin={refreshing} /> Refresh
              </button>
              <button onClick={exportExcel} className="export-button">
                Export Excel
              </button>
              <button onClick={exportPDF} className="export-button">
                Export PDF
              </button>
            </div>
          </div>

          <div className="analytics-artisan-card">
            <div className="artisan-card-top" style={{ display: "flex", alignItems: "flex-start" }}>
              <img src={shopInfo.picture} alt={shopInfo.owner} className="profile-artisan-avatar" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginLeft: "32px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "18px" }}>
                  <span className="shop-name">{shopInfo.name}</span>
                  <span className="artisan-name">{shopInfo.owner}</span>
                </div>
                <div className="shop-rating-container">
                  <FontAwesomeIcon icon={faStar} className="icon-stable shop-rating-star" />
                  <span className="shop-rating-value">
                    {shopRating.averageRating > 0 ? shopRating.averageRating.toFixed(1) : "No ratings yet"}
                  </span>
                  {shopRating.totalReviews > 0 && (
                    <span className="shop-rating-reviews">
                      ({shopRating.totalReviews} {shopRating.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", margin: "10px 0 0 0", gap: "5px" }}>
                  <span className="analytics-category-type">{shopInfo.category || "Artisan"}</span>
                  <span className="analytics-craft-type">{shopInfo.craftType || "Handmade"}</span>
                </div>
                <div style={{ margin: "12px 0 0 0", color: "#888", fontWeight: 400, fontSize: "0.90rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-stable" style={{ color: "#AF7928", fontSize: "1.1rem" }} />
                  {shopInfo.location || "Location not set"}
                </div>
              </div>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "0 0 18px 0" }} />
        </div>

        <section className="sales-tracking-section">
          <h2 className="sales-tracking-title">
            <FontAwesomeIcon icon={faPesoSign} className="peso-symbol" /> Sales Tracking
          </h2>
          <div className="sales-tracking-grid">
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Total Sales</span>
              <span className="sales-tracking-card-value">P{salesData.totalSales.toLocaleString()}</span>
            </div>
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Period Sales</span>
              <span className="sales-tracking-card-value">P{salesData.periodSales.toLocaleString()}</span>
            </div>
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Total Orders</span>
              <span className="sales-tracking-card-value">{salesData.totalOrders}</span>
            </div>
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Average Sale Value</span>
              <span className="sales-tracking-card-value">P{salesData.averageSaleValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Sales Growth</span>
              <span className={getSalesGrowthClass()}>
                {salesData.salesGrowth >= 0 ? "+" : ""}{salesData.salesGrowth.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="sales-tracking-charts">
            <div className="chart-card">
              <h3>Sales Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales (P)" stroke="#2e3f36" strokeWidth={3} dot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#af7928" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Income Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" name="Income (P)" fill="#2e3f36" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="product-management-section">
          <h2 className="product-management-title">
            <FontAwesomeIcon icon={faBoxOpen} className="box-symbol" /> Product Management Insights
          </h2>
          <div className="product-management-grid">
            <div className="product-management-card">
              <span className="product-management-card-title">Total Products</span>
              <span className="product-management-card-value">{productStats.totalProducts}</span>
              <span className="product-management-card-subtext">Active listings</span>
            </div>
            <div className="product-management-card">
              <span className="product-management-card-title">Top Performer</span>
              <span className="product-management-card-value">{productStats.topPerformer?.name || "N/A"}</span>
              <span className="product-management-card-subtext">
                {productStats.topPerformer ? productStats.topPerformer.sold + " sold" : "No sales yet"}
              </span>
            </div>
            <div className="product-management-card">
              <span className="product-management-card-title">
                <FontAwesomeIcon icon={faExclamationTriangle} className="warning-symbol" /> Low Stock Alert
              </span>
              <span className="product-management-card-value low-stock">{stockLevels.lowStockCount}</span>
              <span className="product-management-card-subtext">Products need restock</span>
            </div>
          </div>

          <div className="product-insights-row">
            <div className="product-insights-card">
              <h3 className="product-insights-card-title">Top-Selling Products</h3>
              <table className="top-selling-table">
                <thead>
                  <tr><th>Product</th><th>Sales</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {productStats.topSellingProducts.length > 0 ? (
                    productStats.topSellingProducts.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.sold}</td>
                        <td>P{product.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} style={{ textAlign: "center" }}>No sales data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="product-insights-card">
              <h3 className="product-insights-card-title">Needs Attention</h3>
              <div className="needs-attention-section">
                <div className="needs-attention-subtitle">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="alert-icon" /> Low Stock Items
                </div>
                <ul className="low-stock-list">
                  {stockLevels.lowStockItems.length > 0 ? (
                    stockLevels.lowStockItems.map((item, index) => (
                      <li key={index}>
                        {item.name} <span className="low-stock-badge">{item.stock} left</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: "#45956a" }}>All products well stocked!</li>
                  )}
                </ul>

                {stockLevels.outOfStockItems.length > 0 && (
                  <>
                    <div className="needs-attention-subtitle" style={{ marginTop: "18px", color: "#e74c3c" }}>
                      Out of Stock
                    </div>
                    <ul className="low-stock-list">
                      {stockLevels.outOfStockItems.map((item, index) => (
                        <li key={index} style={{ color: "#e74c3c" }}>{item.name}</li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="needs-attention-subtitle" style={{ marginTop: "18px" }}>Least-Selling Products</div>
                <div className="least-selling-bars">
                  {productStats.leastSellingProducts.length > 0 ? (
                    productStats.leastSellingProducts.map((product, index) => {
                      const widthPercent = Math.min(100, (product.sold / 10) * 100);
                      return (
                        <div className="least-selling-bar" key={index}>
                          <span className="least-selling-label">{product.name}</span>
                          <div className="least-selling-bar-bg">
                            <div className="least-selling-bar-fill" style={{ width: widthPercent + "%" }}></div>
                          </div>
                          <span className="least-selling-count">{product.sold} sales</span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: "#888" }}>No data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-insights-section">
          <h2 className="marketing-insights-title">
            <FontAwesomeIcon icon={faUser} className="person-icon" /> Marketing Insights
          </h2>
          <div className="marketing-insights-grid">
            <div className="marketing-card">
              <span className="marketing-card-title">Total Customers</span>
              <span className="marketing-card-value">{customerMetrics.totalCustomers}</span>
              <span className="marketing-card-subtext">All time</span>
            </div>
            <div className="marketing-card">
              <span className="marketing-card-title">
                <FontAwesomeIcon icon={faUserPlus} className="add-person-icon" /> New Customers
              </span>
              <span className="marketing-card-value gold">{customerMetrics.newCustomers}</span>
              <span className="marketing-card-subtext">This period</span>
            </div>
            <div className="marketing-card">
              <span className="marketing-card-title">Returning Customers</span>
              <span className="marketing-card-value">{customerMetrics.returningCustomers}</span>
              <span className="marketing-card-subtext">{customerMetrics.retentionRate.toFixed(0)}% retention rate</span>
            </div>
            <div className="marketing-card">
              <span className="marketing-card-title">
                <FontAwesomeIcon icon={faStar} className="star-icon" /> Average Rating
              </span>
              <span className="marketing-card-value">{shopRating.averageRating > 0 ? shopRating.averageRating.toFixed(1) : "N/A"}</span>
              <span className="marketing-card-subtext">{shopRating.totalReviews} reviews</span>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
