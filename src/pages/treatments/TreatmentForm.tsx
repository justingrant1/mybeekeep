import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Hive, Apiary, Treatment } from '../../lib/types';

const TreatmentForm: React.FC = () => {
  const { hiveId } = useParams<{ hiveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form fields
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().substring(0, 10));
  const [treatmentType, setTreatmentType] = useState('');
  const [dosage, setDosage] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [completed, setCompleted] = useState(false);
  
  // State
  const [hive, setHive] = useState<Hive | null>(null);
  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!hiveId) {
      navigate('/apiaries');
      return;
    }
    
    fetchHiveData();
  }, [hiveId]);

  const fetchHiveData = async () => {
    if (!hiveId) return;
    
    try {
      setLoading(true);
      
      // Fetch hive details
      const { data: hiveData, error: hiveError } = await supabase
        .from('hives')
        .select('*')
        .eq('id', hiveId)
        .single();
      
      if (hiveError) throw hiveError;
      if (hiveData) {
        setHive(hiveData as Hive);
        
        // Fetch apiary details
        const { data: apiaryData, error: apiaryError } = await supabase
          .from('apiaries')
          .select('*')
          .eq('id', hiveData.apiary_id)
          .single();
          
        if (apiaryError) throw apiaryError;
        if (apiaryData) {
          setApiary(apiaryData as Apiary);
        }
      }
    } catch (error) {
      console.error('Error fetching hive data:', error);
      setError('Failed to load hive data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTreatmentTypeChange = (event: SelectChangeEvent) => {
    setTreatmentType(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hiveId || !user) {
      setError('Missing hive information. Please try again.');
      return;
    }
    
    if (!applicationDate || !treatmentType) {
      setError('Please fill out all required fields.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const newTreatment: Partial<Treatment> = {
        hive_id: hiveId,
        application_date: applicationDate,
        treatment_type: treatmentType,
        dosage: dosage || undefined,
        followup_date: followupDate || undefined,
        completed,
      };
      
      const { error } = await supabase.from('treatments').insert([newTreatment]);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Treatment recorded successfully!');
      
      // Navigate back to hive details after a short delay
      setTimeout(() => {
        navigate(`/hives/${hiveId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error recording treatment:', error);
      setError('Failed to record treatment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const treatmentTypes = [
    'Apistan (Fluvalinate)',
    'Apivar (Amitraz)',
    'ApiLife Var (Thymol)',
    'Apiguard (Thymol)',
    'Api-Bioxal (Oxalic Acid)',
    'Formic Pro (Formic Acid)',
    'MAQS (Formic Acid)',
    'HopGuard (Hop Beta Acids)',
    'CheckMite+ (Coumaphos)',
    'Oxalic Acid Dribble',
    'Oxalic Acid Vaporization',
    'Sugar Dusting',
    'Essential Oils',
    'Antibiotics',
    'Nosema Treatment',
    'Other',
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!hive || !apiary) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Hive not found
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to={`/hives/${hiveId}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Hive
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Add Treatment
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Hive: {hive.name} | Apiary: {apiary.name}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Treatment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={3}>
                <TextField
                  label="Application Date"
                  type="date"
                  fullWidth
                  required
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <FormControl fullWidth required>
                  <InputLabel id="treatment-type-label">Treatment Type</InputLabel>
                  <Select
                    labelId="treatment-type-label"
                    id="treatment-type"
                    value={treatmentType}
                    label="Treatment Type"
                    onChange={handleTreatmentTypeChange}
                  >
                    <MenuItem value="">
                      <em>Select a treatment</em>
                    </MenuItem>
                    {treatmentTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Dosage"
                  placeholder="e.g., '2 strips', '50ml solution', etc."
                  fullWidth
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Follow-up Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={3}>
                <TextField
                  label="Follow-up Date"
                  type="date"
                  fullWidth
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="When should the treatment be checked or removed?"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={completed}
                      onChange={(e) => setCompleted(e.target.checked)}
                    />
                  }
                  label="Treatment completed"
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Important Reminders:
                  </Typography>
                  <ul>
                    <li>Always follow manufacturer's instructions for dosage and application</li>
                    <li>Check if there are any honey harvest restrictions after application</li>
                    <li>Some treatments require removal after a specific period</li>
                    <li>Monitor the hive's condition following treatment</li>
                    <li>Record when the treatment is completed or removed</li>
                  </ul>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                  sx={{ minWidth: 150 }}
                >
                  {submitting ? 'Saving...' : 'Add Treatment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TreatmentForm;
