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
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
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
          {/* Artisan Profile Card at the Top */}
          <div className="analytics-artisan-card">
            <div
              className="artisan-card-top"
              style={{ display: "flex", alignItems: "flex-start" }}
            >
              {/* Profile on the top left */}
              <img
                src={shopInfo.picture}
                alt={shopInfo.owner}
                className="profile-artisan-avatar"
              />
              {/* Shop info on right of avatar */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  marginLeft: "32px", // add spacing between avatar and info
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
                {/* Category, craft type tags */}
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
                {/* Shop location with icon */}
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
                {/* Shop description */}
                <div
                  style={{
                    margin: "14px 0 0 0",
                    color: "#2e3f36",
                    fontSize: "0.98rem",
                    fontWeight: 400,
                  }}
                >
                  {shopInfo.description}
                </div>
              </div>
            </div>
          </div>
          {/* TITLE & EXPORT BUTTONS */}
          <div
            className="dashboard-title-bar"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 24px",
              borderRadius: "5px",
              marginBottom: "0",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "27px",
                  color: "#af7928",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Shop Analytics
              </span>
            </div>
            <div>
              <button
                onClick={exportExcel}
                style={{
                  marginRight: "8px",
                  padding: "8px 16px",
                  background: "#af7928",
                  color: "#fff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Export Excel
              </button>
              <button
                onClick={exportPDF}
                style={{
                  padding: "8px 16px",
                  background: "#2e3f36",
                  color: "#fff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Export PDF
              </button>
            </div>
          </div>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #eee",
              margin: "0 0 18px 0",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "24px",
              marginBottom: "32px",
              alignItems: "stretch",
            }}
          >
            {/* LEFT CARDS */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  background: "#faf9f7",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px rgba(175,121,40,0.13)",
                  border: "1px solid #e5e1dc",
                  padding: "24px",
                  marginBottom: "24px",
                  maxHeight: "700px",
                  flex: "1 1 auto",
                }}
              >
                {/* FILTERS */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "18px",
                    justifyContent: "flex-end",
                  }}
                >
                  <select
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 500,
                    }}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    {dateOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                  <select
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 500,
                    }}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {/* SALES OVERVIEW REPORT */}
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "20px",
                    color: "#af7928",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaChartLine style={{ color: "#af7928", fontSize: "20px" }} />
                  Sales Overview Report
                </h3>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#2e3f36",
                    marginBottom: "8px",
                  }}
                >
                  Shows total sales over time (monthly). Sellers can track
                  revenue growth and identify peak sales periods.
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={salesOverviewData}>
                    <defs>
                      <linearGradient
                        id="colorSales"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#af7928"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#af7928"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#af7928"
                      fill="url(#colorSales)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginTop: "14px",
                  }}
                >
                  <b>
                    Sales spiked during the Sinulog Festival event week —
                    indicating cultural events drive higher sales.
                  </b>
                </div>
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #eee",
                    margin: "30px 0 16px 0",
                  }}
                />
                {/* PRODUCT RANKING REPORT */}
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "20px",
                    color: "#af7928",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCompass style={{ color: "#af7928", fontSize: "20px" }} />
                  Product Ranking Report
                </h3>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#2e3f36",
                    marginBottom: "14px",
                  }}
                >
                  Ranks products based on total units sold. Highlights
                  top-performing products for the selected time range and
                  category.
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={productRankingData}
                    layout="vertical"
                    margin={{ left: 40, right: 20, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="sold" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar
                      dataKey="sold"
                      fill="#af7928"
                      barSize={18}
                      radius={[8, 8, 8, 8]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginTop: "8px",
                  }}
                >
                  <b>
                    Handwoven baskets are the top sellers this month,
                    outperforming embroidered clothing.
                  </b>
                </div>
              </div>
            </div>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "stretch",
              }}
            >
              <div
                style={{
                  background: "#faf9f7",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px rgba(175,121,40,0.13)",
                  border: "1px solid #e5e1dc",
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3
                  style={{
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#af7928",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaBoxes style={{ color: "#af7928", fontSize: "20px" }} />
                  Stock Levels
                </h3>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#2e3f36",
                    marginBottom: "8px",
                  }}
                >
                  Displays stock levels of each product. Click a product to
                  update stock.
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    flex: "1 1 auto",
                    overflowY: "auto",
                  }}
                >
                  {stockLevelsData.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#fff",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        borderLeft: `6px solid ${
                          stockColor[
                            item.status === "Out" ? "Out" : item.status
                          ]
                        }`,
                        transition: "background 0.2s",
                      }}
                      onClick={() =>
                        (window.location.href = `/product/update-stock?name=${encodeURIComponent(
                          item.name
                        )}`)
                      }
                      title="Update Stock"
                    >
                      <span
                        style={{
                          fontWeight: 500,
                          fontFamily: "Poppins, sans-serif",
                        }}
                      >
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            stockColor[
                              item.status === "Out" ? "Out" : item.status
                            ],
                          fontFamily: "Poppins, sans-serif",
                        }}
                      >
                        {item.stock}{" "}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "#888",
                          }}
                        >
                          {item.status === "Sufficient"
                            ? "🟢"
                            : item.status === "Low"
                            ? "🟠"
                            : "🔴"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    marginTop: "8px",
                  }}
                >
                  <b>
                    Helps sellers manage inventory efficiently and prevent lost
                    sales.
                  </b>
                </div>
                {/* PRODUCT REVIEWS & RATINGS */}
                <div
                  style={{
                    marginTop: "32px",
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    padding: "16px",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "#af7928",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaStar style={{ color: "#af7928", fontSize: "20px" }} />
                    Product Reviews & Ratings
                  </h3>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#2e3f36",
                      marginBottom: "8px",
                    }}
                  >
                    Shows average rating per product based on star counts. No
                    comments are collected, only ratings.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {productReviewsData.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#faf9f7",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 500,
                            fontFamily: "Poppins, sans-serif",
                          }}
                        >
                          {item.name}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ color: "#af7928", fontWeight: 600 }}>
                            {item.avgRating.toFixed(1)}
                          </span>
                          <FaStar
                            style={{ color: "#ffc46b", fontSize: "16px" }}
                          />
                          <span style={{ color: "#888", fontSize: "13px" }}>
                            ({item.reviews} ratings)
                          </span>
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#45956a",
                            fontWeight: 500,
                          }}
                        >
                          {item.keywords.map((kw) => (
                            <span key={kw} style={{ marginRight: "6px" }}>
                              #{kw}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginTop: "8px",
                    }}
                  >
                    <b>
                      Understand customer satisfaction and improve product
                      quality.
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
