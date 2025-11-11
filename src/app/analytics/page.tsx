"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  faUsers,
  faStar,
  faPerson,
} from "@fortawesome/free-solid-svg-icons";
import "./analytics.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  FaChartLine,
  FaMedal,
  FaCalendarDay,
  FaPuzzlePiece,
  FaCompass,
  FaBoxes,
  FaStar,
} from "react-icons/fa";

const mockSalesOverview = [
  { date: "2025-08", sales: 8000 },
  { date: "2025-09", sales: 12000 },
  { date: "2025-10", sales: 9500 },
  { date: "2025-11", sales: 16000 },
  { date: "2025-12", sales: 11000 },
];

const mockSalesTrend = [
  { date: "2025-09-01", sales: 1200, category: "Handicrafts" },
  { date: "2025-09-02", sales: 1500, category: "Fashion" },
  { date: "2025-09-03", sales: 1000, category: "Home" },
  { date: "2025-09-04", sales: 1800, category: "Food" },
  { date: "2025-09-05", sales: 2000, category: "Beauty & Wellness" },
];

const mockTopItems = [
  { name: "Acacia Plate", sales: 120, category: "Handicrafts" },
  { name: "Fedora Hat", sales: 90, category: "Fashion" },
  { name: "Salad Tosser", sales: 60, category: "Home" },
  { name: "Organic Jam", sales: 50, category: "Food" },
  { name: "Herbal Soap", sales: 40, category: "Beauty & Wellness" },
];

const mockDailyOrders = [
  { date: "2025-09-01", orders: 15, category: "Handicrafts" },
  { date: "2025-09-02", orders: 18, category: "Fashion" },
  { date: "2025-09-03", orders: 12, category: "Home" },
  { date: "2025-09-04", orders: 20, category: "Food" },
  { date: "2025-09-05", orders: 22, category: "Beauty & Wellness" },
];

const mockCategoryBreakdown = [
  { name: "Handicrafts", value: 300 },
  { name: "Fashion", value: 150 },
  { name: "Home", value: 100 },
  { name: "Food", value: 80 },
  { name: "Beauty & Wellness", value: 60 },
];

const mockProductRanking = [
  { name: "Handwoven Basket", sold: 180, category: "Handicrafts" },
  { name: "Embroidered Shirt", sold: 120, category: "Fashion" },
  { name: "Acacia Plate", sold: 90, category: "Handicrafts" },
  { name: "Fedora Hat", sold: 80, category: "Fashion" },
  { name: "Herbal Soap", sold: 60, category: "Beauty & Wellness" },
];

const mockStockLevels = [
  { name: "Handwoven Basket", stock: 25, status: "Sufficient" },
  { name: "Embroidered Shirt", stock: 5, status: "Low" },
  { name: "Acacia Plate", stock: 0, status: "Out" },
  { name: "Fedora Hat", stock: 12, status: "Sufficient" },
  { name: "Herbal Soap", stock: 2, status: "Low" },
];

const mockProductReviews = [
  {
    name: "Handwoven Basket",
    avgRating: 4.8,
    reviews: 120,
    keywords: ["durable", "beautiful", "local"],
  },
  {
    name: "Embroidered Shirt",
    avgRating: 4.2,
    reviews: 80,
    keywords: ["unique", "soft", "colorful"],
  },
  {
    name: "Acacia Plate",
    avgRating: 4.6,
    reviews: 60,
    keywords: ["eco-friendly", "sturdy"],
  },
  {
    name: "Fedora Hat",
    avgRating: 4.0,
    reviews: 40,
    keywords: ["stylish", "comfortable"],
  },
  {
    name: "Herbal Soap",
    avgRating: 4.7,
    reviews: 50,
    keywords: ["gentle", "fragrant"],
  },
];

const COLORS = ["#af7928", "#ffc46b", "#2e3f36", "#45956a", "#e74c3c"];

const categoryOptions = [
  "All Categories",
  "Handicrafts",
  "Fashion",
  "Home",
  "Food",
  "Beauty & Wellness",
];

const dateOptions = ["Last 7 days", "Last 30 days", "This Year"];

const stockColor: Record<string, string> = {
  Sufficient: "#45956a",
  Low: "#ffc46b",
  Out: "#e74c3c",
};

