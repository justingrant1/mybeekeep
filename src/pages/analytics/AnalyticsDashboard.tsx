import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Define data types based on Supabase schema
export interface Apiary {
  id: string;
  name: string;
}

export interface Hive {
  id: string;
  apiary_id: string;
  name: string;
}

export interface Inspection {
  id: string;
  hive_id: string;
  inspection_date: string;
  health_status: string;
  population_strength?: number;
  queen_seen: boolean;
}

export interface Harvest {
  id: string;
  hive_id: string;
  harvest_date: string;
  honey_amount: number;
  quality_notes?: string;
}

export interface Treatment {
  id: string;
  hive_id: string;
  application_date: string;
  treatment_type: string;
  completed: boolean;
  followup_date?: string;
}


// Mock chart components (in a real app would use a charting library like recharts, chart.js, etc.)
const MockBarChart: React.FC<{ data: any; title: string }> = ({ data, title }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle1" gutterBottom>
      {title}
    </Typography>
    <Paper sx={{ p: 2, height: 250, bgcolor: '#f5f5f5', position: 'relative' }}>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        Chart visualization would appear here<br/>
        (Using data with {data?.length || 0} records)
      </Typography>
    </Paper>
  </Box>
);

const MockLineChart: React.FC<{ data: any; title: string }> = ({ data, title }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle1" gutterBottom>
      {title}
    </Typography>
    <Paper sx={{ p: 2, height: 250, bgcolor: '#f5f5f5', position: 'relative' }}>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        Line chart visualization would appear here<br/>
        (Tracking trends across {data?.length || 0} data points)
      </Typography>
    </Paper>
  </Box>
);

const MockPieChart: React.FC<{ data: any; title: string }> = ({ data, title }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle1" gutterBottom>
      {title}
    </Typography>
    <Paper sx={{ p: 2, height: 250, bgcolor: '#f5f5f5', position: 'relative' }}>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        Pie chart visualization would appear here<br/>
        (Distribution of {Object.keys(data || {}).length} categories)
      </Typography>
    </Paper>
  </Box>
);

