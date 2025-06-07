import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Opacity as RainIcon,
  AcUnit as SnowIcon,
  Air as WindIcon,
  WaterDrop as HumidityIcon,
  Thermostat as TemperatureIcon,
  LocationOn as LocationIcon,
  Science as BeekeepingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Apiary } from '../../lib/supabase';

// Mock weather API response interface
interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
  };
  forecast: {
    forecastday: {
      date: string;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
      };
    }[];
  };
}

// Mock weather API data for demo purposes
const MOCK_WEATHER_DATA: Record<string, WeatherData> = {
  'warm': {
    location: {
      name: 'Sunny Valley Apiary',
      region: 'California',
      country: 'USA',
      lat: 37.7749,
      lon: -122.4194,
      localtime: '2025-03-22 14:30',
    },
    current: {
      temp_c: 24,
      temp_f: 75.2,
      condition: {
        text: 'Sunny',
        icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
        code: 1000,
      },
      wind_mph: 5.6,
      wind_kph: 9.0,
      wind_dir: 'WSW',
      humidity: 48,
      cloud: 10,
      feelslike_c: 25.1,
      feelslike_f: 77.2,
      uv: 6,
    },
    forecast: {
      forecastday: [
        {
          date: '2025-03-22',
          day: {
            maxtemp_c: 26,
            maxtemp_f: 78.8,
            mintemp_c: 15,
            mintemp_f: 59.0,
            avgtemp_c: 20.5,
            avgtemp_f: 68.9,
            condition: {
              text: 'Sunny',
              icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
              code: 1000,
            },
            uv: 7,
          },
          astro: {
            sunrise: '06:27 AM',
            sunset: '19:15 PM',
          },
        },
        {
          date: '2025-03-23',
          day: {
            maxtemp_c: 28,
            maxtemp_f: 82.4,
            mintemp_c: 16,
            mintemp_f: 60.8,
            avgtemp_c: 22,
            avgtemp_f: 71.6,
            condition: {
              text: 'Partly cloudy',
              icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
              code: 1003,
            },
            uv: 6,
          },
          astro: {
            sunrise: '06:26 AM',
            sunset: '19:16 PM',
          },
        },
        {
          date: '2025-03-24',
          day: {
            maxtemp_c: 27,
            maxtemp_f: 80.6,
            mintemp_c: 17,
            mintemp_f: 62.6,
            avgtemp_c: 22,
            avgtemp_f: 71.6,
            condition: {
              text: 'Sunny',
              icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
              code: 1000,
            },
            uv: 7,
          },
          astro: {
            sunrise: '06:25 AM',
            sunset: '19:17 PM',
          },
        },
      ],
    },
  },
  'moderate': {
    location: {
      name: 'Green Hill Apiary',
      region: 'North Carolina',
      country: 'USA',
      lat: 35.2271,
      lon: -80.8431,
      localtime: '2025-03-22 14:30',
    },
    current: {
      temp_c: 18,
      temp_f: 64.4,
      condition: {
        text: 'Partly cloudy',
        icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
        code: 1003,
      },
      wind_mph: 7.5,
      wind_kph: 12.1,
      wind_dir: 'NE',
      humidity: 65,
      cloud: 40,
      feelslike_c: 18,
      feelslike_f: 64.4,
      uv: 4,
    },
    forecast: {
      forecastday: [
        {
          date: '2025-03-22',
          day: {
            maxtemp_c: 20,
            maxtemp_f: 68.0,
            mintemp_c: 12,
            mintemp_f: 53.6,
            avgtemp_c: 16,
            avgtemp_f: 60.8,
            condition: {
              text: 'Partly cloudy',
              icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
              code: 1003,
            },
            uv: 4,
          },
          astro: {
            sunrise: '06:35 AM',
            sunset: '19:00 PM',
          },
        },
        {
          date: '2025-03-23',
          day: {
            maxtemp_c: 22,
            maxtemp_f: 71.6,
            mintemp_c: 13,
            mintemp_f: 55.4,
            avgtemp_c: 17.5,
            avgtemp_f: 63.5,
            condition: {
              text: 'Sunny',
              icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
              code: 1000,
            },
            uv: 5,
          },
          astro: {
            sunrise: '06:34 AM',
            sunset: '19:01 PM',
          },
        },
        {
          date: '2025-03-24',
          day: {
            maxtemp_c: 19,
            maxtemp_f: 66.2,
            mintemp_c: 12,
            mintemp_f: 53.6,
            avgtemp_c: 15.5,
            avgtemp_f: 59.9,
            condition: {
              text: 'Light rain',
              icon: '//cdn.weatherapi.com/weather/64x64/day/296.png',
              code: 1183,
            },
            uv: 3,
          },
          astro: {
            sunrise: '06:33 AM',
            sunset: '19:02 PM',
          },
        },
      ],
    },
  },
  'cold': {
    location: {
      name: 'Northern Meadows Apiary',
      region: 'Minnesota',
      country: 'USA',
      lat: 44.9778,
      lon: -93.2650,
      localtime: '2025-03-22 14:30',
    },
    current: {
      temp_c: 5,
      temp_f: 41.0,
      condition: {
        text: 'Cloudy',
        icon: '//cdn.weatherapi.com/weather/64x64/day/119.png',
        code: 1006,
      },
      wind_mph: 10.5,
      wind_kph: 16.9,
      wind_dir: 'NW',
      humidity: 75,
      cloud: 90,
      feelslike_c: 2,
      feelslike_f: 35.6,
      uv: 2,
    },
    forecast: {
      forecastday: [
        {
          date: '2025-03-22',
          day: {
            maxtemp_c: 7,
            maxtemp_f: 44.6,
            mintemp_c: 1,
            mintemp_f: 33.8,
            avgtemp_c: 4,
            avgtemp_f: 39.2,
            condition: {
              text: 'Cloudy',
              icon: '//cdn.weatherapi.com/weather/64x64/day/119.png',
              code: 1006,
            },
            uv: 2,
          },
          astro: {
            sunrise: '06:45 AM',
            sunset: '18:50 PM',
          },
        },
        {
          date: '2025-03-23',
          day: {
            maxtemp_c: 6,
            maxtemp_f: 42.8,
            mintemp_c: -1,
            mintemp_f: 30.2,
            avgtemp_c: 2.5,
            avgtemp_f: 36.5,
            condition: {
              text: 'Light snow',
              icon: '//cdn.weatherapi.com/weather/64x64/day/326.png',
              code: 1213,
            },
            uv: 1,
          },
          astro: {
            sunrise: '06:44 AM',
            sunset: '18:51 PM',
          },
        },
        {
          date: '2025-03-24',
          day: {
            maxtemp_c: 3,
            maxtemp_f: 37.4,
            mintemp_c: -2,
            mintemp_f: 28.4,
            avgtemp_c: 0.5,
            avgtemp_f: 32.9,
            condition: {
              text: 'Moderate snow',
              icon: '//cdn.weatherapi.com/weather/64x64/day/329.png',
              code: 1219,
            },
            uv: 1,
          },
          astro: {
            sunrise: '06:43 AM',
            sunset: '18:52 PM',
          },
        },
      ],
    },
  },
};

