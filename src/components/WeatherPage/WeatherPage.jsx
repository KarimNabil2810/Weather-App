import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  WbSunny as SunIcon,
  Cloud as CloudIcon,
  Thunderstorm as ThunderIcon,
  WaterDrop as RainIcon,
  AcUnit as SnowIcon,
  Foggy as FogIcon,
} from '@mui/icons-material';
import styles from './WeatherPage.module.css';
import axios from 'axios';

const WeatherPage = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  const API_KEY = 'acc251998da0f72be8156b4334369ed6'; 
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const getWeatherIcon = (condition) => {
    const iconMap = {
      Clear: <SunIcon sx={{ fontSize: 60, color: '#FFD700' }} />,
      Clouds: <CloudIcon sx={{ fontSize: 60, color: '#90A4AE' }} />,
      Rain: <RainIcon sx={{ fontSize: 60, color: '#4FC3F7' }} />,
      Drizzle: <RainIcon sx={{ fontSize: 60, color: '#4FC3F7' }} />,
      Thunderstorm: <ThunderIcon sx={{ fontSize: 60, color: '#FF6F00' }} />,
      Snow: <SnowIcon sx={{ fontSize: 60, color: '#E0E0E0' }} />,
      Mist: <FogIcon sx={{ fontSize: 60, color: '#BDBDBD' }} />,
      Fog: <FogIcon sx={{ fontSize: 60, color: '#BDBDBD' }} />,
      Haze: <FogIcon sx={{ fontSize: 60, color: '#BDBDBD' }} />,
    };
    return iconMap[condition] || <CloudIcon sx={{ fontSize: 60, color: '#90A4AE' }} />;
  };

  const fetchWeather = async (cityName) => {
    if (!cityName.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      
      setWeatherData(response.data);
      
      const updatedSearches = [
        cityName,
        ...recentSearches.filter((item) => item !== cityName),
      ].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      setCity('');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('City not found. Please check the city name and try again.');
      } else {
        setError('Failed to fetch weather data. Please try again.');
      }
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  const handleRecentSearch = (cityName) => {
    fetchWeather(cityName);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.contentWrapper}>
        <Paper elevation={3} className={styles.header}>
          <Typography variant="h3" component="h1" gutterBottom className={styles.title}>
            <LocationIcon sx={{ fontSize: 40, mr: 2 }} />
            Weather Forecast
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            Search weather for any city in the world
          </Typography>
        </Paper>

        <Box className={styles.searchWrapper}>
          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter city name (e.g., London, Tokyo, New York)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={styles.searchInput}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" disabled={loading}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              className={styles.searchButton}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </form>
        </Box>

        {error && (
          <Box className={styles.centerContent}>
            <Alert severity="error" className={styles.alert}>
              {error}
            </Alert>
          </Box>
        )}

        {recentSearches.length > 0 && (
          <Box className={styles.centerContent}>
            <Box className={styles.recentSearches}>
              <Box className={styles.recentSearchesHeader}>
                <Typography variant="subtitle2" color="textSecondary">
                  Recent Searches:
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClearRecentSearches}
                  className={styles.clearButton}
                >
                  Clear All
                </Button>
              </Box>
              <Box className={styles.recentTags}>
                {recentSearches.map((cityName) => (
                  <Button
                    key={cityName}
                    variant="outlined"
                    size="small"
                    onClick={() => handleRecentSearch(cityName)}
                    className={styles.recentTag}
                  >
                    {cityName}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {weatherData && (
          <Box className={styles.weatherContainer}>
            <Grid container spacing={3} className={styles.weatherGrid} justifyContent="center">
              <Grid item xs={12} md={7}>
                <Card className={styles.mainCard}>
                  <CardContent>
                    <Box className={styles.weatherHeader}>
                      <Typography variant="h4" component="h2">
                        {weatherData.name}, {weatherData.sys.country}
                      </Typography>
                      <Typography variant="subtitle1" color="textSecondary">
                        {formatDate(weatherData.dt)}
                      </Typography>
                    </Box>

                    <Box className={styles.weatherMain}>
                      <Box className={styles.weatherIconContainer}>
                        {getWeatherIcon(weatherData.weather[0].main)}
                        <Typography variant="h1" className={styles.temperature}>
                          {Math.round(weatherData.main.temp)}°C
                        </Typography>
                        <Typography variant="h6" color="textSecondary" className={styles.weatherDescription}>
                          {weatherData.weather[0].description}
                        </Typography>
                      </Box>

                      <Grid container spacing={2} className={styles.weatherDetails}>
                        <Grid item xs={6} sm={3}>
                          <Paper className={styles.detailItem}>
                            <Typography variant="caption" color="textSecondary">
                              Feels Like
                            </Typography>
                            <Typography variant="h6">
                              {Math.round(weatherData.main.feels_like)}°C
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper className={styles.detailItem}>
                            <Typography variant="caption" color="textSecondary">
                              Humidity
                            </Typography>
                            <Typography variant="h6">
                              {weatherData.main.humidity}%
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper className={styles.detailItem}>
                            <Typography variant="caption" color="textSecondary">
                              Wind Speed
                            </Typography>
                            <Typography variant="h6">
                              {weatherData.wind.speed} m/s
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper className={styles.detailItem}>
                            <Typography variant="caption" color="textSecondary">
                              Pressure
                            </Typography>
                            <Typography variant="h6">
                              {weatherData.main.pressure} hPa
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card className={styles.sideCard}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom className={styles.sideCardTitle}>
                      Additional Information
                    </Typography>
                    <Box className={styles.sideInfo}>
                      <Typography variant="body2" color="textSecondary">
                        Sunrise
                      </Typography>
                      <Typography variant="body1" className={styles.sideInfoValue}>
                        {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Box className={styles.sideInfo}>
                      <Typography variant="body2" color="textSecondary">
                        Sunset
                      </Typography>
                      <Typography variant="body1" className={styles.sideInfoValue}>
                        {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Box className={styles.sideInfo}>
                      <Typography variant="body2" color="textSecondary">
                        Visibility
                      </Typography>
                      <Typography variant="body1" className={styles.sideInfoValue}>
                        {(weatherData.visibility / 1000).toFixed(1)} km
                      </Typography>
                    </Box>
                    <Box className={styles.sideInfo}>
                      <Typography variant="body2" color="textSecondary">
                        Cloud Cover
                      </Typography>
                      <Typography variant="body1" className={styles.sideInfoValue}>
                        {weatherData.clouds.all}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {!weatherData && !loading && !error && (
          <Box className={styles.centerContent}>
            <Paper className={styles.welcomeCard}>
              <Typography variant="h5" gutterBottom>
                🌍 Welcome to Weather Forecast
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Search for any city in the world to get current weather information
              </Typography>
              <Box className={styles.exampleCities}>
                <Typography variant="caption" color="textSecondary">
                  Try searching for:
                </Typography>
                <Box className={styles.exampleTags}>
                  {['London', 'Tokyo', 'New York', 'Paris', 'Sydney'].map((cityName) => (
                    <Button
                      key={cityName}
                      variant="outlined"
                      size="small"
                      onClick={() => fetchWeather(cityName)}
                      className={styles.exampleTag}
                    >
                      {cityName}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default WeatherPage;