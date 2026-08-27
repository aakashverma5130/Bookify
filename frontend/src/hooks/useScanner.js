import { useEffect, useRef, useCallback } from 'react';

/**
 * useScanner — captures fast keypress sequences ending in Enter,
 * mimicking how USB barcode/QR scanners work (keyboard emulation mode).
 *
 * @param {Function} onScan - Called with the scanned string when Enter is detected
 * @param {object}   options
 * @param {boolean}  [options.enabled=true]     - Whether the listener is active
 * @param {number}   [options.threshold=100]    - Max ms between characters to treat as scan
 * @param {number}   [options.minLength=4]      - Min characters to be considered a scan
 */
const useScanner = (onScan, { enabled = true, threshold = 100, minLength = 4 } = {}) => {
  const bufferRef   = useRef('');
  const lastKeyTime = useRef(0);

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    const now = Date.now();

    if (e.key === 'Enter') {
      const scanned = bufferRef.current.trim();
      if (scanned.length >= minLength) {
        onScan(scanned);
      }
      bufferRef.current = '';
      return;
    }

    // If too much time has passed, reset buffer (manual typing, not a scan)
    if (now - lastKeyTime.current > threshold && bufferRef.current.length > 0) {
      bufferRef.current = '';
    }

    // Only capture printable characters
    if (e.key.length === 1) {
      bufferRef.current += e.key;
      lastKeyTime.current = now;
    }
  }, [enabled, onScan, threshold, minLength]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useScanner;
