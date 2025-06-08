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
  Stack,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  SelectChangeEvent,
  InputAdornment,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Hive, Apiary, Harvest } from '../../lib/types';

const HarvestForm: React.FC = () => {
  const { hiveId } = useParams<{ hiveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form fields
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().substring(0, 10));
  const [honeyAmount, setHoneyAmount] = useState<number>(0);
  const [honeyType, setHoneyType] = useState('');
  const [qualityNotes, setQualityNotes] = useState('');
  
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

  const handleHoneyTypeChange = (event: SelectChangeEvent) => {
    setHoneyType(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hiveId || !user) {
      setError('Missing hive information. Please try again.');
      return;
    }
    
    if (!harvestDate || honeyAmount <= 0) {
      setError('Please fill out all required fields. Honey amount must be greater than 0.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const newHarvest: Partial<Harvest> = {
        hive_id: hiveId,
        harvest_date: harvestDate,
        honey_amount: honeyAmount,
        honey_type: honeyType || undefined,
        quality_notes: qualityNotes || undefined,
      };
      
      const { error } = await supabase.from('harvests').insert([newHarvest]);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Harvest recorded successfully!');
      
      // Navigate back to hive details after a short delay
      setTimeout(() => {
        navigate(`/hives/${hiveId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error recording harvest:', error);
      setError('Failed to record harvest. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const honeyTypes = [
    'Wildflower',
    'Clover',
    'Buckwheat',
    'Orange Blossom',
    'Acacia',
    'Lavender',
    'Manuka',
    'Honeydew',
    'Mixed Floral',
    'Spring Harvest',
    'Summer Harvest',
    'Fall Harvest',
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
          Log Harvest
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
                Harvest Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={3}>
                <TextField
                  label="Harvest Date"
                  type="date"
                  fullWidth
                  required
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <TextField
                  label="Honey Amount"
                  type="number"
                  fullWidth
                  required
                  value={honeyAmount}
                  onChange={(e) => setHoneyAmount(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    inputProps: { 
                      min: 0, 
                      step: 0.1 
                    }
                  }}
                />
                
                <FormControl fullWidth>
                  <InputLabel id="honey-type-label">Honey Type</InputLabel>
                  <Select
                    labelId="honey-type-label"
                    id="honey-type"
                    value={honeyType}
                    label="Honey Type"
                    onChange={handleHoneyTypeChange}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {honeyTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Quality Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                label="Quality Notes"
                placeholder="Describe the quality, color, taste, and any other characteristics of the honey"
                fullWidth
                multiline
                rows={8}
                value={qualityNotes}
                onChange={(e) => setQualityNotes(e.target.value)}
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Record details like:
                </Typography>
                <ul>
                  <li>Color and clarity</li>
                  <li>Taste profile</li>
                  <li>Viscosity</li>
                  <li>Crystallization status</li>
                  <li>Any special characteristics</li>
                </ul>
              </Box>
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
                  {submitting ? 'Saving...' : 'Record Harvest'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default HarvestForm;