// Beekeeping activity recommendations based on weather conditions
const getBeekeepingRecommendations = (weatherData: WeatherData | null): string[] => {
  if (!weatherData) return [];
  
  const temp = weatherData.current.temp_c;
  const windSpeed = weatherData.current.wind_kph;
  const condition = weatherData.current.condition.text.toLowerCase();
  const humidity = weatherData.current.humidity;
  
  const recommendations: string[] = [];
  
  // Temperature recommendations
  if (temp > 28) {
    recommendations.push('Ensure hives have adequate ventilation and shade');
    recommendations.push('Check water sources for bees');
  } else if (temp >= 14 && temp <= 28) {
    recommendations.push('Ideal temperature for hive inspections');
    
    if (temp >= 20) {
      recommendations.push('Good conditions for honey harvest if frames are capped');
    }
  } else if (temp >= 10 && temp < 14) {
    recommendations.push('Brief inspections only, keep hive open for minimal time');
    recommendations.push('Avoid extensive manipulations');
  } else {
    recommendations.push('Too cold for inspection, leave hives closed');
    recommendations.push('Check food stores from outside if possible');
  }
  
  // Wind recommendations
  if (windSpeed > 20) {
    recommendations.push('Avoid opening hives in high winds');
    recommendations.push('Check hive security and weights');
  } else if (windSpeed > 10) {
    recommendations.push('Position yourself to block wind when opening hives');
    recommendations.push('Keep inspection time short');
  }
  
  // Condition-based recommendations
  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
    recommendations.push('Postpone hive inspections until dry weather');
    recommendations.push('Check hive entrances are clear to prevent flooding');
  } else if (condition.includes('snow')) {
    recommendations.push('Clear snow from hive entrances if necessary');
    recommendations.push('Ensure adequate ventilation to prevent moisture buildup');
  } else if (condition.includes('fog') || humidity > 85) {
    recommendations.push('Wait for fog to clear before inspection');
    recommendations.push('High humidity may increase disease risk - keep inspections brief');
  }

  return recommendations;
};

