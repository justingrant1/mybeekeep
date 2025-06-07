import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormHelperText,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useEquipment, Equipment } from '../../contexts/EquipmentContext';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`equipment-tabpanel-${index}`}
      aria-labelledby={`equipment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EquipmentList: React.FC = () => {
  const { isPremium } = useAuth();
  const {
    equipment,
    loading,
    error,
    addEquipment,
    updateEquipment,
    deleteEquipment,
  } = useEquipment();
  
  // Derive categories from equipment list
  const categories = [...new Set(equipment.map(item => item.category))].sort();

  // Dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<'new' | 'good' | 'fair' | 'poor'>('good');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Dialog handlers
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    resetForm();
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    resetForm();
  };

  const handleOpenEditDialog = (item: Equipment) => {
    setSelectedEquipment(item);
    // Populate form with equipment data
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setCondition(item.condition);
    setPurchaseDate(item.purchase_date || '');
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedEquipment(null);
    resetForm();
  };

  // Form handlers
  const resetForm = () => {
    setName('');
    setCategory('');
    setCustomCategory('');
    setQuantity(1);
    setCondition('good');
    setPurchaseDate('');
    setFormError(null);
  };

  const validateForm = () => {
    if (!name) {
      setFormError('Please enter a name');
      return false;
    }
    
    if (!category && !customCategory) {
      setFormError('Please select or enter a category');
      return false;
    }
    
    if (quantity < 1) {
      setFormError('Quantity must be at least 1');
      return false;
    }
    
    setFormError(null);
    return true;
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    // If "Other" is selected, reset customCategory
    if (event.target.value !== 'other') {
      setCustomCategory('');
    }
  };

  const handleAddEquipment = async () => {
    if (!validateForm()) return;
    
    const actualCategory = category === 'other' ? customCategory : category;

    await addEquipment({
      name,
      category: actualCategory,
      quantity,
      condition,
      purchase_date: purchaseDate || undefined,
    });
    
    // If no error is thrown by the context, close the dialog
    if (!error) {
        handleCloseAddDialog();
    } else {
        setFormError(error);
    }
  };

  const handleUpdateEquipment = async () => {
    if (!validateForm() || !selectedEquipment) return;
    
    const actualCategory = category === 'other' ? customCategory : category;

    await updateEquipment(selectedEquipment.id, {
      name,
      category: actualCategory,
      quantity,
      condition,
      purchase_date: purchaseDate || undefined,
    });

    if (!error) {
        handleCloseEditDialog();
    } else {
        setFormError(error);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }
    await deleteEquipment(id);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter equipment by category based on selected tab
  const getFilteredEquipment = () => {
    if (tabValue === 0) {
      // All equipment
      return equipment;
    } else {
      // Filter by category (tabValue - 1 to account for "All" tab)
      const selectedCategory = categories[tabValue - 1];
      return equipment.filter(item => item.category === selectedCategory);
    }
  };

  // Get condition color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'success';
      case 'good':
        return 'primary';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Equipment Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          This is a premium feature that allows you to track and manage your beekeeping equipment.
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Equipment Inventory
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Equipment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs for categories */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Equipment" />
          {categories.map((cat) => (
            <Tab key={cat} label={cat} />
          ))}
        </Tabs>
      </Box>

      {/* Equipment grid */}
      <TabPanel value={tabValue} index={tabValue}>
        {getFilteredEquipment().length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No equipment found
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{ mt: 2 }}
            >
              Add Your First Equipment
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {getFilteredEquipment().map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" gutterBottom sx={{ flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(item)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteEquipment(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Category: {item.category}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Chip
                        label={`Qty: ${item.quantity}`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`Condition: ${item.condition}`}
                        color={getConditionColor(item.condition) as any}
                        size="small"
                      />
                    </Box>
                    
                    {item.purchase_date && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Add Equipment Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Equipment</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={category}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {/* Show existing categories from the database */}
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
                {/* Always add these default categories if they don't exist */}
                {!categories.includes('Hive Equipment') && (
                  <MenuItem value="Hive Equipment">Hive Equipment</MenuItem>
                )}
                {!categories.includes('Protective Gear') && (
                  <MenuItem value="Protective Gear">Protective Gear</MenuItem>
                )}
                {!categories.includes('Tools') && (
                  <MenuItem value="Tools">Tools</MenuItem>
                )}
                {!categories.includes('Extraction Equipment') && (
                  <MenuItem value="Extraction Equipment">Extraction Equipment</MenuItem>
                )}
                {/* Add "Other" option for custom categories */}
                <MenuItem value="other">Other (specify)</MenuItem>
              </Select>
            </FormControl>
            
            {category === 'other' && (
              <TextField
                label="Custom Category"
                fullWidth
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                margin="normal"
                required
              />
            )}
            
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="condition-label">Condition</InputLabel>
              <Select
                labelId="condition-label"
                value={condition}
                label="Condition"
                onChange={(e) => setCondition(e.target.value as any)}
              >
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
              </Select>
              <FormHelperText>The current condition of the equipment</FormHelperText>
            </FormControl>
            
            <TextField
              label="Purchase Date"
              type="date"
              fullWidth
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Optional"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddEquipment} variant="contained">
            Add Equipment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Equipment</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="edit-category-label">Category</InputLabel>
              <Select
                labelId="edit-category-label"
                value={category}
                label="Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {/* Show existing categories from the database */}
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
                {/* Always add these default categories if they don't exist */}
                {!categories.includes('Hive Equipment') && (
                  <MenuItem value="Hive Equipment">Hive Equipment</MenuItem>
                )}
                {!categories.includes('Protective Gear') && (
                  <MenuItem value="Protective Gear">Protective Gear</MenuItem>
                )}
                {!categories.includes('Tools') && (
                  <MenuItem value="Tools">Tools</MenuItem>
                )}
                {!categories.includes('Extraction Equipment') && (
                  <MenuItem value="Extraction Equipment">Extraction Equipment</MenuItem>
                )}
                {/* Add "Other" option for custom categories */}
                <MenuItem value="other">Other (specify)</MenuItem>
              </Select>
            </FormControl>
            
            {category === 'other' && (
              <TextField
                label="Custom Category"
                fullWidth
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                margin="normal"
                required
              />
            )}
            
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="edit-condition-label">Condition</InputLabel>
              <Select
                labelId="edit-condition-label"
                value={condition}
                label="Condition"
                onChange={(e) => setCondition(e.target.value as any)}
              >
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
              </Select>
              <FormHelperText>The current condition of the equipment</FormHelperText>
            </FormControl>
            
            <TextField
              label="Purchase Date"
              type="date"
              fullWidth
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Optional"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateEquipment} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipmentList;
