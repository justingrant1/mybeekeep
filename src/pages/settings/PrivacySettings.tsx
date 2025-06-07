import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Snackbar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PrivacySettings as PrivacySettingsType,
  loadPrivacySettings,
  savePrivacySettings,
  updatePrivacySetting,
  exportUserData,
  importUserData,
  deleteUserData,
  createAutomatedBackup,
  restoreFromBackup,
  getLastBackupTimestamp,
  ExportOptions,
} from '../../lib/dataProtection';

const PrivacySettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettingsType>(loadPrivacySettings());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmPasswordDialogOpen, setConfirmPasswordDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includePersonalData: true,
    includeApiaryData: true,
    includeHiveData: true,
    includeInspectionData: true,
    includeHarvestData: true,
    includeTreatmentData: true,
    includeEquipmentData: true,
    format: 'json',
    encrypt: false,
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImportEncrypted, setIsImportEncrypted] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState(settings.dataRetentionPeriod.toString());
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  
  // Load privacy settings and last backup date on mount
  useEffect(() => {
    setSettings(loadPrivacySettings());
    const backupTimestamp = getLastBackupTimestamp();
    setLastBackupDate(backupTimestamp);
  }, []);
  
  // Handle toggle changes
  const handleToggleChange = (setting: keyof PrivacySettingsType) => (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    const updatedSettings = updatePrivacySetting(setting, checked);
    setSettings(updatedSettings);
    setSuccess('Settings updated successfully');
  };
  
  // Handle data retention period change
  const handleRetentionPeriodChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setRetentionPeriod(value);
    const updatedSettings = updatePrivacySetting(
      'dataRetentionPeriod',
      parseInt(value, 10)
    );
    setSettings(updatedSettings);
    setSuccess('Data retention period updated');
  };
  
  // Handle export options change
  const handleExportOptionChange = (option: keyof ExportOptions) => (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };
  
  const handleExportFormatChange = (event: SelectChangeEvent) => {
    setExportOptions(prev => ({
      ...prev,
      format: event.target.value as 'json' | 'csv'
    }));
  };
  
  // Handle export data
  const handleExport = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // If encryption is enabled, require a password
      if (exportOptions.encrypt && (!password || password.length < 8)) {
        setError('Please provide a strong password for encryption (at least 8 characters)');
        setLoading(false);
        return;
      }
      
      const finalExportOptions: ExportOptions = {
        ...exportOptions,
        encryptionPassword: exportOptions.encrypt ? password : undefined
      };
      
      const blob = await exportUserData(supabase, user.id, finalExportOptions);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beekeeper-pro-export-${new Date().toISOString().slice(0, 10)}.${finalExportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Data exported successfully');
      handleCloseExportDialog();
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle import data
  const handleImport = async () => {
    if (!user || !importFile) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // If the import is encrypted, require a password
      if (isImportEncrypted && !password) {
        setError('Please provide the password used to encrypt this file');
        setLoading(false);
        return;
      }
      
      // Read the file
      const fileContent = await readFileAsText(importFile);
      
      // Import the data
      const result = await importUserData(
        supabase,
        user.id,
        fileContent,
        isImportEncrypted,
        password
      );
      
      if (result.success) {
        setSuccess(`Import completed successfully: ${JSON.stringify(result.imported)}`);
        handleCloseImportDialog();
      } else {
        setError(`Import failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete data
  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Confirm deletion with "delete my data" text
      if (confirmationText.toLowerCase() !== 'delete my data') {
        setError('Please type "delete my data" to confirm');
        setLoading(false);
        return;
      }
      
      const result = await deleteUserData(supabase, user.id, {
        deleteAccount,
        saveBackup: true
      });
      
      if (result.success) {
        setSuccess(result.message);
        handleCloseDeleteDialog();
        
        // If account was deleted, redirect to login
        if (deleteAccount) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setError(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle create backup
  const handleCreateBackup = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await createAutomatedBackup(supabase, user.id);
      
      if (result.success) {
        setSuccess(result.message);
        setLastBackupDate(new Date().toISOString());
        handleCloseBackupDialog();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Backup failed:', error);
      setError(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle restore from backup
  const handleRestoreFromBackup = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Confirm restore with "restore my data" text
      if (confirmationText.toLowerCase() !== 'restore my data') {
        setError('Please type "restore my data" to confirm');
        setLoading(false);
        return;
      }
      
      const result = await restoreFromBackup(supabase, user.id);
      
      if (result.success) {
        setSuccess(result.message);
        handleCloseRestoreDialog();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Restore failed:', error);
      setError(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsText(file);
    });
  };
  
  // Dialog open/close handlers
  const handleOpenExportDialog = () => setExportDialogOpen(true);
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
    setPassword('');
    setError(null);
  };
  
  const handleOpenImportDialog = () => setImportDialogOpen(true);
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setIsImportEncrypted(false);
    setPassword('');
    setError(null);
  };
  
  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteAccount(false);
    setConfirmationText('');
    setError(null);
  };
  
  const handleOpenBackupDialog = () => setBackupDialogOpen(true);
  const handleCloseBackupDialog = () => {
    setBackupDialogOpen(false);
    setError(null);
  };
  
  const handleOpenRestoreDialog = () => setRestoreDialogOpen(true);
  const handleCloseRestoreDialog = () => {
    setRestoreDialogOpen(false);
    setConfirmationText('');
    setError(null);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImportFile(event.target.files[0]);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Privacy & Data Settings
      </Typography>
      
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Privacy Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Control how your data is used and what information is collected.
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.allowDataAnalytics}
                onChange={handleToggleChange('allowDataAnalytics')}
              />
            }
            label="Allow anonymous usage data collection"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
            Help us improve by sending anonymous usage statistics
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.allowCrashReports}
                onChange={handleToggleChange('allowCrashReports')}
              />
            }
            label="Allow crash reports"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
            Send crash reports to help us fix issues
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.allowLocationData}
                onChange={handleToggleChange('allowLocationData')}
              />
            }
            label="Allow location data"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
            Use your location to provide weather data and local recommendations
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.allowNotifications}
                onChange={handleToggleChange('allowNotifications')}
              />
            }
            label="Allow notifications"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
            Receive notifications about your apiaries and hives
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.marketingCommunications}
                onChange={handleToggleChange('marketingCommunications')}
              />
            }
            label="Marketing communications"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, pl: 4 }}>
            Receive updates about new features and offers
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="retention-period-label">Data Retention Period</InputLabel>
              <Select
                labelId="retention-period-label"
                value={retentionPeriod}
                label="Data Retention Period"
                onChange={handleRetentionPeriodChange}
              >
                <MenuItem value="30">30 days</MenuItem>
                <MenuItem value="90">90 days</MenuItem>
                <MenuItem value="180">6 months</MenuItem>
                <MenuItem value="365">1 year</MenuItem>
                <MenuItem value="730">2 years</MenuItem>
                <MenuItem value="1825">5 years</MenuItem>
                <MenuItem value="3650">10 years</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              How long we retain your data after your account becomes inactive
            </Typography>
          </Box>
        </FormGroup>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Export, import, or delete your data.
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleOpenExportDialog}
          >
            Export My Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={handleOpenImportDialog}
          >
            Import Data
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleOpenDeleteDialog}
          >
            Delete My Data
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Backups
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Manage your data backups.
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Last Backup: <strong>{formatDate(lastBackupDate)}</strong>
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={handleOpenBackupDialog}
          >
            Create Backup
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleOpenRestoreDialog}
            disabled={!lastBackupDate}
          >
            Restore from Backup
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Privacy Policy & Terms
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Privacy Policy Version: <strong>{settings.privacyPolicyVersion}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Last Updated: <strong>{formatDate(settings.lastUpdated)}</strong>
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            component={Link}
            to="/privacy-policy"
            variant="text"
          >
            View Privacy Policy
          </Button>
          <Button
            component={Link}
            to="/terms-of-service"
            variant="text"
          >
            View Terms of Service
          </Button>
        </Box>
      </Paper>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={handleCloseExportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            Select what data you want to export and in what format.
          </DialogContentText>
          
          <Typography variant="subtitle2" gutterBottom>
            Data to Export:
          </Typography>
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includePersonalData}
                  onChange={handleExportOptionChange('includePersonalData')}
                />
              }
              label="Personal Data"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeApiaryData}
                  onChange={handleExportOptionChange('includeApiaryData')}
                />
              }
              label="Apiaries"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeHiveData}
                  onChange={handleExportOptionChange('includeHiveData')}
                />
              }
              label="Hives"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeInspectionData}
                  onChange={handleExportOptionChange('includeInspectionData')}
                />
              }
              label="Inspections"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeHarvestData}
                  onChange={handleExportOptionChange('includeHarvestData')}
                />
              }
              label="Harvests"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeTreatmentData}
                  onChange={handleExportOptionChange('includeTreatmentData')}
                />
              }
              label="Treatments"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={exportOptions.includeEquipmentData}
                  onChange={handleExportOptionChange('includeEquipmentData')}
                />
              }
              label="Equipment"
            />
          </FormGroup>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Export Format:
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="export-format-label">Format</InputLabel>
            <Select
              labelId="export-format-label"
              value={exportOptions.format}
              label="Format"
              onChange={handleExportFormatChange}
            >
              <MenuItem value="json">JSON (recommended)</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={exportOptions.encrypt}
                onChange={handleExportOptionChange('encrypt')}
              />
            }
            label="Encrypt export file"
          />
          
          {exportOptions.encrypt && (
            <TextField
              margin="dense"
              label="Encryption Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="You'll need this password to import the data later"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={loading}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Import Data</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            Import data from a previously exported file.
          </DialogContentText>
          
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Select File
              <input
                type="file"
                hidden
                accept=".json,.csv"
                onChange={handleFileChange}
              />
            </Button>
            {importFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {importFile.name}
              </Typography>
            )}
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={isImportEncrypted}
                onChange={(e, checked) => setIsImportEncrypted(checked)}
              />
            }
            label="File is encrypted"
          />
          
          {isImportEncrypted && (
            <TextField
              margin="dense"
              label="Encryption Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Enter the password used to encrypt this file"
            />
          )}
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            Importing data will merge with your existing data. If you want to replace all data instead, delete your data first before importing.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={loading || !importFile}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete My Data</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            This will permanently delete your data. This action cannot be undone.
          </DialogContentText>
          
          <FormControlLabel
            control={
              <Switch
                checked={deleteAccount}
                onChange={(e, checked) => setDeleteAccount(checked)}
              />
            }
            label="Also delete my account"
          />
          
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            {deleteAccount
              ? 'This will permanently delete your account and all associated data. You will not be able to recover it.'
              : 'This will delete all your data but keep your account active.'}
          </Alert>
          
          <TextField
            margin="dense"
            label="Type 'delete my data' to confirm"
            fullWidth
            variant="outlined"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Delete Data
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={handleCloseBackupDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            This will create a backup of all your data. The backup will be stored locally in your browser.
          </DialogContentText>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            For additional safety, you should also periodically export your data to a file and store it securely.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBackupDialog}>Cancel</Button>
          <Button
            onClick={handleCreateBackup}
            variant="contained"
            disabled={loading}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={handleCloseRestoreDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Restore from Backup</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            This will restore your data from the last backup created on {formatDate(lastBackupDate)}.
          </DialogContentText>
          
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            Restoring from backup will replace your current data. Any changes made since the backup will be lost.
          </Alert>
          
          <TextField
            margin="dense"
            label="Type 'restore my data' to confirm"
            fullWidth
            variant="outlined"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRestoreDialog}>Cancel</Button>
          <Button
            onClick={handleRestoreFromBackup}
            variant="contained"
            disabled={loading}
          >
            Restore Data
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrivacySettingsPage;
