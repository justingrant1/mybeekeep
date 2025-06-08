import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Security token types
export type TokenType = 'access' | 'refresh' | 'csrf';

// Anti-CSRF token utilities
export function generateCSRFToken(): string {
  return uuidv4();
}

export function storeCSRFToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

export function getStoredCSRFToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

export function validateCSRFToken(token: string): boolean {
  const storedToken = getStoredCSRFToken();
  return storedToken === token;
}

// Session management utilities
export function invalidateAllSessions(supabase: SupabaseClient): Promise<any> {
  return supabase.auth.signOut(); // Sign out current session
}

export function invalidateUserSession(supabase: SupabaseClient): Promise<any> {
  // The regular signOut method without parameters will sign out the current session
  return supabase.auth.signOut();
}

// Data validation utilities
export function sanitizeInput(input: string): string {
  // Basic HTML sanitization
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isStrongPassword(password: string): { 
  isValid: boolean; 
  message: string; 
} {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  if (password.length < minLength) {
    return { 
      isValid: false, 
      message: `Password must be at least ${minLength} characters long.` 
    };
  }
  
  const requirements = [
    { condition: hasUpperCase, message: 'at least one uppercase letter' },
    { condition: hasLowerCase, message: 'at least one lowercase letter' },
    { condition: hasNumbers, message: 'at least one number' },
    { condition: hasSpecialChars, message: 'at least one special character' },
  ];
  
  const failedRequirements = requirements
    .filter(req => !req.condition)
    .map(req => req.message);
  
  if (failedRequirements.length > 0) {
    return {
      isValid: false,
      message: `Password must contain ${failedRequirements.join(', ')}.`
    };
  }
  
  return { isValid: true, message: 'Password is strong.' };
}

// Generate secure API keys
export function generateAPIKey(): string {
  return `bkp_${uuidv4().replace(/-/g, '')}_${Date.now().toString(36)}`;
}

// Rate limiting
export class RateLimiter {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  private limitPerMinute: number;
  private timeoutMinutes: number;
  
  constructor(limitPerMinute: number = 30, timeoutMinutes: number = 15) {
    this.limitPerMinute = limitPerMinute;
    this.timeoutMinutes = timeoutMinutes;
  }
  
  public attempt(key: string): boolean {
    this.cleanupExpired();
    
    const now = Date.now();
    const resetTime = now + this.timeoutMinutes * 60 * 1000;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, { count: 1, resetTime });
      return true;
    }
    
    const record = this.limits.get(key)!;
    
    // If timeout period is active
    if (record.count >= this.limitPerMinute) {
      return false;
    }
    
    // Increment the counter
    record.count += 1;
    this.limits.set(key, record);
    
    return true;
  }
  
  public resetForKey(key: string): void {
    this.limits.delete(key);
  }
  
  public getRemainingAttempts(key: string): number {
    if (!this.limits.has(key)) {
      return this.limitPerMinute;
    }
    
    const record = this.limits.get(key)!;
    return Math.max(0, this.limitPerMinute - record.count);
  }
  
  public getTimeUntilReset(key: string): number {
    if (!this.limits.has(key)) {
      return 0;
    }
    
    const record = this.limits.get(key)!;
    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }
  
  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, record] of this.limits.entries()) {
      if (record.resetTime < now) {
        this.limits.delete(key);
      }
    }
  }
}

// Create a singleton instance of the rate limiter
export const globalRateLimiter = new RateLimiter();

// Content Security Policy helper
export function applyCSPHeaders(): void {
  if (typeof document !== 'undefined') {
    // Set CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://*.supabase.co;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
      frame-src 'none';
    `.replace(/\s+/g, ' ').trim();
    
    document.head.appendChild(cspMeta);
  }
}

// Apply security-related HTTP headers in code (useful for development)
export function applySecurityHeaders(): void {
  if (typeof document !== 'undefined') {
    // These would typically be set at the server level,
    // but we're adding meta equivalents where possible for demonstration
    
    // X-Content-Type-Options
    const xContentTypeMeta = document.createElement('meta');
    xContentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    xContentTypeMeta.content = 'nosniff';
    document.head.appendChild(xContentTypeMeta);
    
    // X-Frame-Options
    const xFrameOptionsMeta = document.createElement('meta');
    xFrameOptionsMeta.httpEquiv = 'X-Frame-Options';
    xFrameOptionsMeta.content = 'DENY';
    document.head.appendChild(xFrameOptionsMeta);
    
    // Referrer-Policy
    const referrerPolicyMeta = document.createElement('meta');
    referrerPolicyMeta.name = 'referrer';
    referrerPolicyMeta.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerPolicyMeta);
  }
}

// Initialize all security features
export function initSecurity(): void {
  // Generate and store a CSRF token
  const csrfToken = generateCSRFToken();
  storeCSRFToken(csrfToken);
  
  // Apply security headers
  applyCSPHeaders();
  applySecurityHeaders();
  
  // Add other security initializations here
  console.log('Security features initialized');
}
