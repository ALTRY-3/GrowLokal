"use client";

import React, { useState } from 'react';

interface OCRValidationProps {
  file: File | null;
  onValidationComplete: (result: OCRValidationResult) => void;
  onValidationStart: () => void;
}

export interface OCRValidationResult {
  success: boolean;
  isValidId: boolean;
  detectedIdType?: string;
  confidence: number;
  errors: string[];
  warnings: string[];
  imageHash?: string;
}

export default function OCRValidation({ file, onValidationComplete, onValidationStart }: OCRValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<OCRValidationResult | null>(null);

  const performOCRValidation = async () => {
    if (!file) {
      onValidationComplete({
        success: false,
        isValidId: false,
        confidence: 0,
        errors: ['No file selected'],
        warnings: []
      });
      return;
    }

    setIsValidating(true);
    onValidationStart();

    try {
      const formData = new FormData();
      formData.append('idDocument', file);

      const response = await fetch('/api/ocr/validate-id', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      const validationResult: OCRValidationResult = {
        success: result.success,
        isValidId: result.validation?.isValidId || false,
        detectedIdType: result.validation?.detectedIdType,
        confidence: result.validation?.confidence || 0,
        errors: result.errors || [],
        warnings: result.warnings || [],
        imageHash: result.validation?.imageHash
      };

      setValidationResult(validationResult);
      onValidationComplete(validationResult);

    } catch (error) {
      const errorResult: OCRValidationResult = {
        success: false,
        isValidId: false,
        confidence: 0,
        errors: ['OCR validation failed. Please try again.'],
        warnings: []
      };

      setValidationResult(errorResult);
      onValidationComplete(errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = () => {
    if (isValidating) return '⏳';
    if (!validationResult) return '❓';
    if (validationResult.success && validationResult.isValidId) return '✅';
    return '❌';
  };

  const getStatusText = () => {
    if (isValidating) return 'Processing document with OCR technology...';
    if (!validationResult) return 'Ready to validate your ID document';
    if (validationResult.success && validationResult.isValidId) {
      return `Verification complete - ${validationResult.detectedIdType || 'Government ID'} recognized`;
    }
    return 'Document verification failed - please upload a valid ID';
  };

  const getStatusColor = () => {
    if (isValidating) return '#ffa500';
    if (!validationResult) return '#6b7280';
    if (validationResult.success && validationResult.isValidId) return '#10b981';
    return '#ef4444';
  };

  return (
    <div style={{ marginTop: '15px', padding: '20px', border: '2px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>📄 ID Document Verification</h4>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
        <span style={{ fontSize: '18px' }}>{getStatusIcon()}</span>
        <span style={{ fontSize: '14px', color: getStatusColor(), fontWeight: '500' }}>
          {getStatusText()}
        </span>
      </div>

      {/* Submit/Validate Button */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <button
          type="button"
          onClick={performOCRValidation}
          disabled={!file || isValidating}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: file && !isValidating ? '#3b82f6' : '#9ca3af',
            color: 'white',
            cursor: file && !isValidating ? 'pointer' : 'not-allowed',
            boxShadow: file && !isValidating ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.2s ease-in-out',
            minWidth: '150px'
          }}
        >
          {isValidating ? '⏳ Validating...' : '📋 Submit & Validate ID'}
        </button>
      </div>

      {!file && (
        <div style={{ 
          textAlign: 'center', 
          padding: '12px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '6px', 
          border: '1px solid #f59e0b' 
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontStyle: 'italic' }}>
            📌 Please upload an ID document first to enable validation
          </p>
        </div>
      )}

      {validationResult && validationResult.errors.length > 0 && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '6px', 
          border: '1px solid #ef4444' 
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>❌ Issues found:</p>
          <ul style={{ margin: '0', paddingLeft: '16px' }}>
            {validationResult.errors.map((error, index) => (
              <li key={index} style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validationResult && validationResult.warnings.length > 0 && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '12px', 
          backgroundColor: '#fffbeb', 
          borderRadius: '6px', 
          border: '1px solid #f59e0b' 
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#d97706', fontWeight: '600' }}>⚠️ Suggestions:</p>
          <ul style={{ margin: '0', paddingLeft: '16px' }}>
            {validationResult.warnings.map((warning, index) => (
              <li key={index} style={{ fontSize: '12px', color: '#d97706', marginBottom: '4px' }}>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validationResult && validationResult.success && validationResult.isValidId && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ecfdf5', 
          borderRadius: '6px', 
          border: '1px solid #10b981',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#059669', fontWeight: '600' }}>
            ✅ ID Successfully Verified! 
            {validationResult.detectedIdType && (
              <span style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
                Detected: {validationResult.detectedIdType} ({validationResult.confidence}% confidence)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}