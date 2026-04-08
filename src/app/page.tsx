"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Calendar, Users, Trophy, ArrowRight, Shield } from "lucide-react";

function useCountdown(targetMs: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetMs) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  if (!targetMs || targetMs <= now) return null;

  const diff = targetMs - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export default function HomePage() {
  const currentWeek = useQuery(api.weeks.getCurrent);
  const players = useQuery(api.players.listAll);
  const allWeeks = useQuery(api.weeks.listAll);

  const countdown = useCountdown(currentWeek?.playDate ?? null);

  const playerCount = players?.length ?? 0;
  const weekCount = allWeeks?.length ?? 0;

  const playDate = currentWeek
    ? new Date(currentWeek.playDate)
    : null;

  return (
    <div className="min-h-screen bg-green-800 text-cream relative overflow-hidden">
      {/* Background — Fox Hollow sunset banner */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/home_banner.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-800/80 via-green-800/90 to-green-800" />
        <div className="absolute inset-0 bg-gradient-to-r from-green-800/95 to-transparent" />
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #f5f0e8 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-6 md:px-12 md:py-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="Fox Hollow Golf Club"
                className="h-10 w-auto brightness-110"
              />
              <span className="text-lg font-medium tracking-wide uppercase text-cream/80">
                Men&apos;s League
              </span>
            </div>
            <Link
              href="/sign-in"
              className="text-sm text-cream/40 hover:text-cream/70 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-8">
          <div className="max-w-4xl">
            {/* Tag */}
            <div className="animate-fade-in-delay">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brass/10 border border-brass/20 text-brass text-xs tracking-widest uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
                {currentWeek?.status === "open" ? "Submissions Open" : "Season in Progress"}
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.92] mb-4 animate-fade-in">
              Fox Hollow
              <br />
              <span className="text-brass">Men&apos;s League</span>
            </h1>

            <p className="text-cream/50 text-sm tracking-widest uppercase mb-8 animate-fade-in-delay">
              American Fork, Utah&ensp;·&ensp;Est. 2026
            </p>

            {/* Countdown */}
            {countdown && playDate && (
              <div className="mb-10 animate-fade-in-delay-2">
                <p className="text-cream/40 text-xs uppercase tracking-widest mb-3">
                  Next Play Date{currentWeek?.format ? ` · ${currentWeek.format}` : ""}
                </p>
                <div className="flex gap-4">
                  {[
                    { value: countdown.days, label: "Days" },
                    { value: countdown.hours, label: "Hours" },
                    { value: countdown.minutes, label: "Min" },
                    { value: countdown.seconds, label: "Sec" },
                  ].map((unit) => (
                    <div key={unit.label} className="text-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-green-700/50 border border-cream/10 flex items-center justify-center mb-1">
                        <span className="font-heading text-3xl md:text-4xl text-cream">
                          {unit.value}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-cream/30">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-cream/30 text-sm mt-3">
                  {playDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* No week but show description */}
            {!countdown && (
              <p className="text-cream/60 text-lg md:text-xl max-w-xl leading-relaxed mb-10 animate-fade-in-delay">
                Weekly golf, good company, and a little friendly competition.
                Submit your preferences, get your pairings, and hit the links.
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2">
              <Link
                href="/play"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brass text-green-900 font-semibold rounded-xl hover:bg-brass-light active:scale-[0.98] transition-all text-center text-lg shadow-lg shadow-brass/20"
              >
                Submit Your Preferences
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/manager"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-cream/20 text-cream rounded-xl hover:bg-cream/10 active:scale-[0.98] transition-all text-center"
              >
                <Shield className="w-4 h-4 text-cream/50" />
                Manager
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 mt-12 animate-fade-in-delay-2">
              {[
                { icon: Users, value: playerCount, label: "Players" },
                { icon: Calendar, value: weekCount, label: "Rounds" },
                { icon: Trophy, value: "Active", label: "Season" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-brass/60" />
                  <span className="text-cream/80 font-medium">{stat.value}</span>
                  <span className="text-cream/30 text-sm">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weather widget — positioned on the side on desktop */}
          <div className="mt-10 md:absolute md:top-40 md:right-12 lg:right-24 md:w-64 animate-fade-in-delay-2">
            <WeatherWidget variant="dark" />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 md:px-12 animate-fade-in-delay-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-cream/30 text-sm">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="Fox Hollow"
                className="h-6 w-auto opacity-50"
              />
              <p>Fox Hollow Golf Club</p>
            </div>
            <p className="text-cream/20">American Fork, Utah · Est. 2026</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
