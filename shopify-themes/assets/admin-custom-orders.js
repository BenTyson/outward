/**
 * Admin Order Enhancement Script for Custom Map Glass Orders
 * Enhances Shopify admin order details with download links for production files
 */

(function() {
  'use strict';
  
  // Only run on order detail pages
  if (!window.location.pathname.includes('/admin/orders/')) {
    return;
  }
  
  console.log('Admin Custom Orders script loaded');
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
  } else {
    initializeEnhancements();
  }
  
  function initializeEnhancements() {
    console.log('Initializing custom order enhancements...');
    
    // Initial enhancement
    enhanceOrderDetails();
    
    // Watch for dynamic content changes (Shopify admin is single-page app)
    const observer = new MutationObserver((mutations) => {
      let shouldEnhance = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if order details were updated
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && (
                node.querySelector('.line-item') ||
                node.querySelector('[data-line-item-property]') ||
                node.classList.contains('line-item')
              )) {
                shouldEnhance = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldEnhance) {
        console.log('Order details updated, re-enhancing...');
        setTimeout(enhanceOrderDetails, 500); // Small delay to ensure content is fully loaded
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  function enhanceOrderDetails() {
    try {
      // Find all line items in the order
      const lineItems = document.querySelectorAll('.line-item, [data-testid="line-item"]');
      console.log(`Found ${lineItems.length} line items`);
      
      lineItems.forEach((lineItem, index) => {
        enhanceLineItem(lineItem, index);
      });
      
    } catch (error) {
      console.error('Error enhancing order details:', error);
    }
  }
  
  function enhanceLineItem(lineItem, index) {
    // Check if already enhanced
    if (lineItem.querySelector('.custom-map-files-panel')) {
      return;
    }
    
    // Find line item properties
    const properties = findLineItemProperties(lineItem);
    const customMapProps = extractCustomMapProperties(properties);
    
    if (Object.keys(customMapProps).length > 0) {
      console.log(`Found custom map properties in line item ${index + 1}:`, customMapProps);
      addCustomMapPanel(lineItem, customMapProps);
    }
  }
  
  function findLineItemProperties(lineItem) {
    const properties = {};
    
    // Multiple selectors for different admin layouts
    const propertySelectors = [
      '[data-line-item-property]',
      '.line-item-property',
      '[data-testid*="property"]',
      '.property'
    ];
    
    propertySelectors.forEach(selector => {
      const elements = lineItem.querySelectorAll(selector);
      elements.forEach(element => {
        const name = element.getAttribute('data-line-item-property') || 
                    element.getAttribute('data-property-name') ||
                    findPropertyName(element);
        
        const value = element.textContent?.trim() || 
                     element.getAttribute('data-property-value') ||
                     findPropertyValue(element);
        
        if (name && value) {
          properties[name] = value;
        }
      });
    });
    
    // Fallback: scan for text patterns that look like properties
    if (Object.keys(properties).length === 0) {
      scanForPropertyPatterns(lineItem, properties);
    }
    
    return properties;
  }
  
  function findPropertyName(element) {
    // Look for property name in nearby elements
    const prev = element.previousElementSibling;
    if (prev && prev.textContent?.includes(':')) {
      return prev.textContent.replace(':', '').trim();
    }
    
    // Check if element contains both name and value
    const text = element.textContent;
    if (text?.includes(':')) {
      return text.split(':')[0].trim();
    }
    
    return null;
  }
  
  function findPropertyValue(element) {
    const text = element.textContent;
    if (text?.includes(':')) {
      return text.split(':').slice(1).join(':').trim();
    }
    return text?.trim();
  }
  
  function scanForPropertyPatterns(lineItem, properties) {
    // Look for text patterns like "_custom_map_preview: https://..."
    const text = lineItem.textContent || '';
    const lines = text.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line.includes('_custom_map_') && line.includes(':')) {
        const [name, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (name && value) {
          properties[name.trim()] = value;
        }
      }
    });
  }
  
  function extractCustomMapProperties(properties) {
    const customMapProps = {};
    
    Object.entries(properties).forEach(([name, value]) => {
      if (name && name.startsWith('_custom_map_')) {
        const type = name.replace('_custom_map_', '');
        if (value && (value.startsWith('http') || value.startsWith('//'))) {
          customMapProps[type] = value;
        }
      }
    });
    
    return customMapProps;
  }
  
  function addCustomMapPanel(lineItem, props) {
    // Create the enhancement panel
    const panel = document.createElement('div');
    panel.className = 'custom-map-files-panel';
    panel.innerHTML = generatePanelHTML(props);
    
    // Find the best place to insert the panel
    const insertionPoint = findInsertionPoint(lineItem);
    
    if (insertionPoint) {
      insertionPoint.appendChild(panel);
      console.log('Added custom map panel to line item');
    } else {
      console.warn('Could not find insertion point for custom map panel');
    }
  }
  
  function findInsertionPoint(lineItem) {
    // Try different possible insertion points
    const candidates = [
      lineItem.querySelector('.line-item-details'),
      lineItem.querySelector('.line-item-content'),
      lineItem.querySelector('.line-item-body'),
      lineItem.querySelector('[data-testid="line-item-details"]'),
      lineItem
    ];
    
    return candidates.find(el => el !== null);
  }
  
  function generatePanelHTML(props) {
    const buttons = [];
    
    // Production file (highest priority)
    if (props.highres) {
      buttons.push(`
        <a href="${props.highres}" target="_blank" class="mgc-admin-btn mgc-admin-btn-primary">
          📥 Download Production File (High-Res)
        </a>
      `);
    }
    
    // 3D Model view
    if (props.model3d) {
      buttons.push(`
        <a href="${props.model3d}" target="_blank" class="mgc-admin-btn mgc-admin-btn-secondary">
          🎯 View 3D Model
        </a>
      `);
    }
    
    // Preview image
    if (props.preview) {
      buttons.push(`
        <a href="${props.preview}" target="_blank" class="mgc-admin-btn mgc-admin-btn-secondary">
          👁️ View Preview
        </a>
      `);
    }
    
    // Thumbnail for emails
    if (props.thumbnail) {
      buttons.push(`
        <a href="${props.thumbnail}" target="_blank" class="mgc-admin-btn mgc-admin-btn-secondary">
          🖼️ Email Thumbnail
        </a>
      `);
    }
    
    return `
      <div class="mgc-admin-section-header">
        <h3>🗺️ Custom Map Files</h3>
        <span class="mgc-admin-badge">Production Ready</span>
      </div>
      <div class="mgc-admin-actions">
        ${buttons.join('')}
      </div>
      <style>
        .custom-map-files-panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 16px;
          margin: 12px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .mgc-admin-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .mgc-admin-section-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .mgc-admin-badge {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .mgc-admin-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .mgc-admin-btn {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        
        .mgc-admin-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .mgc-admin-btn-primary {
          background: #007bff;
          color: white;
        }
        
        .mgc-admin-btn-primary:hover {
          background: #0056b3;
          color: white;
        }
        
        .mgc-admin-btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .mgc-admin-btn-secondary:hover {
          background: #545b62;
          color: white;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .mgc-admin-actions {
            flex-direction: column;
          }
          
          .mgc-admin-btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>
    `;
  }
  
  // Utility function to copy URLs to clipboard
  window.copyMapFileUrl = function(url, type) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showNotification(`${type} URL copied to clipboard!`, 'success');
      }).catch(() => {
        fallbackCopyTextToClipboard(url, type);
      });
    } else {
      fallbackCopyTextToClipboard(url, type);
    }
  };
  
  function fallbackCopyTextToClipboard(text, type) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    textArea.style.left = '-1000px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showNotification(`${type} URL copied to clipboard!`, 'success');
      } else {
        showNotification('Failed to copy URL', 'error');
      }
    } catch (err) {
      showNotification('Failed to copy URL', 'error');
    }
    
    document.body.removeChild(textArea);
  }
  
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `mgc-admin-notification mgc-admin-notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  console.log('Admin Custom Orders enhancement script initialized');
  
})();