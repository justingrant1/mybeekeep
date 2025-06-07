import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Assessment as AnalyticsIcon,
  BarChart as ChartsIcon,
  Lock as LockIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Mock function for payment processing (in a real app, this would connect to Stripe, etc.)
const mockProcessPayment = async (
  cardNumber: string,
  expiry: string,
  cvc: string
): Promise<{ success: boolean; error?: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Basic validation
  if (cardNumber.length < 16) {
    return { success: false, error: 'Invalid card number' };
  }
  
  if (!expiry.includes('/')) {
    return { success: false, error: 'Invalid expiry date' };
  }
  
  if (cvc.length < 3) {
    return { success: false, error: 'Invalid CVC' };
  }
  
  // Simulate successful payment
  return { success: true };
};

const PremiumPage: React.FC = () => {
  const { user, isPremium, refetchProfile } = useAuth();
  
  // Payment dialog state
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Plans
  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$5.99',
      period: 'per month',
      features: [
        'Equipment management',
        'Analytics dashboard',
        'Data export',
        'Premium support',
      ],
      recommended: false,
    },
    {
      id: 'yearly',
      name: 'Annual Plan',
      price: '$59.99',
      period: 'per year',
      features: [
        'Equipment management',
        'Analytics dashboard',
        'Data export',
        'Premium support',
        'Save $11.89 compared to monthly',
      ],
      recommended: true,
    },
  ];
  
  const handleOpenPaymentDialog = (plan: 'monthly' | 'yearly') => {
    setPaymentPlan(plan);
    setOpenPaymentDialog(true);
  };
  
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setPaymentError(null);
  };
  
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Format as MM/YY
    if (value.length === 2 && cardExpiry.length === 1 && !value.includes('/')) {
      setCardExpiry(value + '/');
    } else {
      setCardExpiry(value);
    }
  };
  
  const handleSubmitPayment = async () => {
    setProcessingPayment(true);
    setPaymentError(null);
    
    try {
      // In a real app, this would connect to a payment processor API
      const paymentResult = await mockProcessPayment(cardNumber, cardExpiry, cardCvc);
      
      if (!paymentResult.success) {
        setPaymentError(paymentResult.error || 'Payment failed');
        setProcessingPayment(false);
        return;
      }
      
      // Update the user's premium status in the database
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', user.id);
        
        if (error) {
          throw error;
        }
        
        // Refetch the profile to get the latest premium status
        await refetchProfile();
        
        // Show success message
        setSuccessMessage(
          `Successfully upgraded to the ${
            paymentPlan === 'monthly' ? 'Monthly' : 'Annual'
          } Premium Plan!`
        );
        
        // Close the dialog
        handleClosePaymentDialog();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentError('An error occurred while processing your payment');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your premium subscription?')) {
      return;
    }
    
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: false })
          .eq('id', user.id);
        
        if (error) {
          throw error;
        }
        
        // Refetch the profile to get the latest premium status
        await refetchProfile();
        
        // Show success message
        setSuccessMessage('Successfully cancelled your premium subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('An error occurred while cancelling your subscription');
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Premium Subscription
      </Typography>
      
      {isPremium ? (
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckIcon color="success" sx={{ fontSize: 28, mr: 2 }} />
            <Typography variant="h5">
              You have an active Premium subscription
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph>
            Thank you for being a premium subscriber! You have access to all premium features.
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Premium Features Include:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <InventoryIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Equipment Management" secondary="Track all your beekeeping equipment in one place" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AnalyticsIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Analytics Dashboard" secondary="Advanced analytics for your beekeeping operation" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ChartsIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Data Export" secondary="Export your data in various formats" />
              </ListItem>
            </List>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelSubscription}
            >
              Cancel Subscription
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Typography variant="body1" paragraph>
            Upgrade to Premium to access advanced features and take your beekeeping to the next level.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {plans.map((plan) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <Card raised={plan.recommended} sx={{ height: '100%', position: 'relative' }}>
                  {plan.recommended && (
                    <Chip
                      label="Best Value"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: 16,
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                      <Typography variant="h4" component="span">
                        {plan.price}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                        {plan.period}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <List dense>
                      {plan.features.map((feature, i) => (
                        <ListItem key={i} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 34 }}>
                            <CheckIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={() => handleOpenPaymentDialog(plan.id as 'monthly' | 'yearly')}
                      sx={{ minWidth: 200 }}
                    >
                      Subscribe
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Premium Features Include:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Equipment Management</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Track and manage all your beekeeping equipment, from hive components to extraction tools.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Advanced Analytics</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Gain insights with visual charts and reports on hive performance, harvest trends, and more.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ChartsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Data Export</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Export your beekeeping data in CSV, Excel, or PDF formats for external analysis or record-keeping.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
      
      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Subscribe to {paymentPlan === 'monthly' ? 'Monthly' : 'Annual'} Premium Plan
        </DialogTitle>
        <DialogContent>
          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LockIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Secure Payment
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Plan Details
            </Typography>
            <Typography variant="body1">
              {paymentPlan === 'monthly' ? 'Monthly Premium Plan: $5.99/month' : 'Annual Premium Plan: $59.99/year'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Information
            </Typography>
            <TextField
              label="Card Number"
              variant="outlined"
              fullWidth
              margin="normal"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="•••• •••• •••• ••••"
              inputProps={{ maxLength: 16 }}
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="Expiry Date"
                variant="outlined"
                value={cardExpiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                inputProps={{ maxLength: 5 }}
                required
                sx={{ flex: 1 }}
              />
              <TextField
                label="CVC"
                variant="outlined"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                placeholder="•••"
                inputProps={{ maxLength: 3 }}
                required
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: This is a demonstration payment form. No actual payment will be processed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} disabled={processingPayment}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPayment}
            disabled={processingPayment || !cardNumber || !cardExpiry || !cardCvc}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <CreditCardIcon />}
          >
            {processingPayment ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};

export default PremiumPage;
