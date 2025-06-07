import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Container } from '@mui/material';
import CalendarView from './components/Calendar/CalendarView';

// Create a simplified theme for the demo
const theme = createTheme({
  palette: {
    primary: {
      main: '#f5a623', // Golden honey color
      light: '#ffc853',
      dark: '#c17800',
      contrastText: '#fff',
    },
    secondary: {
      main: '#795548', // Brown wood color
      light: '#a98274',
      dark: '#4b2c20',
      contrastText: '#fff',
    },
    background: {
      default: '#f9f9f9',
    },
  }
});

// Sample data
const demoApiaries = [
  { id: '1', name: 'Meadow Apiary' },
  { id: '2', name: 'Forest Edge Apiary' }
];

const demoHives = [
  { id: '1', name: 'Queen Bee', apiary_id: '1' },
  { id: '2', name: 'Worker Bee', apiary_id: '1' },
  { id: '3', name: 'Honey Maker', apiary_id: '2' }
];

const CalendarDemo: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Beekeeper Pro - Calendar Demo
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Plan and manage your beekeeping activities
          </Typography>
          
          <Box sx={{ mt: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
            <CalendarView 
              apiaries={demoApiaries} 
              hives={demoHives} 
            />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default CalendarDemo;