// Weather icon based on condition
const getWeatherIcon = (conditionText: string) => {
  const condition = conditionText.toLowerCase();
  
  if (condition.includes('sunny') || condition.includes('clear')) {
    return <SunnyIcon sx={{ fontSize: 40, color: '#f5a623' }} />;
  } else if (condition.includes('cloud') || condition.includes('overcast')) {
    return <CloudyIcon sx={{ fontSize: 40, color: '#90a4ae' }} />;
  } else if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('shower')
  ) {
    return <RainIcon sx={{ fontSize: 40, color: '#64b5f6' }} />;
  } else if (
    condition.includes('snow') ||
    condition.includes('blizzard') ||
    condition.includes('ice')
  ) {
    return <SnowIcon sx={{ fontSize: 40, color: '#b3e5fc' }} />;
  } else {
    return <CloudyIcon sx={{ fontSize: 40, color: '#90a4ae' }} />;
  }
};

// Format date utility
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const ApiaryWeather: React.FC = () => {
  const { isPremium } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Apiaries state
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('');
  
  // Weather data state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  // Get mock weather data based on apiary (in a real app, this would call a weather API)
  const getMockWeatherData = (apiaryId: string) => {
    // For demonstration, we'll use different mock data based on the apiary
    const selectedApiary = apiaries.find(apiary => apiary.id === apiaryId);
    
    if (!selectedApiary) {
      return MOCK_WEATHER_DATA['moderate']; // Default
    }
    
    // Get geographic info from apiary location or name
    const location = selectedApiary.location.toLowerCase();
    
    if (location.includes('california') || location.includes('florida') || location.includes('texas')) {
      return MOCK_WEATHER_DATA['warm'];
    } else if (
      location.includes('minnesota') ||
      location.includes('maine') ||
      location.includes('montana')
    ) {
      return MOCK_WEATHER_DATA['cold'];
    } else {
      return MOCK_WEATHER_DATA['moderate'];
    }
  };
  
  // Load apiaries
  useEffect(() => {
    if (!isPremium) return;
    
    const fetchApiaries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('apiaries')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setApiaries(data);
          
          // Select first apiary by default
          if (data.length > 0 && !selectedApiaryId) {
            setSelectedApiaryId(data[0].id);
            setWeatherData(getMockWeatherData(data[0].id));
          }
        }
      } catch (err) {
        console.error('Error fetching apiaries:', err);
        setError('Failed to load apiaries.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApiaries();
  }, [isPremium]);
  
  // Handle apiary selection change
  const handleApiaryChange = (event: SelectChangeEvent) => {
    const apiaryId = event.target.value;
    setSelectedApiaryId(apiaryId);
    setWeatherData(getMockWeatherData(apiaryId));
  };
  
  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CloudyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Apiary Weather Forecast
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          This is a premium feature that provides weather forecasts for your apiaries and beekeeping recommendations.
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
  
  if (apiaries.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Apiary Weather
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          You don't have any apiaries yet. Add an apiary to see weather forecasts.
        </Alert>
        <Button variant="contained" color="primary" href="/apiaries">
          Add Apiary
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Apiary Weather Forecast
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="apiary-select-label">Select Apiary</InputLabel>
          <Select
            labelId="apiary-select-label"
            value={selectedApiaryId}
            label="Select Apiary"
            onChange={handleApiaryChange}
          >
            {apiaries.map((apiary) => (
              <MenuItem key={apiary.id} value={apiary.id}>
                {apiary.name} - {apiary.location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      
      {weatherData && (
        <>
          {/* Current Weather */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">
                  {weatherData.location.name}
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getWeatherIcon(weatherData.current.condition.text)}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h3">
                        {weatherData.current.temp_c}°C
                      </Typography>
                      <Typography variant="subtitle1">
                        {weatherData.current.condition.text}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TemperatureIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>
                          Feels like: {weatherData.current.feelslike_c}°C
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HumidityIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>
                          Humidity: {weatherData.current.humidity}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WindIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>
                          Wind: {weatherData.current.wind_kph} km/h {weatherData.current.wind_dir}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last updated: {weatherData.location.localtime}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Beekeeping Recommendations */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BeekeepingIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Beekeeping Recommendations
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {getBeekeepingRecommendations(weatherData).map((recommendation, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Chip
                    label={recommendation}
                    variant="outlined"
                    color="primary"
                    sx={{ 
                      height: 'auto', 
                      py: 1,
                      '& .MuiChip-label': { 
                        whiteSpace: 'normal',
                        display: 'block',
                        py: 0.5
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
          
          {/* 3-Day Forecast */}
          <Typography variant="h6" gutterBottom>
            3-Day Forecast
          </Typography>
          
          <Grid container spacing={3}>
            {weatherData.forecast.forecastday.map((day) => (
              <Grid item xs={12} sm={4} key={day.date}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {formatDate(day.date)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getWeatherIcon(day.day.condition.text)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h5">
                          {day.day.avgtemp_c}°C
                        </Typography>
                        <Typography variant="body2">
                          {day.day.condition.text}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Min: {day.day.mintemp_c}°C
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Max: {day.day.maxtemp_c}°C
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Sunrise: {day.astro.sunrise}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Sunset: {day.astro.sunset}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Note: This is demonstration weather data and not actual real-time weather.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default ApiaryWeather;
