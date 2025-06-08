import React, { useState, useEffect, useRef } from 'react';
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
  Slider,
  Stack,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  SelectChangeEvent,
  IconButton,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Hive, Apiary, Inspection } from '../../lib/types';
import { uploadInspectionPhoto, initializeStorage } from '../../lib/storage';

const InspectionForm: React.FC = () => {
  const { hiveId } = useParams<{ hiveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [healthStatus, setHealthStatus] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'critical'>('good');
  const [populationStrength, setPopulationStrength] = useState<number>(5);
  const [queenSeen, setQueenSeen] = useState(false);
  const [broodPattern, setBroodPattern] = useState('');
  const [observations, setObservations] = useState('');
  const [weatherConditions, setWeatherConditions] = useState<{ 
    temperature?: number;
    humidity?: number;
    conditions?: string;
  }>({});
  
  // Photo handling
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    initializeStorage();
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

  const handleHealthStatusChange = (event: SelectChangeEvent) => {
    setHealthStatus(event.target.value as 'excellent' | 'good' | 'fair' | 'poor' | 'critical');
  };

  const handlePopulationStrengthChange = (event: Event, newValue: number | number[]) => {
    setPopulationStrength(newValue as number);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and add to photos array
      const newPhotos = Array.from(files);
      setPhotos([...photos, ...newPhotos]);
      
      // Create temporary URLs for preview
      const newUrls = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoUrls([...photoUrls, ...newUrls]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    // Remove the photo and its URL from the arrays
    const newPhotos = [...photos];
    const newUrls = [...photoUrls];
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newUrls[index]);
    
    newPhotos.splice(index, 1);
    newUrls.splice(index, 1);
    
    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
  };

  const uploadPhotos = async (inspectionId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    if (photos.length === 0) {
      return uploadedUrls;
    }
    
    setUploadingPhotos(true);
    
    try {
      // Upload each photo and collect the URLs
      for (const photo of photos) {
        const { url, error } = await uploadInspectionPhoto(photo, inspectionId);
        
        if (error) {
          throw error;
        }
        
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hiveId || !user) {
      setError('Missing hive information. Please try again.');
      return;
    }
    
    if (!date || !healthStatus) {
      setError('Please fill out all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Combine date and time for inspection_date
      const inspectionDateTime = new Date(`${date}T${time || '12:00'}`);
      
      const newInspection: Partial<Inspection> = {
        hive_id: hiveId,
        inspection_date: inspectionDateTime.toISOString(),
        health_status: healthStatus,
        population_strength: populationStrength,
        queen_seen: queenSeen,
        brood_pattern: broodPattern || undefined,
        observations: observations || undefined,
        weather_conditions: Object.keys(weatherConditions).length > 0 ? weatherConditions : undefined,
      };
      
      // Insert the inspection record
      const { data, error } = await supabase.from('inspections')
        .insert([newInspection])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data && photos.length > 0) {
        // Upload photos if we have any
        const uploadedUrls = await uploadPhotos(data.id);
        
        // Insert photo records in the inspection_photos table
        if (data.id && uploadedUrls.length > 0) {
          
          // Create records in the inspection_photos table for each uploaded photo
          for (let i = 0; i < uploadedUrls.length; i++) {
            await supabase.from('inspection_photos').insert([{
              inspection_id: data.id,
              photo_url: uploadedUrls[i],
              description: `Photo ${i + 1} from inspection on ${date}`
            }]);
          }
        }
      }
      
      setSuccess('Inspection recorded successfully!');
      
      // Navigate back to hive details after a short delay
      setTimeout(() => {
        navigate(`/hives/${hiveId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error recording inspection:', error);
      setError('Failed to record inspection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const populationMarks = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10' },
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
          Record Inspection
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
                Inspection Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={3}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Time"
                  type="time"
                  fullWidth
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <FormControl fullWidth required>
                  <InputLabel id="health-status-label">Health Status</InputLabel>
                  <Select
                    labelId="health-status-label"
                    id="health-status"
                    value={healthStatus}
                    label="Health Status"
                    onChange={handleHealthStatusChange}
                  >
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="poor">Poor</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
                
                <Box>
                  <Typography id="population-strength-slider" gutterBottom>
                    Population Strength (1-10)
                  </Typography>
                  <Slider
                    value={populationStrength}
                    onChange={handlePopulationStrengthChange}
                    aria-labelledby="population-strength-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks={populationMarks}
                    min={1}
                    max={10}
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={queenSeen}
                      onChange={(e) => setQueenSeen(e.target.checked)}
                    />
                  }
                  label="Queen seen"
                />
                
                <TextField
                  label="Brood Pattern"
                  placeholder="Describe the brood pattern (solid, spotty, etc.)"
                  fullWidth
                  multiline
                  rows={2}
                  value={broodPattern}
                  onChange={(e) => setBroodPattern(e.target.value)}
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Weather Conditions (Optional)
                </Typography>
                
                <TextField
                  label="Temperature (°C)"
                  type="number"
                  fullWidth
                  value={weatherConditions.temperature || ''}
                  onChange={(e) => setWeatherConditions({
                    ...weatherConditions,
                    temperature: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <TextField
                  label="Humidity (%)"
                  type="number"
                  fullWidth
                  value={weatherConditions.humidity || ''}
                  onChange={(e) => setWeatherConditions({
                    ...weatherConditions,
                    humidity: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <TextField
                  label="Weather Conditions"
                  placeholder="Sunny, cloudy, rainy, etc."
                  fullWidth
                  value={weatherConditions.conditions || ''}
                  onChange={(e) => setWeatherConditions({
                    ...weatherConditions,
                    conditions: e.target.value || undefined,
                  })}
                />
                
              <TextField
                label="Observations"
                placeholder="Notes, observations, and any other relevant information"
                fullWidth
                multiline
                rows={6}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Photos (Optional)
                </Typography>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                
                <Button
                  variant="outlined"
                  startIcon={<AddPhotoIcon />}
                  onClick={handlePhotoClick}
                  sx={{ mb: 2 }}
                >
                  Add Photos
                </Button>
                
                {photoUrls.length > 0 && (
                  <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={120}>
                    {photoUrls.map((url, index) => (
                      <ImageListItem key={url}>
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          loading="lazy"
                          style={{ height: '100%', objectFit: 'cover' }}
                        />
                        <IconButton
                          aria-label="delete"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                          }}
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}
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
                  {submitting || uploadingPhotos ? 'Saving...' : 'Save Inspection'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default InspectionForm;