// Tab panel component
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AnalyticsDashboard: React.FC = () => {
  const { isPremium } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Data state
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [hives, setHives] = useState<Hive[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  
  // Filter state
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1year');
  
  // Loading data from the database
  useEffect(() => {
    if (!isPremium) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get apiaries
        const { data: apiaryData, error: apiaryError } = await supabase
          .from('apiaries')
          .select('*')
          .order('name');
          
        if (apiaryError) throw apiaryError;
        setApiaries(apiaryData || []);
        
        // Get hives
        const { data: hiveData, error: hiveError } = await supabase
          .from('hives')
          .select('*')
          .order('name');
          
        if (hiveError) throw hiveError;
        setHives(hiveData || []);
        
        // Get inspections
        const { data: inspectionData, error: inspectionError } = await supabase
          .from('inspections')
          .select('*')
          .order('inspection_date', { ascending: false });
          
        if (inspectionError) throw inspectionError;
        setInspections(inspectionData || []);
        
        // Get harvests
        const { data: harvestData, error: harvestError } = await supabase
          .from('harvests')
          .select('*')
          .order('harvest_date', { ascending: false });
          
        if (harvestError) throw harvestError;
        setHarvests(harvestData || []);
        
        // Get treatments
        const { data: treatmentData, error: treatmentError } = await supabase
          .from('treatments')
          .select('*')
          .order('application_date', { ascending: false });
          
        if (treatmentError) throw treatmentError;
        setTreatments(treatmentData || []);
        
      } catch (err) {
        console.error('Error fetching data for analytics:', err);
        setError('Failed to load data for analytics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isPremium]);
  
  // Filter data based on selectedApiaryId and selectedTimeRange
  const getFilteredData = () => {
    // Time range filtering
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedTimeRange) {
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    // Get hives from selected apiary (or all)
    const filteredHives = selectedApiaryId === 'all'
      ? hives
      : hives.filter(hive => hive.apiary_id === selectedApiaryId);
    
    // Get the IDs of filtered hives
    const filteredHiveIds = filteredHives.map(hive => hive.id);
    
    // Filter inspections, harvests, and treatments by hive and date
    const filteredInspections = inspections.filter(inspection => 
      filteredHiveIds.includes(inspection.hive_id) && 
      new Date(inspection.inspection_date) >= startDate
    );
    
    const filteredHarvests = harvests.filter(harvest => 
      filteredHiveIds.includes(harvest.hive_id) && 
      new Date(harvest.harvest_date) >= startDate
    );
    
    const filteredTreatments = treatments.filter(treatment => 
      filteredHiveIds.includes(treatment.hive_id) && 
      new Date(treatment.application_date) >= startDate
    );
    
    return {
      hives: filteredHives,
      inspections: filteredInspections,
      harvests: filteredHarvests,
      treatments: filteredTreatments,
    };
  };
  
  // Get filtered data
  const filteredData = getFilteredData();
  
  // Prepare data for various analytics
  
  // Total honey harvested
  const totalHoney = filteredData.harvests.reduce((sum, harvest) => sum + Number(harvest.honey_amount), 0);
  
  // Average population strength
  const averagePopulationStrength = filteredData.inspections.length
    ? filteredData.inspections.reduce((sum, insp) => sum + (insp.population_strength || 0), 0) / filteredData.inspections.length
    : 0;
  
  // Health status distribution
  const healthStatusDistribution = filteredData.inspections.reduce((acc, insp) => {
    acc[insp.health_status] = (acc[insp.health_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Treatment distribution
  const treatmentTypeDistribution = filteredData.treatments.reduce((acc, treatment) => {
    acc[treatment.treatment_type] = (acc[treatment.treatment_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const handleApiaryChange = (event: SelectChangeEvent) => {
    setSelectedApiaryId(event.target.value);
  };
  
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setSelectedTimeRange(event.target.value);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          This is a premium feature that provides advanced analytics and visualization of your beekeeping data.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="/premium"
          sx={{ minWidth: 200 }}
        >
          Upgrade to Premium
        </Button>
      </Box>
    );
  }
  
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
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="apiary-filter-label">Apiary</InputLabel>
              <Select
                labelId="apiary-filter-label"
                value={selectedApiaryId}
                label="Apiary"
                onChange={handleApiaryChange}
              >
                <MenuItem value="all">All Apiaries</MenuItem>
                {apiaries.map((apiary) => (
                  <MenuItem key={apiary.id} value={apiary.id}>
                    {apiary.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="time-range-filter-label">Time Range</InputLabel>
              <Select
                labelId="time-range-filter-label"
                value={selectedTimeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<VisibilityIcon />}
              fullWidth
              sx={{ height: '100%' }}
            >
              Export Data
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Overview cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Hives
              </Typography>
              <Typography variant="h3" color="primary">
                {filteredData.hives.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across {selectedApiaryId === 'all' ? apiaries.length : 1} {selectedApiaryId === 'all' && apiaries.length !== 1 ? 'apiaries' : 'apiary'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Honey Harvested
              </Typography>
              <Typography variant="h3" color="primary">
                {totalHoney.toFixed(1)} kg
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                From {filteredData.harvests.length} harvest{filteredData.harvests.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Hive Strength
              </Typography>
              <Typography variant="h3" color="primary">
                {averagePopulationStrength.toFixed(1)}/10
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Based on {filteredData.inspections.length} inspection{filteredData.inspections.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Treatments Applied
              </Typography>
              <Typography variant="h3" color="primary">
                {filteredData.treatments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {Object.keys(treatmentTypeDistribution).length} different treatment type{Object.keys(treatmentTypeDistribution).length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for different analytics sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Hive Health" />
          <Tab label="Honey Production" />
          <Tab label="Treatments" />
        </Tabs>
      </Box>
      
      {/* Overview tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <MockLineChart 
              data={filteredData.inspections}
              title="Hive Inspections Over Time"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MockLineChart 
              data={filteredData.harvests}
              title="Honey Harvests Over Time"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MockPieChart 
              data={healthStatusDistribution}
              title="Hive Health Distribution"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MockBarChart 
              data={filteredData.hives}
              title="Hives by Apiary"
            />
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Hive Health tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <MockLineChart 
              data={filteredData.inspections}
              title="Population Strength Trends"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MockPieChart 
              data={healthStatusDistribution}
              title="Health Status Distribution"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Recent Inspections
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}><Typography variant="subtitle2">Date</Typography></Grid>
                <Grid item xs={3}><Typography variant="subtitle2">Hive</Typography></Grid>
                <Grid item xs={2}><Typography variant="subtitle2">Health</Typography></Grid>
                <Grid item xs={2}><Typography variant="subtitle2">Strength</Typography></Grid>
                <Grid item xs={2}><Typography variant="subtitle2">Queen</Typography></Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              {filteredData.inspections.slice(0, 5).map((inspection) => {
                const hive = hives.find(h => h.id === inspection.hive_id);
                return (
                  <Grid container spacing={2} key={inspection.id} sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2">{formatDate(inspection.inspection_date)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">{hive?.name || 'Unknown Hive'}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {inspection.health_status}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{inspection.population_strength || 'N/A'}/10</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{inspection.queen_seen ? 'Seen' : 'Not seen'}</Typography>
                    </Grid>
                  </Grid>
                );
              })}
              {filteredData.inspections.length > 5 && (
                <Button variant="text" sx={{ mt: 1 }}>
                  View All {filteredData.inspections.length} Inspections
                </Button>
              )}
              {filteredData.inspections.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No inspection data available for the selected filters.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Honey Production tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <MockBarChart 
              data={filteredData.harvests}
              title="Honey Production by Hive"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MockLineChart 
              data={filteredData.harvests}
              title="Honey Yield Over Time"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Recent Harvests
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}><Typography variant="subtitle2">Date</Typography></Grid>
                <Grid item xs={3}><Typography variant="subtitle2">Hive</Typography></Grid>
                <Grid item xs={2}><Typography variant="subtitle2">Amount (kg)</Typography></Grid>
                <Grid item xs={4}><Typography variant="subtitle2">Notes</Typography></Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              {filteredData.harvests.slice(0, 5).map((harvest) => {
                const hive = hives.find(h => h.id === harvest.hive_id);
                return (
                  <Grid container spacing={2} key={harvest.id} sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2">{formatDate(harvest.harvest_date)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">{hive?.name || 'Unknown Hive'}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{Number(harvest.honey_amount).toFixed(1)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">{harvest.quality_notes || 'No notes'}</Typography>
                    </Grid>
                  </Grid>
                );
              })}
              {filteredData.harvests.length > 5 && (
                <Button variant="text" sx={{ mt: 1 }}>
                  View All {filteredData.harvests.length} Harvests
                </Button>
              )}
              {filteredData.harvests.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No harvest data available for the selected filters.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Treatments tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <MockPieChart 
              data={treatmentTypeDistribution}
              title="Treatment Types Distribution"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MockLineChart 
              data={filteredData.treatments}
              title="Treatments Over Time"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Recent Treatments
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}><Typography variant="subtitle2">Date</Typography></Grid>
                <Grid item xs={3}><Typography variant="subtitle2">Hive</Typography></Grid>
                <Grid item xs={3}><Typography variant="subtitle2">Treatment</Typography></Grid>
                <Grid item xs={3}><Typography variant="subtitle2">Status</Typography></Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              {filteredData.treatments.slice(0, 5).map((treatment) => {
                const hive = hives.find(h => h.id === treatment.hive_id);
                return (
                  <Grid container spacing={2} key={treatment.id} sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2">{formatDate(treatment.application_date)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">{hive?.name || 'Unknown Hive'}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">{treatment.treatment_type}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">
                        {treatment.completed ? 'Completed' : treatment.followup_date ? `Follow-up: ${formatDate(treatment.followup_date)}` : 'In progress'}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })}
              {filteredData.treatments.length > 5 && (
                <Button variant="text" sx={{ mt: 1 }}>
                  View All {filteredData.treatments.length} Treatments
                </Button>
              )}
              {filteredData.treatments.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No treatment data available for the selected filters.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default AnalyticsDashboard;
