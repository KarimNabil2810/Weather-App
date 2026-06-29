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
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
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
  Air as AirIcon,
  Compress as CompressIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  CompareArrows as CompareIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Mic as MicIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
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
  
  // New features
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [compareCity, setCompareCity] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const themes = {
    light: {
      name: 'Light',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      primary: '#667eea',
      secondary: '#764ba2',
      cardBg: 'rgba(255, 255, 255, 0.85)',
      text: '#1a1a2e',
      textSecondary: 'rgba(0, 0, 0, 0.6)',
      border: 'rgba(0, 0, 0, 0.08)',
      glass: 'rgba(255, 255, 255, 0.7)',
      shadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
      inputBg: 'rgba(255, 255, 255, 0.9)',
    },
    dark: {
      name: 'Dark',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      primary: '#667eea',
      secondary: '#764ba2',
      cardBg: 'rgba(255, 255, 255, 0.08)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.1)',
      glass: 'rgba(255, 255, 255, 0.06)',
      shadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      inputBg: 'rgba(255, 255, 255, 0.08)',
    }
  };

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
    const savedHistory = localStorage.getItem('weatherHistory');
    if (savedHistory) {
      setWeatherHistory(JSON.parse(savedHistory));
    }
    // Apply theme
    handleThemeChange('light');
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

  // Theme handler
  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName);
    const theme = themes[themeName];
    if (theme) {
      document.documentElement.style.setProperty('--bg-gradient', theme.background);
      document.documentElement.style.setProperty('--text-color', theme.text);
      document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
      document.documentElement.style.setProperty('--card-bg', theme.cardBg);
      document.documentElement.style.setProperty('--border-color', theme.border);
      document.documentElement.style.setProperty('--glass-bg', theme.glass);
      document.documentElement.style.setProperty('--shadow', theme.shadow);
      document.documentElement.style.setProperty('--input-bg', theme.inputBg);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    handleThemeChange(newTheme);
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

  // Voice Search
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsVoiceSearch(true);
        setSnackbarMessage('Listening... Speak the city name');
        setSnackbarOpen(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setInputValue(transcript);
        setCity(transcript);
        setIsVoiceSearch(false);
        setSnackbarMessage(`Searching for: ${transcript}`);
        setSnackbarOpen(true);
        fetchWeather(transcript);
      };

      recognition.onerror = () => {
        setIsVoiceSearch(false);
        setSnackbarMessage('Voice recognition failed. Please try again.');
        setSnackbarOpen(true);
      };

      recognition.onend = () => {
        setIsVoiceSearch(false);
      };

      recognition.start();
    } else {
      setSnackbarMessage('Voice search is not supported in your browser');
      setSnackbarOpen(true);
    }
  };

  // Compare Weather
  const handleCompare = async (cityName) => {
    if (!cityName || !cityName.trim()) {
      setSnackbarMessage('Please enter a city name to compare');
      setSnackbarOpen(true);
      return;
    }
    try {
      const response = await axios.get(
        `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      setCompareData(response.data);
      setShowCompare(true);
      setSnackbarMessage(`Comparison loaded for ${cityName}`);
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage('City not found for comparison. Please check the name.');
      setSnackbarOpen(true);
      setCompareData(null);
    }
  };

  // Download Weather Data
  const downloadWeatherData = () => {
    if (!weatherData) return;
    
    const data = {
      city: weatherData.name,
      country: weatherData.sys.country,
      date: new Date().toISOString(),
      temperature: convertTemp(weatherData.main.temp),
      feels_like: convertTemp(weatherData.main.feels_like),
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      wind_speed: weatherData.wind.speed,
      weather: weatherData.weather[0].description,
      forecast: forecastData?.list?.map(day => ({
        date: new Date(day.dt * 1000).toDateString(),
        temp: convertTemp(day.main.temp),
        weather: day.weather[0].description,
      })) || [],
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_${weatherData.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbarMessage('Weather data downloaded!');
    setSnackbarOpen(true);
  };

  // Print Weather
  const printWeather = () => {
    window.print();
  };

  // Save to history
  const saveToHistory = (data) => {
    if (!data) return;
    const historyEntry = {
      city: data.name,
      country: data.sys.country,
      temp: data.main.temp,
      weather: data.weather[0].description,
      date: new Date().toISOString(),
    };
    
    const newHistory = [historyEntry, ...weatherHistory].slice(0, 20);
    setWeatherHistory(newHistory);
    localStorage.setItem('weatherHistory', JSON.stringify(newHistory));
  };

  // Fetch weather alerts
  const fetchWeatherAlerts = async (lat, lon) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
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

  // Fetch weather stats
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
      const weatherResponse = await axios.get(
        `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      setWeatherData(weatherResponse.data);
      
      // Save to history
      saveToHistory(weatherResponse.data);
      
      const { lat, lon } = weatherResponse.data.coord;
      
      if (showAlerts) {
        await fetchWeatherAlerts(lat, lon);
      }
      
      await fetchAirQuality(lat, lon);
      await fetchWeatherStats(cityName);
      
      const isFav = favorites.some(fav => 
        fav.toLowerCase() === weatherResponse.data.name.toLowerCase()
      );
      setIsFavorite(isFav);

      try {
        const forecastResponse = await axios.get(
          `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric&cnt=5`
        );
        setForecastData(forecastResponse.data);
      } catch (forecastErr) {
        console.error('Error fetching forecast:', forecastErr);
        setForecastData(null);
      }
      
      try {
        const hourlyResponse = await axios.get(
          `${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=metric&cnt=8`
        );
        setHourlyForecast(hourlyResponse.data);
      } catch (hourlyErr) {
        console.error('Error fetching hourly forecast:', hourlyErr);
        setHourlyForecast(null);
      }
      
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

  const handleUnitChange = (event, newUnit) => {
    if (newUnit !== null) {
      setTemperatureUnit(newUnit);
    }
  };

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
    <Box className={`${styles.container} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
      <Box className={styles.contentWrapper}>
        <Paper elevation={3} className={styles.header}>
          <Box className={styles.headerContent}>
            <Box className={styles.headerLeft}>
              <Typography variant="h3" component="h1" gutterBottom className={styles.title}>
                <LocationIcon sx={{ fontSize: 40, mr: 2 }} />
                Weather Forecast
              </Typography>
              <Typography variant="subtitle1" className={styles.subtitle}>
                Search weather for any city in the world
              </Typography>
            </Box>
            <Box className={styles.headerRight}>
              <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton onClick={toggleTheme} className={styles.themeToggle}>
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
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
                  <LocationIcon sx={{ mr: 1, color: '#667eea', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body1" className={styles.optionName}>
                      {option.name}
                      {option.state && (
                        <Typography component="span" variant="body2" className={styles.optionState}>
                          {option.state}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" className={styles.optionCountry}>
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

        {/* Voice Search */}
        <Box className={styles.centerContent}>
          <Box className={styles.voiceSearchContainer}>
            <IconButton 
              onClick={startVoiceSearch} 
              className={styles.voiceButton}
              disabled={isVoiceSearch}
            >
              <MicIcon />
              {isVoiceSearch && <CircularProgress size={20} className={styles.voiceProgress} />}
            </IconButton>
            <Typography variant="caption" className={styles.voiceText}>
              {isVoiceSearch ? 'Listening...' : 'Voice Search'}
            </Typography>
          </Box>
        </Box>

        {/* Favorites Quick Access */}
        {favorites.length > 0 && (
          <Box className={styles.centerContent}>
            <Box className={styles.favoritesSection}>
              <Typography variant="subtitle2" className={styles.favoritesLabel}>
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
                <Typography variant="subtitle2" className={styles.recentLabel}>
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
              </Box>
            </Box>

            {/* Compare Section */}
            <Box className={styles.centerContent}>
              <Box className={styles.compareSection}>
                <TextField
                  size="small"
                  placeholder="Enter city to compare"
                  value={compareCity}
                  onChange={(e) => setCompareCity(e.target.value)}
                  className={styles.compareInput}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && compareCity) {
                      handleCompare(compareCity);
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleCompare(compareCity)}
                  className={styles.compareButton}
                  startIcon={<CompareIcon />}
                >
                  Compare
                </Button>
                {compareData && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowCompare(!showCompare)}
                    className={styles.toggleCompareButton}
                  >
                    {showCompare ? 'Hide' : 'Show'} Comparison
                  </Button>
                )}
              </Box>
            </Box>

            {/* Comparison Results */}
            {showCompare && compareData && weatherData && (
              <Box className={styles.centerContent}>
                <Paper className={styles.compareResults}>
                  <Typography variant="h6" className={styles.compareTitle}>
                    Weather Comparison
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper className={styles.compareCard}>
                        <Typography variant="subtitle2" className={styles.compareCityName}>{weatherData.name}</Typography>
                        <Typography variant="h4" className={styles.compareTemp}>{convertTemp(weatherData.main.temp)}°</Typography>
                        <Typography variant="caption" className={styles.compareDesc}>{weatherData.weather[0].description}</Typography>
                        <Typography variant="caption" className={styles.compareDesc}>Humidity: {weatherData.main.humidity}%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper className={styles.compareCard}>
                        <Typography variant="subtitle2" className={styles.compareCityName}>{compareData.name}</Typography>
                        <Typography variant="h4" className={styles.compareTemp}>{convertTemp(compareData.main.temp)}°</Typography>
                        <Typography variant="caption" className={styles.compareDesc}>{compareData.weather[0].description}</Typography>
                        <Typography variant="caption" className={styles.compareDesc}>Humidity: {compareData.main.humidity}%</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Box className={styles.compareDiff}>
                    <Typography variant="body2" className={styles.compareDiffText}>
                      Temperature Difference: {Math.abs(Math.round(weatherData.main.temp - compareData.main.temp))}°C
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* Weather Alerts */}
            {showAlerts && weatherAlerts.length > 0 && (
              <Box className={styles.centerContent}>
                <Alert severity="warning" className={styles.alert}>
                  <Typography variant="subtitle2" className={styles.alertTitle}>⚠️ Weather Alert</Typography>
                  {weatherAlerts.map((alert, index) => (
                    <Typography key={index} variant="body2" className={styles.alertText}>
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
                          <Typography variant="h4" component="h2" className={styles.cityName}>
                            {weatherData.name}, {weatherData.sys.country}
                          </Typography>
                          <Typography variant="subtitle1" className={styles.weatherDate}>
                            {formatDate(weatherData.dt)}
                          </Typography>
                        </Box>
                        <Box className={styles.weatherActions}>
                          <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                            <IconButton onClick={toggleFavorite} size="small" className={styles.weatherActionIcon}>
                              {isFavorite ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} size="small" className={styles.weatherActionIcon}>
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share">
                            <IconButton onClick={handleShare} size="small" className={styles.weatherActionIcon}>
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
                          <Typography variant="h6" className={styles.weatherDescription}>
                            {weatherData.weather[0].description}
                          </Typography>
                        </Box>

                        <Grid container spacing={2} className={styles.weatherDetails}>
                          <Grid item xs={6} sm={3}>
                            <Paper className={styles.detailItem}>
                              <Typography variant="caption" className={styles.detailLabel}>
                                Feels Like
                              </Typography>
                              <Typography variant="h6" className={styles.detailValue}>
                                {convertTemp(weatherData.main.feels_like)}{getTempUnit()}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Paper className={styles.detailItem}>
                              <Typography variant="caption" className={styles.detailLabel}>
                                Humidity
                              </Typography>
                              <Typography variant="h6" className={styles.detailValue}>
                                {weatherData.main.humidity}%
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Paper className={styles.detailItem}>
                              <Typography variant="caption" className={styles.detailLabel}>
                                Wind Speed
                              </Typography>
                              <Typography variant="h6" className={styles.detailValue}>
                                {weatherData.wind.speed} m/s
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Paper className={styles.detailItem}>
                              <Typography variant="caption" className={styles.detailLabel}>
                                Pressure
                              </Typography>
                              <Typography variant="h6" className={styles.detailValue}>
                                {weatherData.main.pressure} hPa
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>

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
                          
                          {airQuality && (
                            <Box className={styles.airQualitySection}>
                              <Typography variant="subtitle2" className={styles.sectionTitle}>
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
                                <Typography variant="body2" className={styles.aqiText}>
                                  {airQuality.level} (AQI: {airQuality.aqi})
                                </Typography>
                              </Box>
                              <Grid container spacing={1} className={styles.aqiComponents}>
                                <Grid item xs={4}>
                                  <Typography variant="caption" className={styles.aqiLabel}>PM2.5</Typography>
                                  <Typography variant="body2" className={styles.aqiValue}>{airQuality.components.pm25} µg/m³</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" className={styles.aqiLabel}>PM10</Typography>
                                  <Typography variant="body2" className={styles.aqiValue}>{airQuality.components.pm10} µg/m³</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" className={styles.aqiLabel}>NO₂</Typography>
                                  <Typography variant="body2" className={styles.aqiValue}>{airQuality.components.no2} µg/m³</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}

                          <Divider className={styles.extendedDivider} />

                          {weatherStats && (
                            <Box className={styles.statsSection}>
                              <Typography variant="subtitle2" className={styles.sectionTitle}>
                                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Weather Statistics
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" className={styles.statsLabel}>Min Temperature</Typography>
                                  <Typography variant="body2" className={styles.statsValue}>{convertTemp(weatherStats.tempMin)}{getTempUnit()}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" className={styles.statsLabel}>Max Temperature</Typography>
                                  <Typography variant="body2" className={styles.statsValue}>{convertTemp(weatherStats.tempMax)}{getTempUnit()}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" className={styles.statsLabel}>Wind Direction</Typography>
                                  <Typography variant="body2" className={styles.statsValue}>{weatherStats.windDeg}°</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" className={styles.statsLabel}>Cloud Cover</Typography>
                                  <Typography variant="body2" className={styles.statsValue}>{weatherStats.clouds}%</Typography>
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
                      <Typography variant="h6" className={styles.sideCardTitle}>
                        Additional Information
                      </Typography>
                      <Box className={styles.sideInfo}>
                        <Typography variant="body2" className={styles.sideInfoLabel}>
                          Sunrise
                        </Typography>
                        <Typography variant="body1" className={styles.sideInfoValue}>
                          {formatTime(weatherData.sys.sunrise)}
                        </Typography>
                      </Box>
                      <Box className={styles.sideInfo}>
                        <Typography variant="body2" className={styles.sideInfoLabel}>
                          Sunset
                        </Typography>
                        <Typography variant="body1" className={styles.sideInfoValue}>
                          {formatTime(weatherData.sys.sunset)}
                        </Typography>
                      </Box>
                      <Box className={styles.sideInfo}>
                        <Typography variant="body2" className={styles.sideInfoLabel}>
                          Visibility
                        </Typography>
                        <Typography variant="body1" className={styles.sideInfoValue}>
                          {(weatherData.visibility / 1000).toFixed(1)} km
                        </Typography>
                      </Box>
                      <Box className={styles.sideInfo}>
                        <Typography variant="body2" className={styles.sideInfoLabel}>
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
                  <Typography variant="h6" className={styles.forecastTitle}>
                    ⏰ 24-Hour Forecast
                  </Typography>
                  <Box className={styles.hourlyGrid}>
                    {hourlyForecast.list.map((hour, index) => (
                      <Paper key={index} className={styles.hourlyCard}>
                        <Typography variant="caption" className={styles.hourlyTime}>
                          {formatHour(hour.dt)}
                        </Typography>
                        <Box className={styles.hourlyIcon}>
                          {getWeatherIcon(hour.weather[0].main, 24)}
                        </Box>
                        <Typography variant="body2" className={styles.hourlyTemp}>
                          {convertTemp(hour.main.temp)}{getTempUnit()}
                        </Typography>
                        <Typography variant="caption" className={styles.hourlyDesc}>
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
                  <Typography variant="h6" className={styles.forecastTitle}>
                    📅 5-Day Forecast
                  </Typography>
                  <Grid container spacing={2} className={styles.forecastGrid}>
                    {forecastData.list.map((day, index) => (
                      <Grid item xs={12} sm={6} md={2.4} key={index}>
                        <Paper className={styles.forecastCard}>
                          <Typography variant="caption" className={styles.forecastDay}>
                            {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                          </Typography>
                          <Typography variant="caption" className={styles.forecastDate}>
                            {new Date(day.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                          <Box className={styles.forecastIcon}>
                            {getWeatherIcon(day.weather[0].main, 30)}
                          </Box>
                          <Typography variant="h6" className={styles.forecastTemp}>
                            {convertTemp(day.main.temp)}{getTempUnit()}
                          </Typography>
                          <Typography variant="caption" className={styles.forecastDesc}>
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
              <Typography variant="h5" className={styles.welcomeTitle}>
                🌍 Welcome to Weather Forecast
              </Typography>
              <Typography variant="body1" className={styles.welcomeText}>
                Search for any city in the world to get current weather information
              </Typography>
              <Box className={styles.exampleCities}>
                <Typography variant="caption" className={styles.exampleLabel}>
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

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Weather actions"
        className={styles.speedDial}
        icon={<SpeedDialIcon />}
        direction="up"
      >
        <SpeedDialAction
          icon={<DownloadIcon />}
          tooltipTitle="Download Weather Data"
          onClick={downloadWeatherData}
        />
        <SpeedDialAction
          icon={<PrintIcon />}
          tooltipTitle="Print Weather"
          onClick={printWeather}
        />
      </SpeedDial>

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