import React, { useState, useEffect, useCallback } from 'react';
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
  Autocomplete,
  Popper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
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
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Warning as WarningIcon,
  Air as AirIcon,
  Compress as CompressIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import styles from './WeatherPage.module.css';
import axios from 'axios';

const WeatherPage = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Feature states
  const [temperatureUnit, setTemperatureUnit] = useState('celsius');
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // New feature states
  const [showAlerts, setShowAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [showHourly, setShowHourly] = useState(false);
  const [weatherStats, setWeatherStats] = useState(null);

  const API_KEY = 'acc251998da0f72be8156b4334369ed6'; 
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';
  const GEO_URL = 'https://api.openweathermap.org/geo/1.0';
  const AQI_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const getWeatherIcon = (condition, size = 60) => {
    const iconMap = {
      Clear: <SunIcon sx={{ fontSize: size, color: '#FFD700' }} />,
      Clouds: <CloudIcon sx={{ fontSize: size, color: '#90A4AE' }} />,
      Rain: <RainIcon sx={{ fontSize: size, color: '#4FC3F7' }} />,
      Drizzle: <RainIcon sx={{ fontSize: size, color: '#4FC3F7' }} />,
      Thunderstorm: <ThunderIcon sx={{ fontSize: size, color: '#FF6F00' }} />,
      Snow: <SnowIcon sx={{ fontSize: size, color: '#E0E0E0' }} />,
      Mist: <FogIcon sx={{ fontSize: size, color: '#BDBDBD' }} />,
      Fog: <FogIcon sx={{ fontSize: size, color: '#BDBDBD' }} />,
      Haze: <FogIcon sx={{ fontSize: size, color: '#BDBDBD' }} />,
    };
    return iconMap[condition] || <CloudIcon sx={{ fontSize: size, color: '#90A4AE' }} />;
  };

  // Convert temperature
  const convertTemp = (celsius) => {
    if (temperatureUnit === 'fahrenheit') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  };

  const getTempUnit = () => {
    return temperatureUnit === 'celsius' ? '°C' : '°F';
  };

  // Search for cities using Geocoding API
  const searchCities = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCityOptions([]);
      return;
    }

    setIsSearchingCities(true);
    try {
      const response = await axios.get(
        `${GEO_URL}/direct?q=${searchTerm}&limit=10&appid=${API_KEY}`
      );
      
      const cities = response.data.map((city) => ({
        name: city.name,
        country: city.country,
        state: city.state,
        lat: city.lat,
        lon: city.lon,
        displayName: city.state 
          ? `${city.name}, ${city.state}, ${city.country}`
          : `${city.name}, ${city.country}`
      }));
      
      setCityOptions(cities);
    } catch (err) {
      console.error('Error searching cities:', err);
      setCityOptions([]);
    } finally {
      setIsSearchingCities(false);
    }
  }, [API_KEY]);

  // Debounce the city search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (inputValue && inputValue.length >= 2) {
        searchCities(inputValue);
      } else {
        setCityOptions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, searchCities]);

  // Fetch weather alerts
  const fetchWeatherAlerts = async (lat, lon) => {
    try {
      // Using the weather API to get alerts (if available)
      const response = await axios.get(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      // Check if alerts exist in the response
      if (response.data.alerts) {
        setWeatherAlerts(response.data.alerts);
      } else {
        setWeatherAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setWeatherAlerts([]);
    }
  };

  // Fetch air quality
  const fetchAirQuality = async (lat, lon) => {
    try {
      const response = await axios.get(
        `${AQI_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      if (response.data.list && response.data.list.length > 0) {
        const aqiData = response.data.list[0].components;
        const aqi = response.data.list[0].main.aqi;
        const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        setAirQuality({
          aqi: aqi,
          level: aqiLevels[aqi - 1] || 'Unknown',
          components: {
            pm25: aqiData.pm2_5,
            pm10: aqiData.pm10,
            no2: aqiData.no2,
            so2: aqiData.so2,
            co: aqiData.co,
            o3: aqiData.o3,
          }
        });
      }
    } catch (err) {
      console.error('Error fetching air quality:', err);
      setAirQuality(null);
    }
  };

  // Fetch weather stats (min/max, etc.)
  const fetchWeatherStats = async (cityName) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      setWeatherStats({
        tempMin: response.data.main.temp_min,
        tempMax: response.data.main.temp_max,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        windSpeed: response.data.wind.speed,
        windDeg: response.data.wind.deg,
        clouds: response.data.clouds.all,
        visibility: response.data.visibility,
      });
    } catch (err) {
      console.error('Error fetching weather stats:', err);
      setWeatherStats(null);
    }
  };

  const fetchWeather = async (cityName) => {
    if (!cityName.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch current weather
      const weatherResponse = await axios.get(
        `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      setWeatherData(weatherResponse.data);
      
      // Get coordinates for additional data
      const { lat, lon } = weatherResponse.data.coord;
      
      // Fetch alerts
      if (showAlerts) {
        await fetchWeatherAlerts(lat, lon);
      }
      
      // Fetch air quality
      await fetchAirQuality(lat, lon);
      
      // Fetch weather stats
      await fetchWeatherStats(cityName);
      
      // Check if city is in favorites
      const isFav = favorites.some(fav => 
        fav.toLowerCase() === weatherResponse.data.name.toLowerCase()
      );
      setIsFavorite(isFav);

      // Fetch 5-day forecast
      try {
        const forecastResponse = await axios.get(
          `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric&cnt=5`
        );
        setForecastData(forecastResponse.data);
      } catch (forecastErr) {
        console.error('Error fetching forecast:', forecastErr);
        setForecastData(null);
      }
      
      // Fetch hourly forecast (next 24 hours)
      try {
        const hourlyResponse = await axios.get(
          `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric&cnt=8`
        );
        setHourlyForecast(hourlyResponse.data);
      } catch (hourlyErr) {
        console.error('Error fetching hourly forecast:', hourlyErr);
        setHourlyForecast(null);
      }
      
      // Update recent searches
      const updatedSearches = [
        cityName,
        ...recentSearches.filter((item) => item !== cityName),
      ].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      setCity('');
      setInputValue('');
      setCityOptions([]);
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
    if (city) {
      fetchWeather(city);
    }
  };

  const handleRecentSearch = (cityName) => {
    fetchWeather(cityName);
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Toggle temperature unit
  const handleUnitChange = (event, newUnit) => {
    if (newUnit !== null) {
      setTemperatureUnit(newUnit);
    }
  };

  // Toggle favorite
  const toggleFavorite = () => {
    const cityName = weatherData?.name;
    if (!cityName) return;

    let updatedFavorites;
    if (isFavorite) {
      updatedFavorites = favorites.filter(fav => fav.toLowerCase() !== cityName.toLowerCase());
      setSnackbarMessage(`${cityName} removed from favorites`);
    } else {
      updatedFavorites = [...favorites, cityName];
      setSnackbarMessage(`${cityName} added to favorites`);
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
    setSnackbarOpen(true);
  };

  const handleRefresh = () => {
    if (weatherData) {
      fetchWeather(`${weatherData.name}, ${weatherData.sys.country}`);
    }
  };

  // Share weather
  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCopyWeather = () => {
    if (!weatherData) return;
    const shareText = `🌤️ Weather in ${weatherData.name}, ${weatherData.sys.country}
🌡️ Temperature: ${convertTemp(weatherData.main.temp)}${getTempUnit()}
💧 Humidity: ${weatherData.main.humidity}%
💨 Wind: ${weatherData.wind.speed} m/s
📅 ${formatDate(weatherData.dt)}
${weatherData.weather[0].description}`;
    
    navigator.clipboard.writeText(shareText);
    setSnackbarMessage('Weather information copied to clipboard!');
    setSnackbarOpen(true);
    setShareDialogOpen(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHour = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
    });
  };

  const getAqiColor = (aqi) => {
    const colors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#99004c'];
    return colors[aqi - 1] || '#808080';
  };

  // Custom Popper for Autocomplete dropdown
  const CustomPopper = (props) => {
    return (
      <Popper
        {...props}
        placement="bottom-start"
        style={{
          width: '100%',
          maxWidth: '800px',
          zIndex: 1300,
        }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
      />
    );
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.contentWrapper}>
        <Paper elevation={3} className={styles.header}>
          <Box className={styles.headerContent}>
            <Box className={styles.headerLeft}>
              <Typography variant="h3" component="h1" gutterBottom className={styles.title}>
                <LocationIcon sx={{ fontSize: 40, mr: 2 }} />
                Weather Forecast
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Search weather for any city in the world
              </Typography>
            </Box>
            <Box className={styles.headerRight}>
              <ToggleButtonGroup
                value={temperatureUnit}
                exclusive
                onChange={handleUnitChange}
                size="small"
                className={styles.unitToggle}
              >
                <ToggleButton value="celsius">°C</ToggleButton>
                <ToggleButton value="fahrenheit">°F</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Paper>

        <Box className={styles.searchWrapper}>
          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <Autocomplete
              fullWidth
              freeSolo
              options={cityOptions}
              inputValue={inputValue}
              onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
                setCity(newInputValue);
              }}
              onChange={(event, newValue) => {
                if (newValue && typeof newValue === 'object') {
                  const cityName = newValue.state 
                    ? `${newValue.name}, ${newValue.state}, ${newValue.country}`
                    : `${newValue.name}, ${newValue.country}`;
                  setCity(cityName);
                  setInputValue(cityName);
                  fetchWeather(cityName);
                } else if (newValue && typeof newValue === 'string') {
                  setCity(newValue);
                  setInputValue(newValue);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.displayName || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof value === 'string') return option.displayName === value;
                return option.displayName === value?.displayName;
              }}
              loading={isSearchingCities}
              loadingText="Searching cities..."
              noOptionsText={inputValue.length >= 2 ? "No cities found" : "Type at least 2 characters"}
              disabled={loading}
              className={styles.autocomplete}
              PopperComponent={CustomPopper}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Enter city name (e.g., London, Tokyo, New York)"
                  disabled={loading}
                  className={styles.searchInput}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="submit" disabled={loading}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} className={styles.autocompleteOption}>
                  <LocationIcon sx={{ mr: 1, color: '#1976d2', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body1" className={styles.optionName}>
                      {option.name}
                      {option.state && (
                        <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                          {option.state}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.country}
                    </Typography>
                  </Box>
                </Box>
              )}
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

        {/* Favorites Quick Access */}
        {favorites.length > 0 && (
          <Box className={styles.centerContent}>
            <Box className={styles.favoritesSection}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                ⭐ Favorites:
              </Typography>
              <Box className={styles.favoritesTags}>
                {favorites.map((cityName) => (
                  <Chip
                    key={cityName}
                    label={cityName}
                    onClick={() => fetchWeather(cityName)}
                    className={styles.favoriteTag}
                    icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}

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
          <>
            {/* Action Buttons */}
            <Box className={styles.centerContent}>
              <Box className={styles.actionButtons}>
                <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                  <IconButton onClick={toggleFavorite} className={styles.actionButton}>
                    {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Weather">
                  <IconButton onClick={handleRefresh} className={styles.actionButton}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share Weather">
                  <IconButton onClick={handleShare} className={styles.actionButton}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Toggle Alerts">
                  <IconButton 
                    onClick={() => setShowAlerts(!showAlerts)} 
                    className={styles.actionButton}
                    color={showAlerts ? 'primary' : 'default'}
                  >
                    {showAlerts ? <WarningIcon /> : <WarningIcon color="disabled" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Weather Alerts */}
            {showAlerts && weatherAlerts.length > 0 && (
              <Box className={styles.centerContent}>
                <Alert severity="warning" className={styles.alert}>
                  <Typography variant="subtitle2">⚠️ Weather Alert</Typography>
                  {weatherAlerts.map((alert, index) => (
                    <Typography key={index} variant="body2">
                      {alert.event}: {alert.description}
                    </Typography>
                  ))}
                </Alert>
              </Box>
            )}

            {/* Main Weather Cards */}
            <Box className={styles.weatherContainer}>
              <Grid container spacing={3} className={styles.weatherGrid} justifyContent="center">
                <Grid item xs={12} md={7}>
                  <Card className={styles.mainCard}>
                    <CardContent>
                      <Box className={styles.weatherHeader}>
                        <Box>
                          <Typography variant="h4" component="h2">
                            {weatherData.name}, {weatherData.sys.country}
                          </Typography>
                          <Typography variant="subtitle1" color="textSecondary">
                            {formatDate(weatherData.dt)}
                          </Typography>
                        </Box>
                        <Box className={styles.weatherActions}>
                          <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                            <IconButton onClick={toggleFavorite} size="small">
                              {isFavorite ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} size="small">
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share">
                            <IconButton onClick={handleShare} size="small">
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box className={styles.weatherMain}>
                        <Box className={styles.weatherIconContainer}>
                          {getWeatherIcon(weatherData.weather[0].main)}
                          <Typography variant="h1" className={styles.temperature}>
                            {convertTemp(weatherData.main.temp)}{getTempUnit()}
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
                                {convertTemp(weatherData.main.feels_like)}{getTempUnit()}
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

                      {/* Show More/Less Details */}
                      <Box className={styles.showMoreContainer}>
                        <Button
                          onClick={() => setShowDetails(!showDetails)}
                          className={styles.showMoreButton}
                          startIcon={showDetails ? <CompressIcon /> : <InfoIcon />}
                        >
                          {showDetails ? 'Show Less' : 'Show More Details'}
                        </Button>
                      </Box>

                      <Collapse in={showDetails}>
                        <Box className={styles.extendedDetails}>
                          <Divider className={styles.extendedDivider} />
                          
                          {/* Air Quality */}
                          {airQuality && (
                            <Box className={styles.airQualitySection}>
                              <Typography variant="subtitle2" gutterBottom>
                                <AirIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Air Quality Index
                              </Typography>
                              <Box className={styles.aqiDisplay}>
                                <Box 
                                  className={styles.aqiBar}
                                  sx={{ 
                                    backgroundColor: getAqiColor(airQuality.aqi),
                                    width: `${(airQuality.aqi / 5) * 100}%`
                                  }}
                                />
                                <Typography variant="body2">
                                  {airQuality.level} (AQI: {airQuality.aqi})
                                </Typography>
                              </Box>
                              <Grid container spacing={1} className={styles.aqiComponents}>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="textSecondary">PM2.5</Typography>
                                  <Typography variant="body2">{airQuality.components.pm25} µg/m³</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="textSecondary">PM10</Typography>
                                  <Typography variant="body2">{airQuality.components.pm10} µg/m³</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="textSecondary">NO₂</Typography>
                                  <Typography variant="body2">{airQuality.components.no2} µg/m³</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}

                          <Divider className={styles.extendedDivider} />

                          {/* Weather Stats */}
                          {weatherStats && (
                            <Box className={styles.statsSection}>
                              <Typography variant="subtitle2" gutterBottom>
                                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Weather Statistics
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">Min Temperature</Typography>
                                  <Typography variant="body2">{convertTemp(weatherStats.tempMin)}{getTempUnit()}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">Max Temperature</Typography>
                                  <Typography variant="body2">{convertTemp(weatherStats.tempMax)}{getTempUnit()}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">Wind Direction</Typography>
                                  <Typography variant="body2">{weatherStats.windDeg}°</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">Cloud Cover</Typography>
                                  <Typography variant="body2">{weatherStats.clouds}%</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
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
                          {formatTime(weatherData.sys.sunrise)}
                        </Typography>
                      </Box>
                      <Box className={styles.sideInfo}>
                        <Typography variant="body2" color="textSecondary">
                          Sunset
                        </Typography>
                        <Typography variant="body1" className={styles.sideInfoValue}>
                          {formatTime(weatherData.sys.sunset)}
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

            {/* Hourly Forecast Toggle */}
            <Box className={styles.centerContent}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showHourly}
                    onChange={() => setShowHourly(!showHourly)}
                    color="primary"
                  />
                }
                label="Show Hourly Forecast"
                className={styles.hourlyToggle}
              />
            </Box>

            {/* Hourly Forecast */}
            {showHourly && hourlyForecast && hourlyForecast.list && (
              <Box className={styles.centerContent}>
                <Box className={styles.hourlySection}>
                  <Typography variant="h6" gutterBottom className={styles.forecastTitle}>
                    ⏰ 24-Hour Forecast
                  </Typography>
                  <Box className={styles.hourlyGrid}>
                    {hourlyForecast.list.map((hour, index) => (
                      <Paper key={index} className={styles.hourlyCard}>
                        <Typography variant="caption" color="textSecondary">
                          {formatHour(hour.dt)}
                        </Typography>
                        <Box className={styles.hourlyIcon}>
                          {getWeatherIcon(hour.weather[0].main, 24)}
                        </Box>
                        <Typography variant="body2" className={styles.hourlyTemp}>
                          {convertTemp(hour.main.temp)}{getTempUnit()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" className={styles.hourlyDesc}>
                          {hour.weather[0].description}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {/* 5-Day Forecast */}
            {forecastData && forecastData.list && (
              <Box className={styles.centerContent}>
                <Box className={styles.forecastSection}>
                  <Typography variant="h6" gutterBottom className={styles.forecastTitle}>
                    📅 5-Day Forecast
                  </Typography>
                  <Grid container spacing={2} className={styles.forecastGrid}>
                    {forecastData.list.map((day, index) => (
                      <Grid item xs={12} sm={6} md={2.4} key={index}>
                        <Paper className={styles.forecastCard}>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(day.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                          <Box className={styles.forecastIcon}>
                            {getWeatherIcon(day.weather[0].main, 30)}
                          </Box>
                          <Typography variant="h6" className={styles.forecastTemp}>
                            {convertTemp(day.main.temp)}{getTempUnit()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" className={styles.forecastDesc}>
                            {day.weather[0].description}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}
          </>
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Weather Information</DialogTitle>
        <DialogContent>
          <List>
            <ListItem button onClick={handleCopyWeather}>
              <ListItemIcon><CopyIcon /></ListItemIcon>
              <ListItemText primary="Copy to Clipboard" secondary="Copy weather information as text" />
            </ListItem>
            <ListItem button onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Weather in ${weatherData?.name}`,
                  text: `🌤️ Weather in ${weatherData?.name}, ${weatherData?.sys.country}\n🌡️ Temperature: ${convertTemp(weatherData?.main.temp)}${getTempUnit()}\n💧 Humidity: ${weatherData?.main.humidity}%\n💨 Wind: ${weatherData?.wind.speed} m/s`,
                });
                setShareDialogOpen(false);
              }
            }}>
              <ListItemIcon><ShareIcon /></ListItemIcon>
              <ListItemText primary="Share via..." secondary="Share using native sharing" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default WeatherPage;