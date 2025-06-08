import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Stack,
  Paper,
  Grid,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Agriculture as HarvestIcon,
  BugReport as InspectionIcon,
  Healing as TreatmentIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Hive, Apiary, Inspection, Harvest, Treatment } from '../../lib/types';
import { useRealtimeRecord, useRealtimeHiveRecords } from '../../hooks/useRealtimeSubscription';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hive-tabpanel-${index}`}
      aria-labelledby={`hive-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const HiveDetail: React.FC = () => {
  const { hiveId } = useParams<{ hiveId: string }>();
  const navigate = useNavigate();
  const [hive, setHive] = useState<Hive | null>(null);
  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Set up realtime subscriptions
  useRealtimeRecord('hives', hiveId || '');
  useRealtimeHiveRecords('inspections', hiveId || '');
  useRealtimeHiveRecords('harvests', hiveId || '');
  useRealtimeHiveRecords('treatments', hiveId || '');

  // Memoize the fetch function to avoid unnecessary re-creation
  const fetchHiveData = useCallback(async () => {
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
        
        // Fetch inspections
        const { data: inspectionsData, error: inspectionsError } = await supabase
          .from('inspections')
          .select('*')
          .eq('hive_id', hiveId)
          .order('inspection_date', { ascending: false });
          
        if (inspectionsError) throw inspectionsError;
        if (inspectionsData) {
          setInspections(inspectionsData as Inspection[]);
        }
        
        // Fetch harvests
        const { data: harvestsData, error: harvestsError } = await supabase
          .from('harvests')
          .select('*')
          .eq('hive_id', hiveId)
          .order('harvest_date', { ascending: false });
          
        if (harvestsError) throw harvestsError;
        if (harvestsData) {
          setHarvests(harvestsData as Harvest[]);
        }
        
        // Fetch treatments
        const { data: treatmentsData, error: treatmentsError } = await supabase
          .from('treatments')
          .select('*')
          .eq('hive_id', hiveId)
          .order('application_date', { ascending: false });
          
        if (treatmentsError) throw treatmentsError;
        if (treatmentsData) {
          setTreatments(treatmentsData as Treatment[]);
        }
      }
    } catch (error) {
      console.error('Error fetching hive data:', error);
      setError('Failed to load hive data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hiveId]);

  useEffect(() => {
    if (!hiveId) {
      navigate('/apiaries');
      return;
    }
    
    fetchHiveData();

    // Set up an interval to refresh data periodically (every 30 seconds as a backup)
    const intervalId = setInterval(() => {
      fetchHiveData();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [hiveId, fetchHiveData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'dead':
        return 'error';
      case 'sold':
        return 'info';
      default:
        return 'default';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

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

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
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
          to={`/apiaries/${apiary.id}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Hives
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {hive.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Apiary: {apiary.name}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            component={Link}
            to={`/hives/${hive.id}/edit`}
            startIcon={<EditIcon />}
          >
            Edit Hive
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hive Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Status:</Typography>
                  <Chip 
                    label={hive.status.charAt(0).toUpperCase() + hive.status.slice(1)} 
                    color={getStatusColor(hive.status) as any}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Hive Type:</Typography>
                  <Typography variant="body1">{hive.hive_type}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Established Date:</Typography>
                  <Typography variant="body1">
                    {new Date(hive.established_date).toLocaleDateString()}
                  </Typography>
                </Box>
                
                {hive.queen_source && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Queen Source:</Typography>
                    <Typography variant="body1">{hive.queen_source}</Typography>
                  </Box>
                )}
                
                {hive.queen_introduced && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Queen Introduced:</Typography>
                    <Typography variant="body1">
                      {new Date(hive.queen_introduced).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Inspections
                    </Typography>
                    <Typography variant="h4">{inspections.length}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Harvests
                    </Typography>
                    <Typography variant="h4">{harvests.length}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Treatments
                    </Typography>
                    <Typography variant="h4">{treatments.length}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Honey (kg)
                    </Typography>
                    <Typography variant="h4">
                      {harvests.reduce((sum, harvest) => sum + Number(harvest.honey_amount), 0).toFixed(1)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {inspections.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Last Inspection: {new Date(inspections[0].inspection_date).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={`Health: ${inspections[0].health_status.charAt(0).toUpperCase() + inspections[0].health_status.slice(1)}`}
                    color={getHealthStatusColor(inspections[0].health_status) as any}
                    size="small"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="hive tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<InspectionIcon />} label="Inspections" />
            <Tab icon={<HarvestIcon />} label="Harvests" />
            <Tab icon={<TreatmentIcon />} label="Treatments" />
            <Tab icon={<AssessmentIcon />} label="Analytics" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Inspection Records</Typography>
            <Button
              variant="contained"
              component={Link}
              to={`/hives/${hive.id}/inspections/new`}
              startIcon={<InspectionIcon />}
            >
              Record Inspection
            </Button>
          </Box>
          
          {inspections.length === 0 ? (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No Inspections Yet
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Record your first inspection to track the health and progress of your hive.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to={`/hives/${hive.id}/inspections/new`}
                startIcon={<InspectionIcon />}
              >
                Record Inspection
              </Button>
            </Card>
          ) : (
            <Stack spacing={2}>
              {inspections.map((inspection) => (
                <Card key={inspection.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {new Date(inspection.inspection_date).toLocaleDateString()} at {new Date(inspection.inspection_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={`Health: ${inspection.health_status.charAt(0).toUpperCase() + inspection.health_status.slice(1)}`}
                            color={getHealthStatusColor(inspection.health_status) as any}
                            size="small"
                          />
                          <Chip
                            label={`Queen seen: ${inspection.queen_seen ? 'Yes' : 'No'}`}
                            variant="outlined"
                            size="small"
                          />
                          {inspection.population_strength && (
                            <Chip
                              label={`Strength: ${inspection.population_strength}/10`}
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        component={Link}
                        to={`/inspections/${inspection.id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                    {inspection.observations && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {inspection.observations}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Harvest Records</Typography>
            <Button
              variant="contained"
              component={Link}
              to={`/hives/${hive.id}/harvests/new`}
              startIcon={<HarvestIcon />}
            >
              Log Harvest
            </Button>
          </Box>
          
          {harvests.length === 0 ? (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No Harvests Yet
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Log your first honey harvest when your hive produces honey.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to={`/hives/${hive.id}/harvests/new`}
                startIcon={<HarvestIcon />}
              >
                Log Harvest
              </Button>
            </Card>
          ) : (
            <Stack spacing={2}>
              {harvests.map((harvest) => (
                <Card key={harvest.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {new Date(harvest.harvest_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                          {harvest.honey_amount} kg
                        </Typography>
                        {harvest.honey_type && (
                          <Typography variant="body2" color="text.secondary">
                            Type: {harvest.honey_type}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        component={Link}
                        to={`/harvests/${harvest.id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                    {harvest.quality_notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {harvest.quality_notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Treatment Records</Typography>
            <Button
              variant="contained"
              component={Link}
              to={`/hives/${hive.id}/treatments/new`}
              startIcon={<TreatmentIcon />}
            >
              Add Treatment
            </Button>
          </Box>
          
          {treatments.length === 0 ? (
            <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No Treatments Yet
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Add treatments when you apply them to your hive.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to={`/hives/${hive.id}/treatments/new`}
                startIcon={<TreatmentIcon />}
              >
                Add Treatment
              </Button>
            </Card>
          ) : (
            <Stack spacing={2}>
              {treatments.map((treatment) => (
                <Card key={treatment.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {new Date(treatment.application_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                          {treatment.treatment_type}
                        </Typography>
                        {treatment.dosage && (
                          <Typography variant="body2" color="text.secondary">
                            Dosage: {treatment.dosage}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        component={Link}
                        to={`/treatments/${treatment.id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={treatment.completed ? 'Completed' : 'Ongoing'}
                        color={treatment.completed ? 'success' : 'warning'}
                        size="small"
                      />
                      {treatment.followup_date && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Follow-up date: {new Date(treatment.followup_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Analytics Coming Soon
            </Typography>
            <Typography variant="body1" color="text.secondary">
              In-depth analytics and visualizations will be available in the premium version.
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default HiveDetail;
