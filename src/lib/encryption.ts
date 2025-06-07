/**
 * Encryption utilities for BeeKeeper Pro
 * 
 * This module provides utilities for encrypting and decrypting sensitive data
 * before storing it in the database or local storage.
 */

// Simple implementation using Web Crypto API
export class DataEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256; // bits
  private static readonly SALT_LENGTH = 16; // bytes
  private static readonly IV_LENGTH = 12; // bytes
  private static readonly ENC_KEY_STORAGE_KEY = 'bkp_encryption_key';
  
  private _key: CryptoKey | null = null;
  
  // Generate a secure encryption key
  public async generateKey(password: string, salt?: Uint8Array): Promise<CryptoKey> {
    // Generate a random salt if not provided
    const useSalt = salt || window.crypto.getRandomValues(new Uint8Array(DataEncryption.SALT_LENGTH));
    
    // Save the salt in sessionStorage
    if (!salt) {
      sessionStorage.setItem('bkp_encryption_salt', this.arrayBufferToBase64(useSalt));
    }
    
    // Derive a key from the password using PBKDF2
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive the actual encryption key
    this._key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: useSalt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: DataEncryption.ALGORITHM, length: DataEncryption.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
    
    return this._key;
  }
  
  // Encrypt data
  public async encrypt(data: string): Promise<string> {
    if (!this._key) {
      throw new Error('Encryption key not set. Call generateKey() first.');
    }
    
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(DataEncryption.IV_LENGTH));
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: DataEncryption.ALGORITHM,
        iv,
      },
      this._key,
      new TextEncoder().encode(data)
    );
    
    // Combine IV and encrypted data into a single array
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to Base64 for storage
    return this.arrayBufferToBase64(result);
  }
  
  // Decrypt data
  public async decrypt(encryptedData: string): Promise<string> {
    if (!this._key) {
      throw new Error('Encryption key not set. Call generateKey() first.');
    }
    
    // Convert from Base64
    const data = this.base64ToArrayBuffer(encryptedData);
    
    // Extract the IV from the beginning of the data
    const iv = data.slice(0, DataEncryption.IV_LENGTH);
    const ciphertext = data.slice(DataEncryption.IV_LENGTH);
    
    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: DataEncryption.ALGORITHM,
        iv,
      },
      this._key,
      ciphertext
    );
    
    // Convert back to string
    return new TextDecoder().decode(decryptedData);
  }
  
  // Store the encryption key securely
  public async storeEncryptionKey(): Promise<boolean> {
    if (!this._key) {
      throw new Error('Encryption key not set. Call generateKey() first.');
    }
    
    try {
      // Export the key to raw format
      const exportedKey = await window.crypto.subtle.exportKey('raw', this._key);
      
      // Convert to Base64 for storage
      const keyString = this.arrayBufferToBase64(exportedKey);
      
      // Store in sessionStorage (more secure than localStorage)
      sessionStorage.setItem(DataEncryption.ENC_KEY_STORAGE_KEY, keyString);
      
      return true;
    } catch (error) {
      console.error('Failed to store encryption key:', error);
      return false;
    }
  }
  
  // Load a previously stored encryption key
  public async loadEncryptionKey(): Promise<boolean> {
    try {
      // Retrieve from sessionStorage
      const keyString = sessionStorage.getItem(DataEncryption.ENC_KEY_STORAGE_KEY);
      
      if (!keyString) {
        return false;
      }
      
      // Convert from Base64
      const keyData = this.base64ToArrayBuffer(keyString);
      
      // Import the key
      this._key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: DataEncryption.ALGORITHM, length: DataEncryption.KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      );
      
      return true;
    } catch (error) {
      console.error('Failed to load encryption key:', error);
      return false;
    }
  }
  
  // Convert ArrayBuffer to Base64 string
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  // Convert Base64 string to ArrayBuffer
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

// Create a singleton instance
export const encryptionService = new DataEncryption();

// Utility for generating safe password reset tokens
export function generatePasswordResetToken(): string {
  const randomData = window.crypto.getRandomValues(new Uint8Array(32));
  
  // Convert to Base64, remove padding and special characters
  let token = btoa(String.fromCharCode.apply(null, Array.from(randomData)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Add a timestamp to prevent indefinite use
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return `${token}.${expires}`;
}

// Utility for validating password reset tokens
export function validatePasswordResetToken(token: string): boolean {
  // Check if the token has the expected format
  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  
  // Check if the token has expired
  const expires = parseInt(parts[1], 10);
  if (isNaN(expires) || expires < Date.now()) {
    return false;
  }
  
  return true;
}

// Utility to securely hash sensitive data
export async function secureHash(data: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Hash the data using SHA-256
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert hash to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility for encrypting app settings or user preferences
export async function encryptAppSettings(settings: object, password: string): Promise<string> {
  await encryptionService.generateKey(password);
  const settingsStr = JSON.stringify(settings);
  return encryptionService.encrypt(settingsStr);
}

// Utility for decrypting app settings or user preferences
export async function decryptAppSettings(encryptedSettings: string, password: string): Promise<object> {
  await encryptionService.generateKey(password);
  const settingsStr = await encryptionService.decrypt(encryptedSettings);
  return JSON.parse(settingsStr);
}