function filterByCategory(
  data: Array<{ category?: string; name?: string }>,
  category: string
) {
  if (category === "All Categories") return data;
  return data.filter(
    (item: { category?: string; name?: string }) =>
      item.category === category || item.name === category
  );
}

const shopInfo = {
  name: "Sinulog Handicrafts",
  owner: "Maria Santos",
  location: "Asinan",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=MariaSantos",
  description:
    "Authentic local crafts and festival products. Proudly Olongapenios.",
};

// Add mock data for Marketing Insights
const marketingStats = {
  totalCustomers: 142,
  newCustomers: 45,
  returningCustomers: 97,
  retentionRate: 68,
  averageRating: 4.8,
  totalReviews: 87,
};

const customerBreakdown = [
  { label: "New Customers", count: 45, percent: 32, color: "#2e3f36" },
  { label: "Returning Customers", count: 97, percent: 68, color: "#af7928" },
];

const engagementTrends = [
  { month: "Aug", visits: 120, inquiries: 30 },
  { month: "Sep", visits: 150, inquiries: 45 },
  { month: "Oct", visits: 170, inquiries: 60 },
  { month: "Nov", visits: 200, inquiries: 80 },
  { month: "Dec", visits: 220, inquiries: 90 },
  { month: "Jan", visits: 250, inquiries: 110 },
];

