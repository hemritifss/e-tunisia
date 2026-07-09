import '../../styles/weather.css';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain,
  CloudSnow, CloudLightning, Umbrella,
} from 'lucide-react';

// Tier 2.7 — per-trip-day weather from open-meteo (free, no API key). Trips don't
// carry real calendar dates yet (that's 2.1), so we forecast relative to today:
// day 1 = today, day 2 = tomorrow, … which is the honest "if you leave today" view.

type Cond = { Icon: React.ComponentType<{ size?: number }>; label: string };

/** WMO weather interpretation code → icon + label. */
function wmo(code: number): Cond {
  if (code === 0) return { Icon: Sun, label: 'Clear' };
  if (code === 1 || code === 2) return { Icon: CloudSun, label: 'Partly cloudy' };
  if (code === 3) return { Icon: Cloud, label: 'Overcast' };
  if (code === 45 || code === 48) return { Icon: CloudFog, label: 'Fog' };
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, label: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { Icon: CloudRain, label: 'Rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { Icon: CloudSnow, label: 'Snow' };
  if (code >= 95) return { Icon: CloudLightning, label: 'Thunderstorm' };
  return { Icon: Cloud, label: 'Cloudy' };
}

interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
}

async function fetchForecast(lat: number, lon: number): Promise<{ daily: DailyForecast }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=16`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`weather ${r.status}`);
  return r.json();
}

/** Compact weather chip for a trip day. Renders nothing if data is unavailable or out of range. */
export function WeatherBadge({ lat, lon, dayOffset }: { lat: number; lon: number; dayOffset: number }) {
  const ok = Number.isFinite(lat) && Number.isFinite(lon);
  const { data } = useQuery({
    queryKey: ['weather', lat.toFixed(2), lon.toFixed(2)],
    queryFn: () => fetchForecast(lat, lon),
    enabled: ok,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });
  const daily = data?.daily;
  if (!ok || !daily || dayOffset < 0 || dayOffset >= (daily.time?.length || 0)) return null;

  const { Icon, label } = wmo(daily.weather_code[dayOffset]);
  const max = Math.round(daily.temperature_2m_max[dayOffset]);
  const min = Math.round(daily.temperature_2m_min[dayOffset]);
  const rain = daily.precipitation_probability_max?.[dayOffset] ?? 0;

  return (
    <span className="trip-weather" title={`${label} · high ${max}° / low ${min}° · ${rain}% chance of rain`}>
      <Icon size={14} />
      <span className="trip-weather-temp">{max}°<span className="trip-weather-min">/{min}°</span></span>
      {rain >= 50 && (
        <span className="trip-weather-rain"><Umbrella size={11} /> pack for rain</span>
      )}
    </span>
  );
}
