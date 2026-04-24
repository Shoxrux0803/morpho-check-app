import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Tooltip, CircularProgress, Popover, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import OpacityIcon from '@mui/icons-material/Opacity';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import { useLanguage } from '../contexts/LanguageContext';

export default function WeatherClock() {
  const { lang, t } = useLanguage();
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setTime(new Date()), 1000);

    const fetchWeatherAndLocation = async (lat, lon) => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
        if (weatherRes.ok) {
           const weatherData = await weatherRes.json();
           setWeather(weatherData.current_weather);
           setDailyForecast(weatherData.daily);
        }

        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          setLocationName(geoData.city || geoData.locality || "");
        }
      } catch (error) {
        console.error("Error fetching weather/location:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFallback = async () => {
       try {
           const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
           const ipGeo = await fetch(`${API_URL}/utils/geo-ip`);
           if (ipGeo.ok) {
               const data = await ipGeo.json();
               if (data.latitude && data.longitude) {
                   fetchWeatherAndLocation(data.latitude, data.longitude);
               } else {
                   setLoading(false);
               }
           } else {
               setLoading(false);
           }
       } catch (err) {
           console.error("IP check failed:", err);
           setLoading(false);
       }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherAndLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied or error, fallback to IP.");
          fetchFallback();
        },
        { timeout: 5000 }
      );
    } else {
      fetchFallback();
    }

    return () => clearInterval(timer);
  }, [lang]);

  const getWeatherIcon = (code, isDay = 1, size = 18) => {
    const isNight = isDay === 0;
    
    if (code === 0 || code === 1) {
      return isNight 
        ? <NightsStayIcon sx={{ color: '#90CAF9', fontSize: size }} />
        : <WbSunnyIcon sx={{ color: '#FFB300', fontSize: size }} />;
    }
    
    if (code >= 2 && code <= 3) return <CloudIcon sx={{ color: isNight ? '#78909C' : '#90A4AE', fontSize: size }} />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <OpacityIcon sx={{ color: '#4FC3F7', fontSize: size }} />;
    if (code >= 71 && code <= 86) return <AcUnitIcon sx={{ color: '#E0F7FA', fontSize: size }} />;
    if (code >= 95) return <ThunderstormIcon sx={{ color: '#FFA000', fontSize: size }} />;
    
    return <CloudIcon sx={{ color: '#90A4AE', fontSize: size }} />;
  };

  const getWeatherDescription = (code) => {
    if (code === 0 || code === 1) return t('weatherClear');
    if (code >= 2 && code <= 3) return t('weatherCloudy');
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return t('weatherRainy');
    if (code >= 71 && code <= 86) return t('weatherSnowy');
    if (code >= 95) return t('weatherStormy');
    return t('weatherCloudy');
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    return t(dayKeys[day]);
  };

  const localeMap = {
    uz: 'uz-UZ',
    ru: 'ru-RU',
    en: 'en-US',
    kz: 'kk-KZ'
  };
  const currentLocale = localeMap[lang] || 'en-US';

  const formattedTime = time.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString(currentLocale, { weekday: 'long', month: 'long', day: 'numeric' });

  const handleOpenPopover = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const formatSunTime = (isoStr) => {
    if (!isoStr) return "--:--";
    return new Date(isoStr).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Stack 
        direction="row" 
        spacing={1.5} 
        alignItems="center" 
        onClick={handleOpenPopover}
        sx={{ 
          px: 2, 
          py: 0.75, 
          mr: 1.5,
          cursor: 'pointer',
          borderRadius: '100px', 
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)' 
            : 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 100%)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.02)',
          backdropFilter: 'blur(10px)',
          display: { xs: 'none', lg: 'flex' },
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.05)',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Tooltip title={formattedDate} arrow placement="bottom">
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <AccessTimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: 0.5 }}>
              {formattedTime}
            </Typography>
          </Stack>
        </Tooltip>
        
        <Box sx={{ width: '1px', height: 16, bgcolor: 'divider', mx: '4px !important' }} />

        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            <CircularProgress size={14} thickness={5} sx={{ color: 'text.secondary' }} />
          </Box>
        ) : weather ? (
          <Tooltip title={locationName ? `${locationName} • ${t('windSpeed')}: ${weather.windspeed} km/s` : `${t('windSpeed')}: ${weather.windspeed} km/s`} arrow placement="bottom">
            <Stack direction="row" alignItems="center" spacing={0.75}>
              {locationName && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                  <LocationOnIcon sx={{ fontSize: 14, mr: 0.2, color: 'error.light' }}/>
                  <Box component="span" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {locationName}
                  </Box>
                </Typography>
              )}
              {getWeatherIcon(weather.weathercode, weather.is_day)}
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {Math.round(weather.temperature)}°
              </Typography>
            </Stack>
          </Tooltip>
        ) : (
           <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>--°</Typography>
        )}
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 310,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 35, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <Box sx={{ p: 2.5, pb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('weatherForecast')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
            {locationName || t('locationDetected')}
          </Typography>
          
          {dailyForecast && dailyForecast.sunrise && dailyForecast.sunset && (
            <Stack direction="row" spacing={3} sx={{ mt: 2, mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WbTwilightIcon sx={{ color: '#FFB300', fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" display="block" sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1 }}>
                    {t('sunrise')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatSunTime(dailyForecast.sunrise[0])}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <NightsStayIcon sx={{ color: '#90CAF9', fontSize: 18 }} />
                <Box>
                  <Typography variant="caption" display="block" sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1 }}>
                    {t('sunset')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatSunTime(dailyForecast.sunset[0])}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}

          <Divider sx={{ my: 2, opacity: 0.6 }} />

          {dailyForecast ? (
            <Stack spacing={1.2}>
              {dailyForecast.time.map((date, index) => {
                const dayNameDisplay = getDayName(date);
                const dayNum = new Date(date).getDate();
                const isToday = index === 0;
                const weatherCode = dailyForecast.weathercode[index];

                return (
                  <Stack 
                    key={date} 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ 
                      p: 1, 
                      borderRadius: 1.5,
                      transition: 'background 0.2s',
                      bgcolor: isToday ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' : 'transparent',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 90 }}>
                      <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 500, width: 45, color: isToday ? 'primary.main' : 'text.primary' }}>
                        {isToday ? t('today') : dayNameDisplay}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                         {dayNum}
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1, justifyContent: 'center' }}>
                      {getWeatherIcon(weatherCode, 1, 20)}
                      <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', fontSize: 10, maxWidth: 65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getWeatherDescription(weatherCode)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ minWidth: 60, justifyContent: 'flex-end' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {Math.round(dailyForecast.temperature_2m_max[index])}°
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', opacity: 0.7 }}>
                        {Math.round(dailyForecast.temperature_2m_min[index])}°
                      </Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </Box>
        
        <Box sx={{ p: 1.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', opacity: 0.8 }}>
            Open-Meteo API
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