export default function AnalyticsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDate, setSelectedDate] = useState("Last 7 days");

  const salesData = filterByCategory(mockSalesTrend, selectedCategory);
  const topItemsData = filterByCategory(mockTopItems, selectedCategory);
  const dailyOrdersData = filterByCategory(mockDailyOrders, selectedCategory);
  const productRankingData = filterByCategory(
    mockProductRanking,
    selectedCategory
  );

  const categoryData = mockCategoryBreakdown;

  const salesOverviewData = mockSalesOverview;

  useEffect(() => {
    const interval = setInterval(() => {}, 60000);
    return () => clearInterval(interval);
  }, []);

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const wsOverview = XLSX.utils.json_to_sheet(salesOverviewData);
    const wsSales = XLSX.utils.json_to_sheet(salesData);
    const wsTop = XLSX.utils.json_to_sheet(topItemsData);
    XLSX.utils.book_append_sheet(workbook, wsOverview, "Sales Overview");
    XLSX.utils.book_append_sheet(workbook, wsSales, "Sales Trend");
    XLSX.utils.book_append_sheet(workbook, wsTop, "Top Items");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "analytics.xlsx"
    );
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Shop Analytics Dashboard", 10, 10);
    doc.text("Charts and data available in Excel.", 10, 20);
    doc.save("analytics.pdf");
  };

  const stockLevelsData =
    selectedCategory === "All Categories"
      ? mockStockLevels
      : mockStockLevels.filter(
          (item) => item.name === selectedCategory || item.status
        );

  const productReviewsData =
    selectedCategory === "All Categories"
      ? mockProductReviews
      : mockProductReviews.filter((item) => item.name === selectedCategory);

  return (
    <>
      <Navbar />
      <div className="analytics-page-wrapper">
        <div className="dashboard-card">
          {/* TITLE ON TOP */}
          <div
            className="dashboard-title-bar"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 10px",
              marginBottom: "0",
              justifyContent: "flex-start",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "2rem",
                color: "#2e3f36",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Shop Analytics
            </span>
          </div>
          {/* Artisan Profile Card */}
          <div className="analytics-artisan-card">
            <div
              className="artisan-card-top"
              style={{ display: "flex", alignItems: "flex-start" }}
            >
              <img
                src={shopInfo.picture}
                alt={shopInfo.owner}
                className="profile-artisan-avatar"
              />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  marginLeft: "32px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "18px",
                  }}
                >
                  <span className="shop-name">{shopInfo.name}</span>
                  <span className="artisan-name">{shopInfo.owner}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "10px 0 0 0",
                    gap: "5px",
                  }}
                >
                  <span className="analytics-category-type">Handicrafts</span>
                  <span className="analytics-craft-type">Weaving</span>
                </div>
                <div
                  style={{
                    margin: "12px 0 0 0",
                    color: "#888",
                    fontWeight: 400,
                    fontSize: "0.90rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    style={{ color: "#AF7928", fontSize: "1.1rem" }}
                  />
                  {shopInfo.location}
                </div>
              </div>
            </div>
          </div>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #eee",
              margin: "0 0 18px 0",
            }}
          />
        </div>
        <section className="sales-tracking-section">
          <h2 className="sales-tracking-title">
            <FontAwesomeIcon icon={faPesoSign} className="peso-symbol" /> Sales
            Tracking
          </h2>
          <div className="sales-tracking-grid">
            {/* Total Sales Card */}
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Total Sales</span>
              <span className="sales-tracking-card-value">
                ₱
                {mockSalesOverview
                  .reduce((sum, s) => sum + s.sales, 0)
                  .toLocaleString()}
              </span>
            </div>
            {/* Total Orders Card */}
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Total Orders</span>
              <span className="sales-tracking-card-value">
                {mockDailyOrders.reduce((sum, o) => sum + o.orders, 0)}
              </span>
            </div>
            {/* Average Sale Value Card */}
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">
                Average Sale Value
              </span>
              <span className="sales-tracking-card-value">
                ₱
                {(
                  mockSalesOverview.reduce((sum, s) => sum + s.sales, 0) /
                  mockDailyOrders.reduce((sum, o) => sum + o.orders, 0)
                ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            {/* Sales Growth Card */}
            <div className="sales-tracking-card">
              <span className="sales-tracking-card-title">Sales Growth</span>
              <span className="sales-tracking-card-value gold">
                {(() => {
                  const prev = mockSalesOverview[0].sales;
                  const last =
                    mockSalesOverview[mockSalesOverview.length - 1].sales;
                  const growth = ((last - prev) / prev) * 100;
                  return `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;
                })()}
              </span>
            </div>
          </div>
          {/* Charts Section */}
          <div className="sales-tracking-charts">
            <div className="chart-card">
              <h3>Sales Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockSalesOverview}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Sales (₱)"
                    stroke="#2e3f36"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#af7928"
                    strokeDasharray="5 5"
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Income Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockSalesOverview}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="sales"
                    name="Income (₱)"
                    fill="#2e3f36"
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Product Management Insights Section */}
        <section className="product-management-section">
          <h2 className="product-management-title">
            <FontAwesomeIcon icon={faBoxOpen} className="box-symbol" /> Product
            Management Insights
          </h2>
          <div className="product-management-grid">
            {/* Total Products Card */}
            <div className="product-management-card">
              <span className="product-management-card-title">
                Total Products
              </span>
              <span className="product-management-card-value">18</span>
              <span className="product-management-card-subtext">
                Active listings
              </span>
            </div>
            {/* Top Performer Card */}
            <div className="product-management-card">
              <span className="product-management-card-title">
                Top Performer
              </span>
              <span className="product-management-card-value">
                Rattan Basket
              </span>
              <span className="product-management-card-subtext">45 sold</span>
            </div>
            {/* Low Stock Alert Card */}
            <div className="product-management-card">
              <span className="product-management-card-title">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="warning-symbol"
                />{" "}
                Low Stock Alert
              </span>
              <span className="product-management-card-value low-stock">2</span>
              <span className="product-management-card-subtext">
                Products need restock
              </span>
            </div>
          </div>
          {/* Top-Selling & Needs Attention Cards */}
          <div className="product-insights-row">
            {/* Top-Selling Products Card */}
            <div className="product-insights-card">
              <h3 className="product-insights-card-title">
                Top-Selling Products
              </h3>
              <table className="top-selling-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rattan Basket</td>
                    <td>45</td>
                    <td>₱38,250</td>
                  </tr>
                  <tr>
                    <td>Textile Runner</td>
                    <td>38</td>
                    <td>₱95,000</td>
                  </tr>
                  <tr>
                    <td>Clay Pot Set</td>
                    <td>28</td>
                    <td>₱33,600</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Needs Attention Card */}
            <div className="product-insights-card">
              <h3 className="product-insights-card-title">Needs Attention</h3>
              <div className="needs-attention-section">
                {/* Low Stock Items */}
                <div className="needs-attention-subtitle">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="alert-icon"
                  />{" "}
                  Low Stock Items
                </div>
                <ul className="low-stock-list">
                  <li>
                    Clay Pot Set <span className="low-stock-badge">3 left</span>
                  </li>
                  <li>
                    Bamboo Tray <span className="low-stock-badge">2 left</span>
                  </li>
                </ul>
                {/* Least-Selling Products */}
                <div
                  className="needs-attention-subtitle"
                  style={{ marginTop: "18px" }}
                >
                  Least-Selling Products
                </div>
                <div className="least-selling-bars">
                  <div className="least-selling-bar">
                    <span className="least-selling-label">Bamboo Tray</span>
                    <div className="least-selling-bar-bg">
                      <div
                        className="least-selling-bar-fill"
                        style={{ width: "40%" }}
                      ></div>
                    </div>
                    <span className="least-selling-count">12 sales</span>
                  </div>
                  <div className="least-selling-bar">
                    <span className="least-selling-label">
                      Hand-carved Bowl
                    </span>
                    <div className="least-selling-bar-bg">
                      <div
                        className="least-selling-bar-fill"
                        style={{ width: "35%" }}
                      ></div>
                    </div>
                    <span className="least-selling-count">11 sales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marketing Insights Section */}
        <section className="marketing-insights-section">
          <h2 className="marketing-insights-title">
            <FontAwesomeIcon icon={faUser} className="person-icon" /> Marketing
            Insights
          </h2>
          <div className="marketing-insights-grid">
            <div className="marketing-card">
              <span className="marketing-card-title">Total Customers</span>
              <span className="marketing-card-value">
                {marketingStats.totalCustomers}
              </span>
              <span className="marketing-card-subtext">All time</span>
            </div>
            <div className="marketing-card">
              <span className="marketing-card-title">
                <FontAwesomeIcon
                  icon={faUserPlus}
                  className="add-person-icon"
                />{" "}
                New Customers
              </span>
              <span className="marketing-card-value gold">
                {marketingStats.newCustomers}
              </span>
              <span className="marketing-card-subtext">This month</span>
            </div>
            <div className="marketing-card">
              <span className="marketing-card-title">Returning Customers</span>
              <span className="marketing-card-value">
                {marketingStats.returningCustomers}
              </span>
              <span className="marketing-card-subtext">
                {marketingStats.retentionRate}% retention rate
              </span>
            </div>
            <div className="marketing-card">
              <span className="marketing-card-title">
                <FontAwesomeIcon icon={faStar} className="star-icon" /> Average
                Rating
              </span>
              <span className="marketing-card-value">
                {marketingStats.averageRating}
              </span>
              <span className="marketing-card-subtext">
                {marketingStats.totalReviews} reviews
              </span>
            </div>
          </div>
          <div className="marketing-insights-row">
            {/* Customer Breakdown Card */}
            <div className="marketing-insights-card">
              <h3 className="marketing-insights-card-title">
                Customer Breakdown
              </h3>
              <div className="customer-breakdown-bars">
                {customerBreakdown.map((item) => (
                  <div className="customer-breakdown-bar" key={item.label}>
                    <span className="customer-breakdown-label">
                      {item.label}
                    </span>
                    <div className="customer-breakdown-bar-bg">
                      <div
                        className="customer-breakdown-bar-fill"
                        style={{
                          width: `${item.percent}%`,
                          background: item.color,
                        }}
                      ></div>
                    </div>
                    <span className="customer-breakdown-count">
                      {item.count} ({item.percent}%)
                    </span>
                  </div>
                ))}
              </div>
              <div className="customer-breakdown-divider"></div>
              <div className="customer-breakdown-rating">
                <FontAwesomeIcon icon={faStar} className="star-icon" />{" "}
                <span className="customer-breakdown-rating-value">
                  {marketingStats.averageRating} / 5.0
                </span>{" "}
                <span className="customer-breakdown-rating-reviews">
                  based on {marketingStats.totalReviews} reviews
                </span>
              </div>
            </div>
            {/* Engagement Trends Card */}
            <div className="marketing-insights-card">
              <h3 className="marketing-insights-card-title">
                Engagement Trends
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={engagementTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    name="Profile Visits"
                    stroke="#af7928"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#af7928" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inquiries"
                    name="Inquiries"
                    stroke="#2e3f36"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#2e3f36" }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="engagement-legend">
                <span>
                  <span
                    className="legend-dot"
                    style={{ background: "#af7928" }}
                  ></span>{" "}
                  Profile Visits
                </span>
                <span>
                  <span
                    className="legend-dot"
                    style={{ background: "#2e3f36" }}
                  ></span>{" "}
                  Inquiries
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
