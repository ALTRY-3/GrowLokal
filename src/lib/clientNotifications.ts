"use client";

export const broadcastNotificationsUpdate = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("notifications:updated"));
};
