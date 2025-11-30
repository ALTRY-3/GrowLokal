"use client";

import React from "react";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="confirm-dialog-backdrop" onClick={onCancel} />
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <h2>{title}</h2>
        </div>
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button
            className="confirm-dialog-btn cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className="confirm-dialog-btn confirm-btn"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Logging out...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </>
  );
}
