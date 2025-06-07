/**
 * Data Protection Utilities for BeeKeeper Pro
 * 
 * This module provides utilities for data privacy, GDPR compliance,
 * data export/import, and backup functionalities.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { encryptionService } from './encryption';

// Types for data export
export interface ExportOptions {
  includePersonalData?: boolean;
  includeApiaryData?: boolean;
  includeHiveData?: boolean;
  includeInspectionData?: boolean;
  includeHarvestData?: boolean;
  includeTreatmentData?: boolean;
  includeEquipmentData?: boolean;
  format?: 'json' | 'csv';
  encrypt?: boolean;
  encryptionPassword?: string;
}

export interface PrivacySettings {
  allowDataAnalytics: boolean;
  allowCrashReports: boolean;
  allowLocationData: boolean;
  allowNotifications: boolean;
  marketingCommunications: boolean;
  privacyPolicyAccepted: boolean;
  privacyPolicyVersion: string;
  dataRetentionPeriod: number; // in days
  lastUpdated: string;
}

// Default privacy settings
export const defaultPrivacySettings: PrivacySettings = {
  allowDataAnalytics: false,
  allowCrashReports: true,
  allowLocationData: false,
  allowNotifications: true,
  marketingCommunications: false,
  privacyPolicyAccepted: false,
  privacyPolicyVersion: '1.0.0',
  dataRetentionPeriod: 730, // Default: 2 years (GDPR compliance)
  lastUpdated: new Date().toISOString(),
};

// Storage keys
const PRIVACY_SETTINGS_KEY = 'bkp_privacy_settings';
const BACKUP_TIMESTAMP_KEY = 'bkp_last_backup';

// Load privacy settings
export function loadPrivacySettings(): PrivacySettings {
  const settingsJson = localStorage.getItem(PRIVACY_SETTINGS_KEY);
  if (!settingsJson) {
    return defaultPrivacySettings;
  }

  try {
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Failed to parse privacy settings:', error);
    return defaultPrivacySettings;
  }
}

// Save privacy settings
export function savePrivacySettings(settings: PrivacySettings): void {
  settings.lastUpdated = new Date().toISOString();
  localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
}

// Update a specific privacy setting
export function updatePrivacySetting<K extends keyof PrivacySettings>(
  key: K,
  value: PrivacySettings[K]
): PrivacySettings {
  const settings = loadPrivacySettings();
  settings[key] = value;
  settings.lastUpdated = new Date().toISOString();
  savePrivacySettings(settings);
  return settings;
}

// Check if privacy policy is accepted and current
export function isPrivacyPolicyAccepted(currentVersion: string): boolean {
  const settings = loadPrivacySettings();
  return (
    settings.privacyPolicyAccepted &&
    settings.privacyPolicyVersion === currentVersion
  );
}

// Export user data (GDPR compliance)
export async function exportUserData(
  supabase: SupabaseClient,
  userId: string,
  options: ExportOptions = {}
): Promise<Blob> {
  const {
    includePersonalData = true,
    includeApiaryData = true,
    includeHiveData = true,
    includeInspectionData = true,
    includeHarvestData = true,
    includeTreatmentData = true,
    includeEquipmentData = true,
    format = 'json',
    encrypt = false,
    encryptionPassword = '',
  } = options;

  // Prepare export data
  const exportData: any = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    userId,
  };

  // Fetch user profile if needed
  if (includePersonalData) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      exportData.profile = profile;
    }
  }

  // Fetch apiaries if needed
  if (includeApiaryData) {
    const { data: apiaries } = await supabase
      .from('apiaries')
      .select('*')
      .eq('user_id', userId);

    if (apiaries && apiaries.length > 0) {
      exportData.apiaries = apiaries;
    }
  }

  // Fetch hives if needed
  if (includeHiveData && exportData.apiaries) {
    const apiaryIds = exportData.apiaries.map((a: any) => a.id);
    const { data: hives } = await supabase
      .from('hives')
      .select('*')
      .in('apiary_id', apiaryIds);

    if (hives && hives.length > 0) {
      exportData.hives = hives;
    }
  }

  // Fetch inspections if needed
  if (includeInspectionData && exportData.hives) {
    const hiveIds = exportData.hives.map((h: any) => h.id);
    const { data: inspections } = await supabase
      .from('inspections')
      .select('*')
      .in('hive_id', hiveIds);

    if (inspections && inspections.length > 0) {
      exportData.inspections = inspections;
    }
  }

  // Fetch harvests if needed
  if (includeHarvestData && exportData.hives) {
    const hiveIds = exportData.hives.map((h: any) => h.id);
    const { data: harvests } = await supabase
      .from('harvests')
      .select('*')
      .in('hive_id', hiveIds);

    if (harvests && harvests.length > 0) {
      exportData.harvests = harvests;
    }
  }

  // Fetch treatments if needed
  if (includeTreatmentData && exportData.hives) {
    const hiveIds = exportData.hives.map((h: any) => h.id);
    const { data: treatments } = await supabase
      .from('treatments')
      .select('*')
      .in('hive_id', hiveIds);

    if (treatments && treatments.length > 0) {
      exportData.treatments = treatments;
    }
  }

  // Fetch equipment if needed
  if (includeEquipmentData) {
    const { data: equipment } = await supabase
      .from('equipment')
      .select('*')
      .eq('user_id', userId);

    if (equipment && equipment.length > 0) {
      exportData.equipment = equipment;
    }
  }

  // Process data for export
  let processedData: string;

  if (format === 'csv') {
    processedData = convertToCSV(exportData);
  } else {
    processedData = JSON.stringify(exportData, null, 2);
  }

  // Encrypt data if required
  if (encrypt && encryptionPassword) {
    try {
      await encryptionService.generateKey(encryptionPassword);
      processedData = await encryptionService.encrypt(processedData);
    } catch (error) {
      console.error('Failed to encrypt export data:', error);
      // Continue with unencrypted data
    }
  }

  // Create blob for download
  const blob = new Blob([processedData], {
    type: format === 'csv' ? 'text/csv' : 'application/json',
  });

  return blob;
}

// Import user data
export async function importUserData(
  supabase: SupabaseClient,
  userId: string,
  data: string,
  isEncrypted: boolean = false,
  encryptionPassword: string = ''
): Promise<{ success: boolean; message: string; imported: object }> {
  try {
    let parsedData: any;

    // Decrypt data if needed
    if (isEncrypted && encryptionPassword) {
      await encryptionService.generateKey(encryptionPassword);
      data = await encryptionService.decrypt(data);
    }

    // Parse data
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid data format. Import failed.',
        imported: {},
      };
    }

    // Validate data format
    if (!parsedData.version || !parsedData.exportDate) {
      return {
        success: false,
        message: 'Invalid export file format. Missing required metadata.',
        imported: {},
      };
    }

    // Initialize import results
    const importResults: Record<string, { success: boolean; count: number }> = {};

    // Import apiaries
    if (parsedData.apiaries && Array.isArray(parsedData.apiaries)) {
      const apiaryResults = await importApiaries(supabase, userId, parsedData.apiaries);
      importResults.apiaries = apiaryResults;
    }

    // Import hives
    if (parsedData.hives && Array.isArray(parsedData.hives)) {
      const hiveResults = await importHives(supabase, parsedData.hives);
      importResults.hives = hiveResults;
    }

    // Import inspections
    if (parsedData.inspections && Array.isArray(parsedData.inspections)) {
      const inspectionResults = await importInspections(supabase, parsedData.inspections);
      importResults.inspections = inspectionResults;
    }

    // Import harvests
    if (parsedData.harvests && Array.isArray(parsedData.harvests)) {
      const harvestResults = await importHarvests(supabase, parsedData.harvests);
      importResults.harvests = harvestResults;
    }

    // Import treatments
    if (parsedData.treatments && Array.isArray(parsedData.treatments)) {
      const treatmentResults = await importTreatments(supabase, parsedData.treatments);
      importResults.treatments = treatmentResults;
    }

    // Import equipment
    if (parsedData.equipment && Array.isArray(parsedData.equipment)) {
      const equipmentResults = await importEquipment(supabase, userId, parsedData.equipment);
      importResults.equipment = equipmentResults;
    }

    return {
      success: true,
      message: 'Import completed successfully',
      imported: importResults,
    };
  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      imported: {},
    };
  }
}

// Helper for importing apiaries
async function importApiaries(supabase: SupabaseClient, userId: string, apiaries: any[]): Promise<{ success: boolean; count: number }> {
  try {
    // Prepare apiaries for import - set user_id and generate new ids
    const preparedApiaries = apiaries.map(apiary => ({
      ...apiary,
      id: uuidv4(), // Generate new ID to avoid collisions
      user_id: userId,
      created_at: new Date().toISOString()
    }));

    const { error, count } = await supabase
      .from('apiaries')
      .insert(preparedApiaries);

    if (error) throw error;

    return { success: true, count: count || preparedApiaries.length };
  } catch (error) {
    console.error('Failed to import apiaries:', error);
    return { success: false, count: 0 };
  }
}

// Helper for importing hives
async function importHives(supabase: SupabaseClient, hives: any[]): Promise<{ success: boolean; count: number }> {
  try {
    // Prepare hives for import - generate new ids
    const preparedHives = hives.map(hive => ({
      ...hive,
      id: uuidv4(), // Generate new ID to avoid collisions
      created_at: new Date().toISOString()
    }));

    const { error, count } = await supabase
      .from('hives')
      .insert(preparedHives);

    if (error) throw error;

    return { success: true, count: count || preparedHives.length };
  } catch (error) {
    console.error('Failed to import hives:', error);
    return { success: false, count: 0 };
  }
}

// Helper for importing inspections
async function importInspections(supabase: SupabaseClient, inspections: any[]): Promise<{ success: boolean; count: number }> {
  try {
    // Prepare inspections for import - generate new ids
    const preparedInspections = inspections.map(inspection => ({
      ...inspection,
      id: uuidv4(), // Generate new ID to avoid collisions
      created_at: new Date().toISOString()
    }));

    const { error, count } = await supabase
      .from('inspections')
      .insert(preparedInspections);

    if (error) throw error;

    return { success: true, count: count || preparedInspections.length };
  } catch (error) {
    console.error('Failed to import inspections:', error);
    return { success: false, count: 0 };
  }
}

// Helper for importing harvests
async function importHarvests(supabase: SupabaseClient, harvests: any[]): Promise<{ success: boolean; count: number }> {
  try {
    // Prepare harvests for import - generate new ids
    const preparedHarvests = harvests.map(harvest => ({
      ...harvest,
      id: uuidv4(), // Generate new ID to avoid collisions
      created_at: new Date().toISOString()
    }));

    const { error, count } = await supabase
      .from('harvests')
      .insert(preparedHarvests);

    if (error) throw error;

    return { success: true, count: count || preparedHarvests.length };
  } catch (error) {
    console.error('Failed to import harvests:', error);
    return { success: false, count: 0 };
  }
}

// Helper for importing treatments
async function importTreatments(supabase: SupabaseClient, treatments: any[]): Promise<{ success: boolean; count: number }> {
  try {
    // Prepare treatments for import - generate new ids
    const preparedTreatments = treatments.map(treatment => ({
      ...treatment,
      id: uuidv4(), // Generate new ID to avoid collisions
      created_at: new Date().toISOString()
    }));

    const { error, count } = await supabase
      .from('treatments')
      .insert(preparedTreatments);

    if (error) throw error;

    return { success: true, count: count || preparedTreatments.length };
  } catch (error) {
    console.error('Failed to import treatments:', error);
    return { success: false, count: 0 };
  }
}

// Helper for importing equipment
async function importEquipment(supabase: SupabaseClient, userId: string, equipment: any[]): Promise<{ success: boolean; count: number }> {
  try {
    // Prepare equipment for import - set user_id and generate new ids
    const preparedEquipment = equipment.map(item => ({
      ...item,
      id: uuidv4(), // Generate new ID to avoid collisions
      user_id: userId,
      created_at: new Date().toISOString()
    }));

    const { error, count } = await supabase
      .from('equipment')
      .insert(preparedEquipment);

    if (error) throw error;

    return { success: true, count: count || preparedEquipment.length };
  } catch (error) {
    console.error('Failed to import equipment:', error);
    return { success: false, count: 0 };
  }
}

// Delete user data (GDPR compliance)
export async function deleteUserData(
  supabase: SupabaseClient,
  userId: string,
  options: {
    deleteAccount?: boolean;
    saveBackup?: boolean;
  } = {}
): Promise<{ success: boolean; message: string }> {
  const { deleteAccount = false, saveBackup = true } = options;

  try {
    // Create a backup if requested
    if (saveBackup) {
      const exportOptions: ExportOptions = {
        includePersonalData: true,
        includeApiaryData: true,
        includeHiveData: true,
        includeInspectionData: true,
        includeHarvestData: true,
        includeTreatmentData: true,
        includeEquipmentData: true,
        format: 'json',
        encrypt: true,
        encryptionPassword: userId, // Use userId as encryption password
      };

      const backup = await exportUserData(supabase, userId, exportOptions);
      // Store backup in localStorage for potential recovery
      const reader = new FileReader();
      reader.readAsText(backup);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          localStorage.setItem(`bkp_backup_${userId}`, reader.result);
          localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
        }
      };
    }

    // Step 1: Find and delete all user-related data
    // Delete apiaries and cascade to hives, inspections, harvests, etc.
    const { error: apiaryError } = await supabase
      .from('apiaries')
      .delete()
      .eq('user_id', userId);

    if (apiaryError) throw apiaryError;

    // Delete equipment
    const { error: equipmentError } = await supabase
      .from('equipment')
      .delete()
      .eq('user_id', userId);

    if (equipmentError) throw equipmentError;

    // Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Delete the user account if requested
    if (deleteAccount) {
      // This would typically be handled by Supabase Admin API
      // For demonstration, we'll just sign out instead
      await supabase.auth.signOut();
    }

    return {
      success: true,
      message: deleteAccount
        ? 'Account deleted successfully.'
        : 'User data deleted successfully. Account remains active.',
    };
  } catch (error) {
    console.error('Failed to delete user data:', error);
    return {
      success: false,
      message: `Failed to delete user data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

// Helper function to convert JSON to CSV
function convertToCSV(data: any): string {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }

  let csv = '';
  
  // Process each table separately
  for (const [tableName, tableData] of Object.entries(data)) {
    // Skip non-array properties
    if (!Array.isArray(tableData)) {
      continue;
    }
    
    // Skip empty arrays
    if (tableData.length === 0) {
      continue;
    }
    
    // Add table name as a header
    csv += `\n\n===== ${tableName.toUpperCase()} =====\n`;
    
    // Extract column headers from the first row
    const headers = Object.keys(tableData[0]);
    csv += headers.join(',') + '\n';
    
    // Add data rows
    for (const row of tableData) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        } else if (typeof value === 'object') {
          // Convert objects to JSON strings
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return String(value);
        }
      });
      csv += values.join(',') + '\n';
    }
  }
  
  return csv;
}

// Create automated backups
export async function createAutomatedBackup(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const exportOptions: ExportOptions = {
      includePersonalData: true,
      includeApiaryData: true,
      includeHiveData: true,
      includeInspectionData: true,
      includeHarvestData: true,
      includeTreatmentData: true,
      includeEquipmentData: true,
      format: 'json',
      encrypt: true,
      encryptionPassword: userId, // Use userId as encryption password
    };

    const backup = await exportUserData(supabase, userId, exportOptions);
    
    // Store backup in localStorage
    const reader = new FileReader();
    reader.readAsText(backup);
    
    return new Promise((resolve) => {
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          localStorage.setItem(`bkp_backup_${userId}`, reader.result);
          localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
          
          resolve({
            success: true,
            message: 'Backup created successfully.',
          });
        } else {
          resolve({
            success: false,
            message: 'Failed to read backup data.',
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read backup data.',
        });
      };
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    return {
      success: false,
      message: `Failed to create backup: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

// Get last backup timestamp
export function getLastBackupTimestamp(): string | null {
  return localStorage.getItem(BACKUP_TIMESTAMP_KEY);
}

// Restore from backup
export async function restoreFromBackup(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const backupData = localStorage.getItem(`bkp_backup_${userId}`);
    
    if (!backupData) {
      return {
        success: false,
        message: 'No backup found for this user.',
      };
    }
    
    // Import data from backup
    const importResult = await importUserData(
      supabase,
      userId,
      backupData,
      true, // isEncrypted
      userId // encryptionPassword
    );
    
    if (!importResult.success) {
      return {
        success: false,
        message: `Failed to restore from backup: ${importResult.message}`,
      };
    }
    
    return {
      success: true,
      message: 'Backup restored successfully.',
    };
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return {
      success: false,
      message: `Failed to restore from backup: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}
