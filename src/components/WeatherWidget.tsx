"use client";

import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from "lucide-react";

interface WeatherData {
  temp_F: string;
  weatherDesc: string;
  windspeedMiles: string;
  humidity: string;
  weatherCode: string;
}

const CACHE_KEY = "fh-weather-cache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function getWeatherIcon(code: string) {
  const c = parseInt(code);
  if (c === 113) return <Sun className="w-6 h-6 text-amber-400" />;
  if (c === 116 || c === 119) return <Cloud className="w-6 h-6 text-cream/70" />;
  if (c >= 176 && c <= 356) return <CloudRain className="w-6 h-6 text-blue-300" />;
  if (c >= 368 && c <= 395) return <CloudSnow className="w-6 h-6 text-blue-200" />;
  if (c >= 200 && c <= 232) return <CloudLightning className="w-6 h-6 text-yellow-300" />;
  return <Sun className="w-6 h-6 text-amber-400" />;
}

export function WeatherWidget({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      // Check cache
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setWeather(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch("https://wttr.in/American+Fork,UT?format=j1");
        if (!res.ok) throw new Error("Weather fetch failed");
        const json = await res.json();
        const current = json.current_condition?.[0];
        if (current) {
          const data: WeatherData = {
            temp_F: current.temp_F,
            weatherDesc: current.weatherDesc?.[0]?.value ?? "Unknown",
            windspeedMiles: current.windspeedMiles,
            humidity: current.humidity,
            weatherCode: current.weatherCode,
          };
          setWeather(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        }
      } catch {
        // Silently fail — widget is non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading || !weather) return null;

  const isDark = variant === "dark";

  return (
    <div
      className={`rounded-2xl p-4 ${
        isDark
          ? "bg-green-700/40 backdrop-blur-sm border border-cream/10"
          : "bg-white/80 backdrop-blur-sm ring-1 ring-green-800/10"
      }`}
    >
      <div className="flex items-center gap-3">
        {getWeatherIcon(weather.weatherCode)}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-heading font-bold ${isDark ? "text-cream" : "text-green-900"}`}>
              {weather.temp_F}°F
            </span>
            <span className={`text-sm truncate ${isDark ? "text-cream/60" : "text-muted-foreground"}`}>
              {weather.weatherDesc}
            </span>
          </div>
          <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? "text-cream/40" : "text-muted-foreground"}`}>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {weather.windspeedMiles} mph
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              {weather.humidity}%
            </span>
          </div>
        </div>
      </div>
      <div className={`mt-2 pt-2 border-t text-[10px] tracking-wide uppercase ${
        isDark ? "border-cream/10 text-cream/30" : "border-cream-dark text-muted-foreground/50"
      }`}>
        American Fork, UT
      </div>
    </div>
  );
}
