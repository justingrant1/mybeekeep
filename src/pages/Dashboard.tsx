import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Hive as HiveIcon,
  Agriculture as HarvestIcon,
  BugReport as InspectionIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  apiaryCount: number;
  hiveCount: number;
  inspectionCount: number;
  harvestCount: number;
}

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    apiaryCount: 0,
    hiveCount: 0,
    inspectionCount: 0,
    harvestCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        // Get apiary count
        const { count: apiaryCount } = await supabase
          .from('apiaries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Get hive count
        const { count: hiveCount } = await supabase
          .from('hives')
          .select('*', { count: 'exact', head: true })
          .eq('apiary_id', supabase.from('apiaries').select('id').eq('user_id', user.id));
        
        // Get inspection count
        const { count: inspectionCount } = await supabase
          .from('inspections')
          .select('*', { count: 'exact', head: true })
          .eq('hive_id', supabase.from('hives').select('id').eq('apiary_id', supabase.from('apiaries').select('id').eq('user_id', user.id)));
        
        // Get harvest count
        const { count: harvestCount } = await supabase
          .from('harvests')
          .select('*', { count: 'exact', head: true })
          .eq('hive_id', supabase.from('hives').select('id').eq('apiary_id', supabase.from('apiaries').select('id').eq('user_id', user.id)));
        
        setStats({
          apiaryCount: apiaryCount || 0,
          hiveCount: hiveCount || 0,
          inspectionCount: inspectionCount || 0,
          harvestCount: harvestCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user]);

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

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 4 
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {profile?.full_name || 'Beekeeper'}
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/apiaries/new"
          startIcon={<AddIcon />}
          fullWidth={useMediaQuery(useTheme().breakpoints.down('sm'))}
        >
          New Apiary
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Apiaries
              </Typography>
              <Typography variant="h3">{stats.apiaryCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Hives
              </Typography>
              <Typography variant="h3">{stats.hiveCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Inspections
              </Typography>
              <Typography variant="h3">{stats.inspectionCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Harvests
              </Typography>
              <Typography variant="h3">{stats.harvestCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ width: '100%' }}
        >
          <Button
            variant="outlined"
            component={Link}
            to="/hives/new"
            startIcon={<HiveIcon />}
            fullWidth
          >
            Add New Hive
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/inspections/new"
            startIcon={<InspectionIcon />}
            fullWidth
          >
            Record Inspection
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/harvests/new"
            startIcon={<HarvestIcon />}
            fullWidth
          >
            Log Harvest
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box>
        <Typography variant="h5" gutterBottom>
          Getting Started
        </Typography>
        <Typography paragraph>
          Welcome to BeeKeeper Pro! Here are some tips to get started:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  1. Create an Apiary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start by creating your first apiary - a location where you keep your hives.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  2. Add Hives
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add hives to your apiary with details like queen information and hive type.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  3. Record Inspections
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Regularly record inspections to track the health and progress of your hives.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
