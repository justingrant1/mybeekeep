import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Apiary } from '../../lib/supabase';
import { useRealtimeUserRecords } from '../../hooks/useRealtimeSubscription';

const ApiaryList: React.FC = () => {
  const { user } = useAuth();
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Set up real-time subscription to apiaries for the current user
  useRealtimeUserRecords('apiaries', user?.id || '');

  // Memoize the fetch function to avoid unnecessary re-creation
  const fetchApiaries = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('apiaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setApiaries(data as Apiary[]);
      }
    } catch (error) {
      console.error('Error fetching apiaries:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApiaries();
    
    // Set up an interval to refresh data periodically (every 30 seconds as a backup)
    const intervalId = setInterval(() => {
      fetchApiaries();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, fetchApiaries]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setName('');
    setLocation('');
    setError(null);
  };

  const handleCreateApiary = async () => {
    if (!user) return;

    if (!name || !location) {
      setError('Please fill out all fields');
      return;
    }

    try {
      const newApiary: Partial<Apiary> = {
        user_id: user.id,
        name,
        location,
      };

      const { error } = await supabase.from('apiaries').insert([newApiary]);

      if (error) {
        throw error;
      }

      handleCloseDialog();
      fetchApiaries();
      setSuccess('Apiary created successfully!');
    } catch (error) {
      console.error('Error creating apiary:', error);
      setError('Failed to create apiary. Please try again.');
    }
  };

  const handleDeleteApiary = async (apiaryId: string) => {
    if (!window.confirm('Are you sure you want to delete this apiary?')) {
      return;
    }

    try {
      const { error } = await supabase.from('apiaries').delete().eq('id', apiaryId);

      if (error) {
        throw error;
      }

      fetchApiaries();
      setSuccess('Apiary deleted successfully!');
    } catch (error) {
      console.error('Error deleting apiary:', error);
      setError('Failed to delete apiary. Please try again.');
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Apiaries
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Apiary
        </Button>
      </Box>

      {apiaries.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Apiaries Yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Add your first apiary to start managing your hives.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Apiary
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {apiaries.map((apiary) => (
            <Grid item xs={12} sm={6} md={4} key={apiary.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {apiary.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Location: {apiary.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(apiary.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/apiaries/${apiary.id}`}
                  >
                    View Hives
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    component={Link}
                    to={`/apiaries/${apiary.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteApiary(apiary.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Apiary Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New Apiary</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Apiary Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="location"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateApiary} variant="contained">
            Create
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

export default ApiaryList;
