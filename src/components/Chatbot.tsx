"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import "./chatbot.css";

// Helper to format time as HH:MM
function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Message {
  sender: string;
  text: string;
  time: string;
  products?: any[];
  orders?: any[];
  quickActions?: QuickAction[];
}

interface QuickAction {
  label: string;
  action: 'navigate' | 'view_product' | 'view_order' | 'search';
  path?: string;
  productId?: string;
  orderId?: string;
  query?: string;
}

export default function Chatbot() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hiddenRoutes = [
    "/login",
    "/signup",
    "/reset-password",
    "/forgot-password",
    "/otp-verification",
    "/map",
    "/checkout",
    "/cart",
  ];

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  // Show intro message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Kumusta! 👋 I'm KaLokal, your friendly shopping assistant! 😊\n\nI'm here to help you discover amazing handmade products from local Filipino artisans. Whether you're looking for unique gifts, home decor, or something special, I've got you covered!\n\nHow can I help you today?",
          time: formatTime(new Date()),
          quickActions: [
            { label: "🛍️ Browse Products", action: "navigate", path: "/marketplace" },
            { label: "📦 Track My Orders", action: "navigate", path: "/orders" },
            { label: "❤️ View Wishlist", action: "navigate", path: "/wishlist" },
            { label: "🎨 Become a Seller", action: "navigate", path: "/profile?tab=seller" },
          ],
        },
      ]);
    }
  }, [isOpen]);

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  // Handle quick action clicks
  const handleQuickAction = (action: QuickAction) => {
    if (action.action === 'navigate' && action.path) {
      router.push(action.path);
      setIsOpen(false);
    } else if (action.action === 'view_product' && action.productId) {
      router.push(`/marketplace?product=${action.productId}`);
      setIsOpen(false);
    } else if (action.action === 'view_order' && action.orderId) {
      router.push(`/orders`);
      setIsOpen(false);
    } else if (action.action === 'search' && action.query) {
      setInput(action.query);
    }
  };

  // Handle sending user message with AI
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const now = formatTime(new Date());
    const newMessage: Message = { sender: "user", text: input, time: now };
    setMessages((prev) => [...prev, newMessage]);
    const userMessage = input;
    setInput("");
    setBotTyping(true);
    setError(null);

    try {
      // Call chatbot API
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          sender: "bot",
          text: data.data.response,
          time: formatTime(new Date()),
          products: data.data.products,
          orders: data.data.orders,
          quickActions: data.data.quickActions,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chatbot error:', error);
      setError('Sorry, I encountered an error. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or browse our marketplace directly!",
          time: formatTime(new Date()),
          quickActions: [
            { label: "Browse Marketplace", action: "navigate", path: "/marketplace" },
          ],
        },
      ]);
    } finally {
      setBotTyping(false);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Floating button when closed */}
      {!isOpen && (
        <button
          className="chatbot-button"
          aria-label="Open chatbot"
          onClick={() => setIsOpen(true)}
        >
          <span className="chatbot-pulse" />
          <span className="chatbot-dots-icon">
            <i className="fas fa-comment-dots"></i>
          </span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window chatbot-window-animate">
          {/* Header with branding */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <img
                  src="/chatbotpfp.png"
                  alt="KaLokal"
                  className="chatbot-avatar-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://ui-avatars.com/api/?name=KaLokal&background=2e3f36&color=ffc46b&rounded=true";
                  }}
                />
              </div>
              <div className="chatbot-title">KaLokal</div>
            </div>
            <button
              className="chatbot-close"
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`chatbot-message ${msg.sender}`}
                  tabIndex={0}
                  aria-label={`${msg.sender === "user" ? "You" : "KaLokal"}: ${msg.text}`}
                >
                  <span className="chatbot-message-text" style={{ whiteSpace: 'pre-line' }}>
                    {msg.text}
                  </span>
                  <span className="chatbot-message-time">{msg.time}</span>
                </div>

                {/* Product suggestions */}
                {msg.products && msg.products.length > 0 && (
                  <div className="chatbot-products">
                    {msg.products.map((product, pidx) => (
                      <div
                        key={pidx}
                        className="chatbot-product-card"
                        onClick={() => handleQuickAction({ action: 'view_product', productId: product._id, label: '' })}
                      >
                        <img src={product.thumbnailUrl || product.images[0]} alt={product.name} />
                        <div className="product-info">
                          <h4>{product.name}</h4>
                          <p className="product-artist">{product.artistName}</p>
                          <p className="product-price">₱{product.price.toFixed(2)}</p>
                          {product.averageRating > 0 && (
                            <p className="product-rating">★ {product.averageRating.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order information */}
                {msg.orders && msg.orders.length > 0 && (
                  <div className="chatbot-orders">
                    {msg.orders.map((order, oidx) => (
                      <div
                        key={oidx}
                        className="chatbot-order-card"
                        onClick={() => handleQuickAction({ action: 'view_order', orderId: order._id, label: '' })}
                      >
                        <div className="order-info">
                          <h4>Order {order.orderId}</h4>
                          <p className="order-status">{order.status}</p>
                          <p className="order-total">₱{order.total.toFixed(2)}</p>
                          <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick action buttons */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="chatbot-quick-actions">
                    {msg.quickActions.map((action, aidx) => (
                      <button
                        key={aidx}
                        className="quick-action-btn"
                        onClick={() => handleQuickAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bot typing indicator */}
            {botTyping && (
              <div className="chatbot-message bot chatbot-typing">
                <span className="chatbot-message-text">
                  <span className="typing-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>{" "}
                  typing...
                </span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="chatbot-error">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              aria-label="Type your message"
            />
            <button
              onClick={handleSend}
              className="chatbot-send"
              aria-label="Send message"
              disabled={!input.trim() || botTyping}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
