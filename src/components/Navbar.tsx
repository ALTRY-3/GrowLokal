"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaBell,
  FaShoppingCart,
  FaUserCircle,
  FaUser,
  FaShoppingBag,
  FaHeart,
  FaSignOutAlt,
  FaChevronRight,
  FaTrash,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./Navbar.module.css";
import type { NotificationDTO } from "@/types/notifications";

const PESO_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [notificationTab, setNotificationTab] = useState<
    "all" | "orders" | "activities"
  >("all");
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [userProfilePic, setUserProfilePic] = useState<string>(
    "/default-profile.jpg"
  );

  const { data: session } = useSession();
  const router = useRouter();
  const {
    items,
    subtotal,
    itemCount,
    fetchCart,
    removeItem,
    clearLocalCart,
    selectedItems,
    toggleSelectItem,
    selectAllItems,
    clearSelection,
    getSelectedItems,
    getSelectedSubtotal,
    getSelectedCount,
  } = useCartStore();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // Selection state
  const selectedCartItems = getSelectedItems();
  const selectedSubtotal = getSelectedSubtotal();
  const selectedCount = getSelectedCount();
  const allSelected = selectedCount === items.length && items.length > 0;

  // Fetch cart on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchCart();
    } else {
      clearLocalCart();
    }
  }, [session?.user, fetchCart, clearLocalCart]);

  // Fetch user profile picture
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            if (data.data?.profilePicture) {
              setUserProfilePic(data.data.profilePicture);
            } else if (session.user.image) {
              setUserProfilePic(session.user.image);
            }
          } else if (session.user.image) {
            setUserProfilePic(session.user.image);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          if (session.user.image) {
            setUserProfilePic(session.user.image);
          }
        }
      } else {
        setUserProfilePic("/default-profile.jpg");
      }
    };

    fetchUserProfile();
  }, [session?.user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCart(false);
      }
      // Close hamburger menu when clicking outside
      const subNavbar = document.querySelector(`.${styles.subNavbar}`);
      if (subNavbar && !subNavbar.contains(event.target as Node)) {
        setShowSubMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUnreadCount(data.data?.unreadCount ?? 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [session?.user]);

  const fetchNotifications = useCallback(
    async (withLoading = true) => {
      if (!session?.user) {
        setNotifications([]);
        setNotificationsError(null);
        return;
      }

      if (withLoading) {
        setNotificationsLoading(true);
      }

      try {
        const response = await fetch(
          `/api/notifications?limit=20&tab=${notificationTab}`,
          { cache: "no-store" }
        );
        const data: { success: boolean; data?: NotificationDTO[]; message?: string } =
          await response.json();

        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.message || "Failed to load notifications");
        }

        setNotifications(data.data);
        setNotificationsError(null);
        
        // Also refresh unread count
        fetchUnreadCount();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load notifications";
        setNotificationsError(message);
      } finally {
        if (withLoading) {
          setNotificationsLoading(false);
        }
      }
    },
    [session?.user, notificationTab, fetchUnreadCount]
  );

  // Initial fetch of unread count
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleUpdated = () => {
      fetchNotifications(false);
      fetchUnreadCount();
    };
    window.addEventListener("notifications:updated", handleUpdated);
    return () => window.removeEventListener("notifications:updated", handleUpdated);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }
    // Poll for unread count more frequently (every 30 seconds)
    const interval = window.setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [fetchUnreadCount, session?.user]);

  const formatNotificationTime = useCallback((value: string) => {
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
      return "";
    }

    const diffMs = Date.now() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) {
      return "Just now";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    return timestamp.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  }, []);

  const getNotificationDetail = useCallback((notification: NotificationDTO) => {
    if (notification.type === "order" && notification.metadata?.orderId) {
      const totalValue = notification.metadata?.total;
      const totalLabel =
        typeof totalValue === "number"
          ? ` · ${PESO_FORMATTER.format(totalValue)}`
          : "";
      return `Order #${notification.metadata.orderId}${totalLabel}`;
    }

    if (notification.type === "event") {
      if (notification.metadata?.eventDate) {
        return `${notification.metadata.eventDate}`;
      }
      if (notification.metadata?.eventLocation) {
        return `${notification.metadata.eventLocation}`;
      }
    }

    return undefined;
  }, []);

  const getNotificationTypeLabel = (type: NotificationDTO["type"]) => {
    switch (type) {
      case "order":
        return "Order";
      case "event":
        return "Event";
      default:
        return "Activity";
    }
  };

  const handleLogoutClick = () => {
    setShowProfile(false);
    setShowLogoutDialog(true);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (markingAsRead || unreadCount === 0) return;
    
    setMarkingAsRead(true);
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
      });
      
      if (response.ok) {
        // Update local state to mark all as read
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      
      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationToggle = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (!prev) {
        fetchNotifications();
      }
      return next;
    });
  };

  return (
    <div className={styles.marketplacePage}>
      <header className={styles.navbar}>
        <div className={styles.leftContent}>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <img
                src="/logo.svg"
                alt="GrowLokal Logo"
                className={styles.logoImage}
              />
            </div>
            <span className={styles.logoText}>GROWLOKAL</span>
          </div>
        </div>

        <div className={styles.rightContent}>
          <div className={styles.iconWrapper} ref={notifRef}>
            <FaBell
              className={styles.navIcon}
              onClick={handleNotificationToggle}
            />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {showNotifications && (
              <div
                className={`${styles.dropdown} ${styles.dropdownNotifications}`}
              >
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className={styles.unreadCountLabel}>
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <button 
                    className={styles.markAllReadBtn}
                    onClick={handleMarkAllAsRead}
                    disabled={markingAsRead || unreadCount === 0}
                  >
                    {markingAsRead ? "Marking..." : "Mark all as read"}
                  </button>
                </div>
                <div className={styles.notificationTabs}>
                  <button
                    className={`${styles.tab} ${
                      notificationTab === "all" ? styles.active : ""
                    }`}
                    onClick={() => setNotificationTab("all")}
                  >
                    All
                  </button>
                  <button
                    className={`${styles.tab} ${
                      notificationTab === "orders" ? styles.active : ""
                    }`}
                    onClick={() => setNotificationTab("orders")}
                  >
                    Orders
                  </button>
                  <button
                    className={`${styles.tab} ${
                      notificationTab === "activities" ? styles.active : ""
                    }`}
                    onClick={() => setNotificationTab("activities")}
                  >
                    Activities
                  </button>
                </div>
                <div className={styles.notificationList}>
                  {notificationsLoading ? (
                    <div className={styles.notificationState}>Loading recent activities...</div>
                  ) : notificationsError ? (
                    <div className={styles.notificationStateError}>{notificationsError}</div>
                  ) : notifications.length === 0 ? (
                    <div className={styles.notificationEmpty}>
                      <div className={styles.emptyIcon}>
                        <FaBell />
                      </div>
                      <p className={styles.emptyTitle}>No notifications yet</p>
                      <p className={styles.emptySubtitle}>
                        We&apos;ll notify you when something arrives
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const detail = getNotificationDetail(notification);
                      return (
                        <div 
                          className={`${styles.notificationItem} ${!notification.read ? styles.unread : ""}`} 
                          key={notification._id}
                          onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !notification.read) {
                              handleMarkAsRead(notification._id);
                            }
                          }}
                        >
                          {!notification.read && (
                            <span className={styles.unreadDot} aria-label="Unread notification" />
                          )}
                          <div className={styles.notificationItemContent}>
                            <div className={styles.notificationItemHeader}>
                              <span
                                className={`${styles.notificationTypeBadge} ${styles[notification.type] || ""}`}
                              >
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                              <span className={styles.notificationTimestamp}>
                                {formatNotificationTime(notification.createdAt)}
                              </span>
                            </div>
                            <div className={styles.notificationItemBody}>
                              <p className={styles.notificationItemTitle}>{notification.title}</p>
                              <p className={styles.notificationItemDescription}>
                                {notification.description}
                              </p>
                              {detail && (
                                <div className={styles.notificationMeta}>{detail}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.iconWrapper} ref={cartRef}>
            <FaShoppingCart
              className={styles.navIcon}
              onClick={() => setShowCart(!showCart)}
            />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
            {showCart && (
              <div className={`${styles.dropdown} ${styles.dropdownCart}`}>
                <div className={styles.cartHeader}>
                  <h3 className={styles.cartTitle}>Shopping Cart</h3>
                  <span className={styles.cartCount}>{itemCount} items</span>
                </div>

                {selectedCount > 0 && (
                  <div className={styles.cartSelectionInfo}>
                    <span>{selectedCount} selected</span>
                  </div>
                )}

                {items.length > 0 && (
                  <div className={styles.cartSelectionControls}>
                    <label className={styles.selectAllLabel}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => selectAllItems(e.target.checked)}
                        className={styles.selectAllCheckbox}
                      />
                      Select All
                    </label>
                    {selectedCount > 0 && (
                      <button
                        onClick={clearSelection}
                        className={styles.clearSelectionBtn}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}

                {items.length === 0 ? (
                  <div className={styles.emptyCartContainer}>
                    <div className={styles.emptyCartIcon}>
                      <FaShoppingCart />
                    </div>
                    <p className={styles.emptyCartTitle}>Your cart is empty</p>
                    <p className={styles.emptyCartSubtitle}>
                      Add items to get started
                    </p>
                    <button
                      className={styles.btnBrowse}
                      onClick={() => {
                        setShowCart(false);
                        router.push("/marketplace");
                      }}
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.cartItemsList}>
                      {items.map((item) => {
                        const isSelected = selectedItems.has(item.productId);
                        return (
                          <div
                            key={item.productId}
                            className={`${styles.cartItemCard} ${
                              isSelected ? styles.cartItemSelected : ""
                            }`}
                          >
                            <div className={styles.cartItemCheckboxWrapper}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleSelectItem(item.productId)
                                }
                                className={styles.cartItemCheckbox}
                              />
                            </div>
                            <div className={styles.cartItemImageWrapper}>
                              <img
                                src={item.image}
                                alt={item.name}
                                className={styles.cartItemImage}
                              />
                              <span className={styles.cartItemQuantityBadge}>
                                {item.quantity}
                              </span>
                            </div>
                            <div className={styles.cartItemDetails}>
                              <p className={styles.cartItemName}>{item.name}</p>
                              <div className={styles.cartItemMeta}>
                                <span className={styles.cartItemPrice}>
                                  ₱{item.price.toFixed(2)}
                                </span>
                                <span className={styles.cartItemSeparator}>
                                  ×
                                </span>
                                <span className={styles.cartItemQty}>
                                  {item.quantity}
                                </span>
                              </div>
                              <p className={styles.cartItemTotal}>
                                ₱{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className={styles.cartItemRemoveBtn}
                              title="Remove item"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.cartSummary}>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Selected</span>
                        <span className={styles.summaryValue}>
                          ₱{selectedSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Cart Total</span>
                        <span className={styles.summaryValue}>
                          ₱{subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Shipping</span>
                        <span
                          className={`${styles.summaryValue} ${styles.textFree}`}
                        >
                          FREE
                        </span>
                      </div>
                      <div
                        className={`${styles.summaryRow} ${styles.summaryTotal}`}
                      >
                        <span className={styles.summaryLabel}>Total</span>
                        <span className={styles.summaryValue}>
                          ₱{selectedSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cartActions}>
                      <button
                        className={styles.btnSecondary}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowCart(false);
                          router.push("/cart");
                        }}
                      >
                        View Full Cart
                      </button>
                      <button
                        className={styles.btnPrimary}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedCount === 0) {
                            alert("Please select items to checkout");
                            return;
                          }

                          // Store selected items for checkout
                          const selectedItemsData = selectedCartItems.map(
                            (item) => ({
                              productId: item.productId,
                              quantity: item.quantity,
                              price: item.price,
                            })
                          );

                          sessionStorage.setItem(
                            "checkoutItems",
                            JSON.stringify(selectedItemsData)
                          );
                          setShowCart(false);
                          setTimeout(() => {
                            router.push("/checkout");
                          }, 100);
                        }}
                        disabled={selectedCount === 0}
                      >
                        Checkout ({selectedCount})
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.iconWrapper} ref={profileRef}>
            <FaUserCircle
              className={styles.navIcon}
              onClick={() => setShowProfile(!showProfile)}
            />
            {showProfile && (
              <div className={`${styles.dropdown} ${styles.dropdownProfile}`}>
                <div className={styles.profileUserSection}>
                  <div className={styles.profileAvatar}>
                    <img
                      src={userProfilePic}
                      alt="Profile"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/default-profile.jpg";
                      }}
                    />
                  </div>
                  <div className={styles.profileUserInfo}>
                    <p className={styles.profileUserName}>
                      {session?.user?.name || "User"}
                    </p>
                    <p className={styles.profileUserEmail}>
                      {session?.user?.email || ""}
                    </p>
                  </div>
                </div>

                <nav className={styles.profileMenuNav}>
                  <button
                    className={styles.profileMenuItem}
                    onClick={() => {
                      setShowProfile(false);
                      router.push("/profile?section=profile");
                    }}
                  >
                    <FaUser className={styles.menuIcon} />
                    <span className={styles.menuText}>My Account</span>
                    <FaChevronRight className={styles.menuArrow} />
                  </button>

                  <button
                    className={styles.profileMenuItem}
                    onClick={() => {
                      setShowProfile(false);
                      router.push("/profile?section=orders");
                    }}
                  >
                    <FaShoppingBag className={styles.menuIcon} />
                    <span className={styles.menuText}>My Orders</span>
                    <FaChevronRight className={styles.menuArrow} />
                  </button>

                  <button
                    className={styles.profileMenuItem}
                    onClick={() => {
                      setShowProfile(false);
                      router.push("/profile?section=wishlist");
                    }}
                  >
                    <FaHeart className={styles.menuIcon} />
                    <span className={styles.menuText}>Wishlist</span>
                    <FaChevronRight className={styles.menuArrow} />
                  </button>
                </nav>

                <div className={styles.profileLogoutSection}>
                  <button
                    className={styles.profileLogoutBtn}
                    onClick={handleLogoutClick}
                  >
                    <FaSignOutAlt className={styles.logoutIcon} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className={styles.subNavbar}>
        <button
          className={styles.subMenuToggle}
          onClick={() => setShowSubMenu(!showSubMenu)}
          aria-label="Toggle menu"
        >
          {showSubMenu ? <FaTimes /> : <FaBars />}
        </button>
        <ul
          className={`${styles.subNavLinks} ${
            showSubMenu ? styles.subNavLinksOpen : ""
          }`}
        >
          <li>
            <Link href="/home" onClick={() => setShowSubMenu(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/marketplace" onClick={() => setShowSubMenu(false)}>
              Marketplace
            </Link>
          </li>
          <li>
            <Link href="/stories" onClick={() => setShowSubMenu(false)}>
              Stories
            </Link>
          </li>
          <li>
            <Link href="/events" onClick={() => setShowSubMenu(false)}>
              Events
            </Link>
          </li>
          <li>
            <Link href="/map" onClick={() => setShowSubMenu(false)}>
              Map
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.navStrip}>
        <img
          src="/left-panel.svg"
          alt="Decorative strip"
          className={styles.navStripImage}
        />
      </div>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will be redirected to the login page."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
