import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Tooltip, CircularProgress } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import OpacityIcon from '@mui/icons-material/Opacity';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function WeatherClock() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setTime(new Date()), 1000);

    const fetchWeatherAndLocation = async (lat, lon) => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (weatherRes.ok) {
           const weatherData = await weatherRes.json();
           setWeather(weatherData.current_weather);
        }

        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=uz`);
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
           const ipGeo = await fetch("https://ipapi.co/json/");
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
  }, []);

  const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return <WbSunnyIcon sx={{ color: '#FFB300', fontSize: 18 }} />;
    if (code >= 2 && code <= 3) return <CloudIcon sx={{ color: '#90A4AE', fontSize: 18 }} />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <OpacityIcon sx={{ color: '#4FC3F7', fontSize: 18 }} />;
    if (code >= 71 && code <= 86) return <AcUnitIcon sx={{ color: '#E0F7FA', fontSize: 18 }} />;
    if (code >= 95) return <ThunderstormIcon sx={{ color: '#FFA000', fontSize: 18 }} />;
    return <CloudIcon sx={{ color: '#90A4AE', fontSize: 18 }} />;
  };

  const formattedTime = time.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Stack 
      direction="row" 
      spacing={1.5} 
      alignItems="center" 
      sx={{ 
        px: 2, 
        py: 0.75, 
        mr: 1.5,
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
        <Tooltip title={locationName ? `${locationName} • Shamol: ${weather.windspeed} km/s` : `Shamol: ${weather.windspeed} km/s`} arrow placement="bottom">
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {locationName && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                <LocationOnIcon sx={{ fontSize: 14, mr: 0.2, color: 'error.light' }}/>
                <Box component="span" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {locationName}
                </Box>
              </Typography>
            )}
            {getWeatherIcon(weather.weathercode)}
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {Math.round(weather.temperature)}°
            </Typography>
          </Stack>
        </Tooltip>
      ) : (
         <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>--°</Typography>
      )}
    </Stack>
  );
}
