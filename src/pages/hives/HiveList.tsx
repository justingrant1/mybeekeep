import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Hive, Apiary } from '../../lib/types';

const HiveList: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { apiaryId } = useParams<{ apiaryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hives, setHives] = useState<Hive[]>([]);
  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState('');
  const [hiveType, setHiveType] = useState('Langstroth');
  const [status, setStatus] = useState<'active' | 'inactive' | 'dead' | 'sold'>('active');
  const [queenSource, setQueenSource] = useState('');
  const [establishedDate, setEstablishedDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!apiaryId) {
      navigate('/apiaries');
      return;
    }
    
    fetchApiary();
    fetchHives();
  }, [apiaryId]);

  const fetchApiary = async () => {
    if (!apiaryId) return;
    
    try {
      const { data, error } = await supabase
        .from('apiaries')
        .select('*')
        .eq('id', apiaryId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setApiary(data as Apiary);
      }
    } catch (error) {
      console.error('Error fetching apiary:', error);
    }
  };

  const fetchHives = async () => {
    if (!apiaryId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hives')
        .select('*')
        .eq('apiary_id', apiaryId)
        .order('name');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setHives(data as Hive[]);
      }
    } catch (error) {
      console.error('Error fetching hives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setHiveType('Langstroth');
    setStatus('active');
    setQueenSource('');
    setEstablishedDate(new Date().toISOString().substring(0, 10));
    setError(null);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as 'active' | 'inactive' | 'dead' | 'sold');
  };

  const handleHiveTypeChange = (event: SelectChangeEvent) => {
    setHiveType(event.target.value);
  };

  const handleCreateHive = async () => {
    if (!apiaryId) return;
    
    if (!name || !hiveType || !status || !establishedDate) {
      setError('Please fill out all required fields');
      return;
    }
    
    try {
      const newHive: Partial<Hive> = {
        apiary_id: apiaryId,
        name,
        hive_type: hiveType,
        status,
        queen_source: queenSource || undefined,
        established_date: establishedDate,
      };
      
      const { error } = await supabase.from('hives').insert([newHive]);
      
      if (error) {
        throw error;
      }
      
      handleCloseDialog();
      fetchHives();
      setSuccess('Hive created successfully!');
    } catch (error) {
      console.error('Error creating hive:', error);
      setError('Failed to create hive. Please try again.');
    }
  };

  const handleDeleteHive = async (hiveId: string) => {
    if (!window.confirm('Are you sure you want to delete this hive?')) {
      return;
    }
    
    try {
      const { error } = await supabase.from('hives').delete().eq('id', hiveId);
      
      if (error) {
        throw error;
      }
      
      fetchHives();
      setSuccess('Hive deleted successfully!');
    } catch (error) {
      console.error('Error deleting hive:', error);
      setError('Failed to delete hive. Please try again.');
    }
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
        gap: 2,
        mb: 4 
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Hives
          </Typography>
          {apiary && (
            <Typography variant="subtitle1" color="text.secondary">
              Apiary: {apiary.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          fullWidth={isMobile}
        >
          Add Hive
        </Button>
      </Box>

      {hives.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Hives Yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Add your first hive to start tracking inspections, harvests, and more.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Hive
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {hives.map((hive) => (
            <Grid item xs={12} sm={6} md={4} key={hive.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {hive.name}
                    </Typography>
                    <Chip 
                      label={hive.status.charAt(0).toUpperCase() + hive.status.slice(1)} 
                      color={getStatusColor(hive.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Type: {hive.hive_type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Established: {new Date(hive.established_date).toLocaleDateString()}
                  </Typography>
                  {hive.queen_source && (
                    <Typography variant="body2" color="text.secondary">
                      Queen Source: {hive.queen_source}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ 
                  mt: 'auto', 
                  flexWrap: 'wrap',
                  justifyContent: isMobile ? 'space-between' : 'flex-start',
                  gap: 1
                }}>
                  <Button
                    size="small"
                    component={Link}
                    to={`/hives/${hive.id}`}
                    variant="outlined"
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    component={Link}
                    to={`/hives/${hive.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteHive(hive.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Hive Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            width: isMobile ? '95%' : undefined,
            margin: isMobile ? 2 : undefined,
          }
        }}
      >
        <DialogTitle>Add New Hive</DialogTitle>
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
            label="Hive Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="hive-type-label">Hive Type</InputLabel>
            <Select
              labelId="hive-type-label"
              id="hive-type"
              value={hiveType}
              label="Hive Type"
              onChange={handleHiveTypeChange}
            >
              <MenuItem value="Langstroth">Langstroth</MenuItem>
              <MenuItem value="Top Bar">Top Bar</MenuItem>
              <MenuItem value="Warre">Warre</MenuItem>
              <MenuItem value="Flow Hive">Flow Hive</MenuItem>
              <MenuItem value="Nucleus">Nucleus (Nuc)</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={status}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="dead">Dead</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            id="queenSource"
            label="Queen Source (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={queenSource}
            onChange={(e) => setQueenSource(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            id="establishedDate"
            label="Established Date"
            type="date"
            fullWidth
            variant="outlined"
            value={establishedDate}
            onChange={(e) => setEstablishedDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateHive} variant="contained">
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

export default HiveList;
