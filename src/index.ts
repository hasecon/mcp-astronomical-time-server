#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Rate limiting en DDoS bescherming
class RateLimiter {
  private requests: Map<string, Array<number>> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly maxRequestsPerMinute: number;

  constructor(
    windowMs: number = 15 * 60 * 1000, // 15 minuten
    maxRequests: number = 100, // Max requests per window
    maxRequestsPerMinute: number = 20 // Max requests per minuut
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    
    // Cleanup oude entries elke 5 minuten
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  isAllowed(identifier: string = 'default'): { allowed: boolean, resetTime?: number, remaining?: number } {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Verwijder oude requests buiten het window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    // Check requests per minuut (strengere limiet)
    const recentRequests = validRequests.filter(time => now - time < 60 * 1000);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      return {
        allowed: false,
        resetTime: Math.min(...recentRequests) + 60 * 1000,
        remaining: 0
      };
    }
    
    // Check totaal requests in window
    if (validRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        resetTime: Math.min(...validRequests) + this.windowMs,
        remaining: 0
      };
    }
    
    // Request toevoegen
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return {
      allowed: true,
      remaining: Math.min(
        this.maxRequests - validRequests.length,
        this.maxRequestsPerMinute - recentRequests.length - 1
      )
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  getStats(): { totalClients: number, totalRequests: number } {
    const totalRequests = Array.from(this.requests.values())
      .reduce((sum, requests) => sum + requests.length, 0);
    
    return {
      totalClients: this.requests.size,
      totalRequests
    };
  }
}

// Request monitoring en logging
class RequestMonitor {
  private requestCount: number = 0;
  private errorCount: number = 0;
  private startTime: number = Date.now();
  private toolUsage: Map<string, number> = new Map();

  logRequest(toolName: string, success: boolean = true): void {
    this.requestCount++;
    if (!success) this.errorCount++;
    
    const currentCount = this.toolUsage.get(toolName) || 0;
    this.toolUsage.set(toolName, currentCount + 1);
  }

  getStats(): {
    totalRequests: number,
    errorRate: number,
    uptime: number,
    mostUsedTools: Array<{tool: string, count: number}>
  } {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    
    const mostUsedTools = Array.from(this.toolUsage.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests: this.requestCount,
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: Math.round(uptime / 1000), // in seconds
      mostUsedTools
    };
  }
}

// Initialiseer rate limiter en monitor
const rateLimiter = new RateLimiter();
const requestMonitor = new RequestMonitor();

// Nederlandse feestdagen en werkdagen
class DutchCalendar {
  static getEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  static getDutchHolidays(year: number): Array<{date: Date, name: string, type: string}> {
    const easter = this.getEasterSunday(year);
    const holidays = [
      { date: new Date(year, 0, 1), name: "Nieuwjaarsdag", type: "national" },
      { date: new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000), name: "Goede Vrijdag", type: "national" },
      { date: easter, name: "Eerste Paasdag", type: "national" },
      { date: new Date(easter.getTime() + 24 * 60 * 60 * 1000), name: "Tweede Paasdag", type: "national" },
      { date: new Date(year, 3, 27), name: "Koningsdag", type: "national" },
      { date: new Date(year, 4, 5), name: "Bevrijdingsdag", type: year % 5 === 0 ? "national" : "commemorative" },
      { date: new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000), name: "Hemelvaart", type: "national" },
      { date: new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000), name: "Eerste Pinksterdag", type: "national" },
      { date: new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000), name: "Tweede Pinksterdag", type: "national" },
      { date: new Date(year, 11, 25), name: "Eerste Kerstdag", type: "national" },
      { date: new Date(year, 11, 26), name: "Tweede Kerstdag", type: "national" }
    ];
    
    // Koningsdag op 26 april als 27 april een zondag is
    if (holidays.find(h => h.name === "Koningsdag")!.date.getDay() === 0) {
      holidays.find(h => h.name === "Koningsdag")!.date = new Date(year, 3, 26);
    }
    
    return holidays;
  }

  static isWorkDay(date: Date): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false; // Weekend
    
    const holidays = this.getDutchHolidays(date.getFullYear());
    return !holidays.some(h => 
      h.type === "national" && 
      h.date.toDateString() === date.toDateString()
    );
  }

  static getWorkDaysBetween(startDate: Date, endDate: Date): number {
    let workDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isWorkDay(currentDate)) {
        workDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workDays;
  }
}

// Internationale feestdagen via Nager.Date API (gratis, geen API key nodig)
class InternationalHolidays {
  static async fetchHolidays(countryCode: string, year: number): Promise<Array<{
    date: string,
    localName: string,
    name: string,
    countryCode: string,
    fixed: boolean,
    global: boolean,
    counties: string[] | null,
    launchYear: number | null,
    types: string[]
  }>> {
    try {
      // Nager.Date API - gratis en betrouwbaar
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
  }

  static async getCountries(): Promise<Array<{
    countryCode: string,
    name: string
  }>> {
    try {
      const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  static getCountryCodeByName(countryName: string): string {
    const commonCodes: {[key: string]: string} = {
      'nederland': 'NL', 'netherlands': 'NL', 'dutch': 'NL',
      'duitsland': 'DE', 'germany': 'DE', 'deutschland': 'DE',
      'belgie': 'BE', 'belgium': 'BE', 'belgique': 'BE',
      'frankrijk': 'FR', 'france': 'FR',
      'verenigd koninkrijk': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB',
      'italie': 'IT', 'italy': 'IT', 'italia': 'IT',
      'spanje': 'ES', 'spain': 'ES', 'espana': 'ES',
      'polen': 'PL', 'poland': 'PL', 'polska': 'PL',
      'zwitserland': 'CH', 'switzerland': 'CH', 'schweiz': 'CH',
      'oostenrijk': 'AT', 'austria': 'AT', 'osterreich': 'AT',
      'denemarken': 'DK', 'denmark': 'DK', 'danmark': 'DK',
      'zweden': 'SE', 'sweden': 'SE', 'sverige': 'SE',
      'noorwegen': 'NO', 'norway': 'NO', 'norge': 'NO',
      'finland': 'FI', 'suomi': 'FI',
      'verenigde staten': 'US', 'usa': 'US', 'america': 'US', 'united states': 'US',
      'canada': 'CA', 'kanada': 'CA',
      'australie': 'AU', 'australia': 'AU',
      'nieuw zeeland': 'NZ', 'new zealand': 'NZ',
      'japan': 'JP', 'nippon': 'JP',
      'zuid korea': 'KR', 'south korea': 'KR', 'korea': 'KR',
      'china': 'CN', 'zhongguo': 'CN',
      'india': 'IN', 'bharat': 'IN',
      'brazilie': 'BR', 'brazil': 'BR', 'brasil': 'BR',
      'rusland': 'RU', 'russia': 'RU', 'rossiya': 'RU'
    };
    
    const normalized = countryName.toLowerCase().trim();
    return commonCodes[normalized] || countryName.toUpperCase();
  }
}

// Circadiaanse ritme en bioklok
class CircadianCalculator {
  static getOptimalTimes(sunriseTime: Date): {
    wakeUp: Date,
    morningLight: Date,
    productivityPeak1: Date,
    lunch: Date,
    productivityPeak2: Date,
    exerciseTime: Date,
    dinnerTime: Date,
    windDown: Date,
    sleepTime: Date
  } {
    const sunrise = sunriseTime.getTime();
    
    return {
      wakeUp: new Date(sunrise - 30 * 60000), // 30 min voor zonsopgang
      morningLight: new Date(sunrise + 15 * 60000), // 15 min na zonsopgang
      productivityPeak1: new Date(sunrise + 3 * 60 * 60000), // 3 uur na zonsopgang
      lunch: new Date(sunrise + 6 * 60 * 60000), // 6 uur na zonsopgang
      productivityPeak2: new Date(sunrise + 8 * 60 * 60000), // 8 uur na zonsopgang
      exerciseTime: new Date(sunrise + 10 * 60 * 60000), // 10 uur na zonsopgang
      dinnerTime: new Date(sunrise + 12 * 60 * 60000), // 12 uur na zonsopgang
      windDown: new Date(sunrise + 14 * 60 * 60000), // 14 uur na zonsopgang
      sleepTime: new Date(sunrise + 16 * 60 * 60000) // 16 uur na zonsopgang
    };
  }

  static getJetLagRecovery(timezoneDifference: number): {
    recoveryDays: number,
    tips: string[]
  } {
    const recoveryDays = Math.ceil(Math.abs(timezoneDifference) / 1.5);
    const isEastward = timezoneDifference > 0;
    
    const tips = [
      `Herstel duurt ongeveer ${recoveryDays} dagen`,
      isEastward ? "Oostwaarts reizen is zwaarder (tegen je bioklok in)" : "Westwaarts reizen is gemakkelijker",
      "Zoek licht in de ochtend, vermijd licht in de avond",
      "Pas je slaaptijd 1-2 dagen voor vertrek al aan",
      "Drink veel water en vermijd alcohol tijdens de vlucht"
    ];
    
    return { recoveryDays, tips };
  }
}

// Pomodoro en productiviteit
class ProductivityTimer {
  static getPomodoroSchedule(startTime: Date, sessions: number = 4): Array<{
    type: string,
    start: Date,
    end: Date,
    duration: number
  }> {
    const schedule = [];
    let currentTime = new Date(startTime);
    
    for (let i = 0; i < sessions; i++) {
      // Work session (25 min)
      const workStart = new Date(currentTime);
      const workEnd = new Date(currentTime.getTime() + 25 * 60000);
      schedule.push({
        type: `🍅 Pomodoro ${i + 1}`,
        start: workStart,
        end: workEnd,
        duration: 25
      });
      
      currentTime = new Date(workEnd);
      
      // Break (5 min short, 15 min long after 4th)
      if (i < sessions - 1) {
        const breakDuration = (i + 1) % 4 === 0 ? 15 : 5;
        const breakStart = new Date(currentTime);
        const breakEnd = new Date(currentTime.getTime() + breakDuration * 60000);
        schedule.push({
          type: breakDuration === 15 ? "🛌 Lange Pauze" : "☕ Korte Pauze",
          start: breakStart,
          end: breakEnd,
          duration: breakDuration
        });
        
        currentTime = new Date(breakEnd);
      }
    }
    
    return schedule;
  }
}

// Meeting scheduler voor internationale teams
class MeetingScheduler {
  static findBestMeetingTime(timezones: string[], duration: number = 60): {
    suggestedTimes: Array<{time: Date, timezone: string, localTimes: Array<{zone: string, time: string}>}>,
    analysis: string
  } {
    const now = new Date();
    const suggestions = [];
    
    // Test verschillende tijden
    for (let hour = 9; hour <= 17; hour++) {
      const baseTime = new Date(now);
      baseTime.setHours(hour, 0, 0, 0);
      
      const localTimes = timezones.map(tz => ({
        zone: tz,
        time: baseTime.toLocaleString("nl-NL", { 
          timeZone: tz, 
          timeStyle: "short" 
        })
      }));
      
      // Check of alle tijden binnen kantooruren vallen (8-18)
      const allInBusinessHours = localTimes.every(lt => {
        const hour = parseInt(lt.time.split(':')[0]);
        return hour >= 8 && hour <= 18;
      });
      
      if (allInBusinessHours) {
        suggestions.push({
          time: baseTime,
          timezone: "UTC",
          localTimes
        });
      }
    }
    
    const analysis = suggestions.length > 0 
      ? `${suggestions.length} goede tijdsloten gevonden voor alle tijdzones`
      : "Moeilijk om een tijd te vinden die voor alle tijdzones werkt";
    
    return { suggestedTimes: suggestions.slice(0, 3), analysis };
  }
}

// Astronomische berekeningen
class AstronomicalCalculator {
  static toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  static getJulianDay(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;
    
    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  static getSunPosition(date: Date, lat: number, lng: number) {
    const jd = this.getJulianDay(date);
    const n = jd - 2451545.0;
    
    // Zonnestand berekeningen (vereenvoudigd)
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = this.toRadians((357.528 + 0.9856003 * n) % 360);
    const lambda = this.toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    
    const alpha = Math.atan2(Math.cos(this.toRadians(23.439)) * Math.sin(lambda), Math.cos(lambda));
    const delta = Math.asin(Math.sin(this.toRadians(23.439)) * Math.sin(lambda));
    
    // Lokale tijd berekeningen
    const gmst = (6.697374558 + 0.06570982441908 * n + (date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600)) % 24;
    const lst = (gmst + lng / 15) % 24;
    const tau = this.toRadians(15 * (lst - this.toDegrees(alpha) / 15));
    
    const elevation = Math.asin(
      Math.sin(this.toRadians(lat)) * Math.sin(delta) + 
      Math.cos(this.toRadians(lat)) * Math.cos(delta) * Math.cos(tau)
    );
    
    const azimuth = Math.atan2(
      -Math.sin(tau),
      Math.tan(delta) * Math.cos(this.toRadians(lat)) - Math.sin(this.toRadians(lat)) * Math.cos(tau)
    );
    
    return {
      elevation: this.toDegrees(elevation),
      azimuth: (this.toDegrees(azimuth) + 360) % 360
    };
  }

  static getSunTimes(date: Date, lat: number, lng: number) {
    const jd = this.getJulianDay(date);
    const n = jd - 2451545.0 + 0.0008;
    
    // Vereenvoudigde berekening voor zonsopgang/ondergang
    const solarNoon = lng / 15;
    const declination = 23.45 * Math.sin(this.toRadians(360 * (284 + (date.getMonth() * 30 + date.getDate())) / 365));
    
    const hourAngle = this.toDegrees(Math.acos(-Math.tan(this.toRadians(lat)) * Math.tan(this.toRadians(declination))));
    
    const sunrise = 12 - hourAngle / 15 - solarNoon;
    const sunset = 12 + hourAngle / 15 - solarNoon;
    
    const sunriseTime = new Date(date);
    sunriseTime.setUTCHours(Math.floor(sunrise), (sunrise % 1) * 60, 0, 0);
    
    const sunsetTime = new Date(date);
    sunsetTime.setUTCHours(Math.floor(sunset), (sunset % 1) * 60, 0, 0);
    
    const solarNoonTime = new Date(date);
    solarNoonTime.setUTCHours(12 - solarNoon, 0, 0, 0);
    
    return { sunrise: sunriseTime, sunset: sunsetTime, solarNoon: solarNoonTime };
  }

  static getMoonPhase(date: Date): { phase: number, name: string, illumination: number } {
    const jd = this.getJulianDay(date);
    const daysSinceNewMoon = (jd - 2451549.5) % 29.53058868;
    const phase = daysSinceNewMoon / 29.53058868;
    
    let name = "Nieuwe Maan";
    if (phase < 0.125) name = "Nieuwe Maan";
    else if (phase < 0.25) name = "Wassende Sikkel";
    else if (phase < 0.375) name = "Eerste Kwartier";
    else if (phase < 0.5) name = "Wassende Maan";
    else if (phase < 0.625) name = "Volle Maan";
    else if (phase < 0.75) name = "Afnemende Maan";
    else if (phase < 0.875) name = "Laatste Kwartier";
    else name = "Afnemende Sikkel";
    
    const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
    
    return { phase, name, illumination };
  }
}

// Create MCP server
const server = new Server(
  {
    name: "astronomical-time-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_current_time",
        description: "Get the current time in specified timezone",
        inputSchema: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              description: "Timezone (e.g., 'Europe/Amsterdam', 'UTC', 'America/New_York')",
              default: "UTC"
            },
            format: {
              type: "string",
              description: "Time format ('iso', 'human', 'unix')",
              default: "iso"
            }
          }
        }
      },
      {
        name: "convert_timezone",
        description: "Convert time from one timezone to another",
        inputSchema: {
          type: "object",
          properties: {
            datetime: {
              type: "string",
              description: "ISO datetime string or 'now'"
            },
            from_timezone: {
              type: "string",
              description: "Source timezone"
            },
            to_timezone: {
              type: "string",
              description: "Target timezone"
            }
          },
          required: ["datetime", "from_timezone", "to_timezone"]
        }
      },
      {
        name: "time_until",
        description: "Calculate time until a specific date/time",
        inputSchema: {
          type: "object",
          properties: {
            target_datetime: {
              type: "string",
              description: "Target datetime in ISO format"
            },
            timezone: {
              type: "string",
              description: "Timezone for calculation",
              default: "UTC"
            }
          },
          required: ["target_datetime"]
        }
      },
      {
        name: "world_clock",
        description: "Get current time in multiple major cities",
        inputSchema: {
          type: "object",
          properties: {
            cities: {
              type: "array",
              items: { type: "string" },
              description: "List of cities/timezones",
              default: ["Europe/Amsterdam", "America/New_York", "Asia/Tokyo", "UTC"]
            }
          }
        }
      },
      {
        name: "get_sun_info",
        description: "Get sun position and times (sunrise, sunset, solar noon)",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude in degrees (-90 to 90)"
            },
            longitude: {
              type: "number",
              description: "Longitude in degrees (-180 to 180)"
            },
            date: {
              type: "string",
              description: "Date in ISO format (default: today)",
              default: "today"
            },
            timezone: {
              type: "string",
              description: "Timezone for display",
              default: "UTC"
            }
          },
          required: ["latitude", "longitude"]
        }
      },
      {
        name: "get_moon_info",
        description: "Get moon phase and illumination information",
        inputSchema: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Date in ISO format (default: today)",
              default: "today"
            }
          }
        }
      },
      {
        name: "get_astronomical_info",
        description: "Get comprehensive sun and moon information for a location",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude in degrees (-90 to 90)"
            },
            longitude: {
              type: "number",
              description: "Longitude in degrees (-180 to 180)"
            },
            location_name: {
              type: "string",
              description: "Name of the location (for display)",
              default: "Unknown Location"
            },
            date: {
              type: "string",
              description: "Date in ISO format (default: today)",
              default: "today"
            },
            timezone: {
              type: "string",
              description: "Timezone for display",
              default: "UTC"
            }
          },
          required: ["latitude", "longitude"]
        }
      },
      {
        name: "get_golden_hour",
        description: "Get golden hour and blue hour times for photography",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude in degrees (-90 to 90)"
            },
            longitude: {
              type: "number",
              description: "Longitude in degrees (-180 to 180)"
            },
            date: {
              type: "string",
              description: "Date in ISO format (default: today)",
              default: "today"
            },
            timezone: {
              type: "string",
              description: "Timezone for display",
              default: "UTC"
            }
          },
          required: ["latitude", "longitude"]
        }
      },
      {
        name: "get_dutch_holidays",
        description: "Get Dutch national holidays for a specific year",
        inputSchema: {
          type: "object",
          properties: {
            year: {
              type: "number",
              description: "Year to get holidays for (default: current year)"
            }
          }
        }
      },
      {
        name: "get_international_holidays",
        description: "Get public holidays for any country using Nager.Date API",
        inputSchema: {
          type: "object",
          properties: {
            country: {
              type: "string",
              description: "Country name or ISO country code (e.g., 'Germany', 'DE', 'Verenigde Staten', 'US')"
            },
            year: {
              type: "number",
              description: "Year to get holidays for (default: current year)"
            }
          },
          required: ["country"]
        }
      },
      {
        name: "get_available_countries",
        description: "Get list of all countries available for holiday data",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "compare_holidays",
        description: "Compare holidays between multiple countries for a specific year",
        inputSchema: {
          type: "object",
          properties: {
            countries: {
              type: "array",
              items: { type: "string" },
              description: "List of country names or codes to compare"
            },
            year: {
              type: "number",
              description: "Year to compare (default: current year)"
            }
          },
          required: ["countries"]
        }
      },
      {
        name: "calculate_workdays",
        description: "Calculate working days between dates (excluding weekends and Dutch holidays)",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date in ISO format"
            },
            end_date: {
              type: "string",
              description: "End date in ISO format"
            }
          },
          required: ["start_date", "end_date"]
        }
      },
      {
        name: "get_circadian_schedule",
        description: "Get optimal daily schedule based on circadian rhythms and sunrise",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude for sunrise calculation"
            },
            longitude: {
              type: "number",
              description: "Longitude for sunrise calculation"
            },
            date: {
              type: "string",
              description: "Date for calculation (default: today)",
              default: "today"
            },
            timezone: {
              type: "string",
              description: "Timezone for display",
              default: "UTC"
            }
          },
          required: ["latitude", "longitude"]
        }
      },
      {
        name: "calculate_jetlag",
        description: "Calculate jet lag recovery time and get recovery tips",
        inputSchema: {
          type: "object",
          properties: {
            origin_timezone: {
              type: "string",
              description: "Origin timezone (e.g., 'Europe/Amsterdam')"
            },
            destination_timezone: {
              type: "string",
              description: "Destination timezone (e.g., 'America/New_York')"
            },
            travel_date: {
              type: "string",
              description: "Travel date in ISO format (default: today)",
              default: "today"
            }
          },
          required: ["origin_timezone", "destination_timezone"]
        }
      },
      {
        name: "create_pomodoro_schedule",
        description: "Create a Pomodoro technique schedule (25min work + 5min break cycles)",
        inputSchema: {
          type: "object",
          properties: {
            start_time: {
              type: "string",
              description: "Start time in ISO format (default: now)",
              default: "now"
            },
            sessions: {
              type: "number",
              description: "Number of Pomodoro sessions (default: 4)",
              default: 4
            },
            timezone: {
              type: "string",
              description: "Timezone for display",
              default: "UTC"
            }
          }
        }
      },
      {
        name: "find_meeting_time",
        description: "Find optimal meeting times for international teams across timezones",
        inputSchema: {
          type: "object",
          properties: {
            timezones: {
              type: "array",
              items: { type: "string" },
              description: "List of timezones for participants"
            },
            duration: {
              type: "number",
              description: "Meeting duration in minutes (default: 60)",
              default: 60
            },
            date: {
              type: "string",
              description: "Date for meeting (default: today)",
              default: "today"
            }
          },
          required: ["timezones"]
        }
      },
      {
        name: "calculate_days_between",
        description: "Calculate days, hours, minutes between two dates with detailed breakdown",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Start date in ISO format"
            },
            end_date: {
              type: "string", 
              description: "End date in ISO format"
            },
            include_time: {
              type: "boolean",
              description: "Include hours and minutes in calculation",
              default: false
            }
          },
          required: ["start_date", "end_date"]
        }
      },
      {
        name: "countdown_to_event",
        description: "Real-time countdown to a specific event with multiple time units",
        inputSchema: {
          type: "object",
          properties: {
            target_date: {
              type: "string",
              description: "Target date/time in ISO format"
            },
            event_name: {
              type: "string",
              description: "Name of the event",
              default: "Target Event"
            },
            timezone: {
              type: "string",
              description: "Timezone for display",
              default: "UTC"
            }
          },
          required: ["target_date"]
        }
      },
      {
        name: "get_server_stats",
        description: "Get server performance statistics and usage metrics",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Rate limiting check
  const clientId = process.env.CLIENT_ID || 'stdio'; // Voor stdio transport
  const rateCheck = rateLimiter.isAllowed(clientId);
  
  if (!rateCheck.allowed) {
    requestMonitor.logRequest(name, false);
    const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime).toLocaleTimeString() : 'unknown';
    
    return {
      content: [{ 
        type: "text", 
        text: `🚫 Rate limit bereikt!\n\n⏰ Probeer opnieuw na: ${resetTime}\n💡 Tip: Wacht even tussen requests voor betere performance.` 
      }],
      isError: true
    };
  }

  // Log request
  requestMonitor.logRequest(name);

  try {
    switch (name) {
      case "get_current_time": {
        const timezone = args?.timezone || "UTC";
        const format = args?.format || "iso";
        
        const now = new Date();
        let result: string;
        
        if (format === "unix") {
          result = Math.floor(now.getTime() / 1000).toString();
        } else if (format === "human") {
          result = now.toLocaleString("nl-NL", { 
            timeZone: timezone,
            dateStyle: "full",
            timeStyle: "medium"
          });
        } else {
          result = now.toLocaleString("sv-SE", { 
            timeZone: timezone 
          }).replace(" ", "T") + "Z";
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `Current time in ${timezone}: ${result}\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
          }]
        };
      }

      case "convert_timezone": {
        const { datetime, from_timezone, to_timezone } = args;
        
        const inputDate = datetime === "now" ? new Date() : new Date(datetime);
        
        const fromTime = inputDate.toLocaleString("sv-SE", { 
          timeZone: from_timezone 
        });
        const toTime = inputDate.toLocaleString("sv-SE", { 
          timeZone: to_timezone 
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `${fromTime} (${from_timezone}) = ${toTime} (${to_timezone})\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
          }]
        };
      }

      case "time_until": {
        const { target_datetime, timezone = "UTC" } = args;
        
        const now = new Date();
        const target = new Date(target_datetime);
        const diff = target.getTime() - now.getTime();
        
        if (diff < 0) {
          return {
            content: [{ 
              type: "text", 
              text: `Target time has already passed ${Math.abs(diff / 1000 / 60 / 60 / 24).toFixed(1)} days ago\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
            }]
          };
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          content: [{ 
            type: "text", 
            text: `Time until ${target_datetime}: ${days} days, ${hours} hours, ${minutes} minutes\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
          }]
        };
      }

      case "world_clock": {
        const cities = args?.cities || ["Europe/Amsterdam", "America/New_York", "Asia/Tokyo", "UTC"];
        const now = new Date();
        
        const times = cities.map(city => {
          const time = now.toLocaleString("nl-NL", { 
            timeZone: city,
            dateStyle: "short",
            timeStyle: "medium"
          });
          return `${city}: ${time}`;
        }).join("\n");
        
        return {
          content: [{ 
            type: "text", 
            text: `World Clock:\n${times}\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
          }]
        };
      }

      case "get_sun_info": {
        const { latitude, longitude, date = "today", timezone = "UTC" } = args;
        const targetDate = date === "today" ? new Date() : new Date(date);
        
        const sunTimes = AstronomicalCalculator.getSunTimes(targetDate, latitude, longitude);
        const currentSunPos = AstronomicalCalculator.getSunPosition(new Date(), latitude, longitude);
        
        const formatTime = (d: Date) => d.toLocaleString("nl-NL", { 
          timeZone: timezone, 
          timeStyle: "short" 
        });
        
        const result = `🌅 Zonnestand Informatie (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)
📅 Datum: ${targetDate.toLocaleDateString("nl-NL")}

⏰ Tijden:
  🌅 Zonsopgang: ${formatTime(sunTimes.sunrise)}
  🌞 Zonshoogte: ${formatTime(sunTimes.solarNoon)}
  🌇 Zonsondergang: ${formatTime(sunTimes.sunset)}

📍 Huidige Positie:
  🧭 Azimuth: ${currentSunPos.azimuth.toFixed(1)}°
  📐 Hoogte: ${currentSunPos.elevation.toFixed(1)}°

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_moon_info": {
        const { date = "today" } = args;
        const targetDate = date === "today" ? new Date() : new Date(date);
        
        const moonPhase = AstronomicalCalculator.getMoonPhase(targetDate);
        
        const phaseEmoji = {
          "Nieuwe Maan": "🌑",
          "Wassende Sikkel": "🌒",
          "Eerste Kwartier": "🌓",
          "Wassende Maan": "🌔",
          "Volle Maan": "🌕",
          "Afnemende Maan": "🌖",
          "Laatste Kwartier": "🌗",
          "Afnemende Sikkel": "🌘"
        }[moonPhase.name] || "🌙";
        
        const result = `🌙 Maan Informatie
📅 Datum: ${targetDate.toLocaleDateString("nl-NL")}

🌙 Maanfase: ${phaseEmoji} ${moonPhase.name}
💡 Verlichting: ${(moonPhase.illumination * 100).toFixed(1)}%
🔄 Cyclus: ${(moonPhase.phase * 100).toFixed(1)}%

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_astronomical_info": {
        const { latitude, longitude, location_name = "Onbekende Locatie", date = "today", timezone = "UTC" } = args;
        const targetDate = date === "today" ? new Date() : new Date(date);
        
        const sunTimes = AstronomicalCalculator.getSunTimes(targetDate, latitude, longitude);
        const currentSunPos = AstronomicalCalculator.getSunPosition(new Date(), latitude, longitude);
        const moonPhase = AstronomicalCalculator.getMoonPhase(targetDate);
        
        const formatTime = (d: Date) => d.toLocaleString("nl-NL", { 
          timeZone: timezone, 
          timeStyle: "short" 
        });
        
        const phaseEmoji = {
          "Nieuwe Maan": "🌑", "Wassende Sikkel": "🌒", "Eerste Kwartier": "🌓",
          "Wassende Maan": "🌔", "Volle Maan": "🌕", "Afnemende Maan": "🌖",
          "Laatste Kwartier": "🌗", "Afnemende Sikkel": "🌘"
        }[moonPhase.name] || "🌙";
        
        const dayLength = (sunTimes.sunset.getTime() - sunTimes.sunrise.getTime()) / (1000 * 60 * 60);
        
        const result = `🌟 Astronomische Informatie voor ${location_name}
📍 Coördinaten: ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°
📅 Datum: ${targetDate.toLocaleDateString("nl-NL")}

☀️ ZON:
  🌅 Zonsopgang: ${formatTime(sunTimes.sunrise)}
  🌞 Zonshoogte: ${formatTime(sunTimes.solarNoon)}
  🌇 Zonsondergang: ${formatTime(sunTimes.sunset)}
  ⏱️ Daglengte: ${dayLength.toFixed(1)} uur
  
  📍 Huidige Positie:
    🧭 Azimuth: ${currentSunPos.azimuth.toFixed(1)}°
    📐 Hoogte: ${currentSunPos.elevation.toFixed(1)}°

🌙 MAAN:
  ${phaseEmoji} Fase: ${moonPhase.name}
  💡 Verlichting: ${(moonPhase.illumination * 100).toFixed(1)}%
  🔄 Cyclus: ${(moonPhase.phase * 100).toFixed(1)}%

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_golden_hour": {
        const { latitude, longitude, date = "today", timezone = "UTC" } = args;
        const targetDate = date === "today" ? new Date() : new Date(date);
        
        const sunTimes = AstronomicalCalculator.getSunTimes(targetDate, latitude, longitude);
        
        // Golden hour: 1 uur voor zonsondergang en na zonsopgang
        const morningGoldenStart = new Date(sunTimes.sunrise.getTime() - 30 * 60000);
        const morningGoldenEnd = new Date(sunTimes.sunrise.getTime() + 60 * 60000);
        const eveningGoldenStart = new Date(sunTimes.sunset.getTime() - 60 * 60000);
        const eveningGoldenEnd = new Date(sunTimes.sunset.getTime() + 30 * 60000);
        
        // Blue hour: 30 min voor sunrise en na sunset
        const morningBlueStart = new Date(sunTimes.sunrise.getTime() - 60 * 60000);
        const morningBlueEnd = new Date(sunTimes.sunrise.getTime() - 30 * 60000);
        const eveningBlueStart = new Date(sunTimes.sunset.getTime() + 30 * 60000);
        const eveningBlueEnd = new Date(sunTimes.sunset.getTime() + 60 * 60000);
        
        const formatTime = (d: Date) => d.toLocaleString("nl-NL", { 
          timeZone: timezone, 
          timeStyle: "short" 
        });
        
        const result = `📸 Fotografie Tijden
📅 Datum: ${targetDate.toLocaleDateString("nl-NL")}
📍 Locatie: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°

🌅 OCHTEND:
  🔵 Blue Hour: ${formatTime(morningBlueStart)} - ${formatTime(morningBlueEnd)}
  🟡 Golden Hour: ${formatTime(morningGoldenStart)} - ${formatTime(morningGoldenEnd)}
  🌅 Zonsopgang: ${formatTime(sunTimes.sunrise)}

🌇 AVOND:
  🌇 Zonsondergang: ${formatTime(sunTimes.sunset)}
  🟡 Golden Hour: ${formatTime(eveningGoldenStart)} - ${formatTime(eveningGoldenEnd)}
  🔵 Blue Hour: ${formatTime(eveningBlueStart)} - ${formatTime(eveningBlueEnd)}

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_dutch_holidays": {
        const year = args?.year || new Date().getFullYear();
        const holidays = DutchCalendar.getDutchHolidays(year);
        
        const result = `🇳🇱 Nederlandse Feestdagen ${year}

${holidays.map(h => {
          const emoji = h.type === "national" ? "🎉" : "🪖";
          return `${emoji} ${h.date.toLocaleDateString("nl-NL", { 
            weekday: "long", 
            day: "numeric", 
            month: "long" 
          })}: ${h.name}`;
        }).join("\n")}

📊 Totaal: ${holidays.filter(h => h.type === "national").length} nationale feestdagen

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_international_holidays": {
        const { country, year = new Date().getFullYear() } = args;
        const countryCode = InternationalHolidays.getCountryCodeByName(country);
        
        try {
          const holidays = await InternationalHolidays.fetchHolidays(countryCode, year);
          
          if (holidays.length === 0) {
            return {
              content: [{ 
                type: "text", 
                text: `❌ Geen feestdagen gevonden voor ${country} (${countryCode}) in ${year}.\n\n💡 Controleer de landnaam of probeer een ISO land code (bijv. 'DE' voor Duitsland).\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
              }]
            };
          }
          
          const flagEmojis: {[key: string]: string} = {
            'US': '🇺🇸', 'DE': '🇩🇪', 'FR': '🇫🇷', 'GB': '🇬🇧', 'IT': '🇮🇹', 
            'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹',
            'DK': '🇩🇰', 'SE': '🇸🇪', 'NO': '🇳🇴', 'FI': '🇫🇮', 'PL': '🇵🇱',
            'CA': '🇨🇦', 'AU': '🇦🇺', 'NZ': '🇳🇿', 'JP': '🇯🇵', 'KR': '🇰🇷',
            'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'RU': '🇷🇺'
          };
          
          const flag = flagEmojis[countryCode] || '🌍';
          
          const result = `${flag} Feestdagen ${country.toUpperCase()} ${year}

${holidays.map(h => {
            const date = new Date(h.date);
            const emoji = h.global ? "🌍" : h.fixed ? "📅" : "🗓️";
            return `${emoji} ${date.toLocaleDateString("nl-NL", { 
              weekday: "long", 
              day: "numeric", 
              month: "long" 
            })}: ${h.localName} ${h.localName !== h.name ? `(${h.name})` : ''}`;
          }).join("\n")}

📊 Totaal: ${holidays.length} feestdagen
🌍 Globale feestdagen: ${holidays.filter(h => h.global).length}
📅 Vaste data: ${holidays.filter(h => h.fixed).length}

⚡ Remaining requests: ${rateCheck.remaining}`;
          
          return {
            content: [{ type: "text", text: result }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `❌ Error bij ophalen feestdagen voor ${country}: ${error.message}\n\n💡 Probeer een andere landnaam of ISO code.\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
            }],
            isError: true
          };
        }
      }

      case "get_available_countries": {
        try {
          const countries = await InternationalHolidays.getCountries();
          
          const result = `🌍 Beschikbare Landen voor Feestdagen Data

📋 POPULAIRE LANDEN:
🇳🇱 Nederland (NL)
🇩🇪 Duitsland (DE)  
🇫🇷 Frankrijk (FR)
🇬🇧 Verenigd Koninkrijk (GB)
🇺🇸 Verenigde Staten (US)
🇮🇹 Italië (IT)
🇪🇸 Spanje (ES)
🇧🇪 België (BE)

📊 TOTAAL BESCHIKBAAR: ${countries.length} landen

💡 GEBRUIK:
- Land naam: "Duitsland", "Frankrijk", "Verenigde Staten"
- ISO code: "DE", "FR", "US"
- Nederlandse namen: "Verenigd Koninkrijk", "Verenigde Staten"

🔍 Voor complete lijst van alle ${countries.length} landen, zie: https://date.nager.at/Country

⚡ Remaining requests: ${rateCheck.remaining}`;
          
          return {
            content: [{ type: "text", text: result }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `❌ Error bij ophalen landen: ${error.message}\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
            }],
            isError: true
          };
        }
      }

      case "compare_holidays": {
        const { countries, year = new Date().getFullYear() } = args;
        
        try {
          const allHolidays = await Promise.all(
            countries.map(async (country: string) => {
              const countryCode = InternationalHolidays.getCountryCodeByName(country);
              const holidays = await InternationalHolidays.fetchHolidays(countryCode, year);
              return { country, countryCode, holidays };
            })
          );
          
          // Zoek gemeenschappelijke feestdagen
          const commonHolidays = allHolidays[0].holidays.filter(holiday1 => 
            allHolidays.slice(1).every(countryData => 
              countryData.holidays.some(holiday2 => 
                holiday1.date === holiday2.date && 
                (holiday1.name === holiday2.name || holiday1.localName === holiday2.localName)
              )
            )
          );
          
          const flagEmojis: {[key: string]: string} = {
            'US': '🇺🇸', 'DE': '🇩🇪', 'FR': '🇫🇷', 'GB': '🇬🇧', 'IT': '🇮🇹', 
            'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹'
          };
          
          let result = `🌍 Feestdagen Vergelijking ${year}\n`;
          result += `📊 Landen: ${allHolidays.map(c => `${flagEmojis[c.countryCode] || '🌍'} ${c.country}`).join(', ')}\n\n`;
          
          if (commonHolidays.length > 0) {
            result += `🤝 GEMEENSCHAPPELIJKE FEESTDAGEN (${commonHolidays.length}):\n`;
            result += commonHolidays.map(h => {
              const date = new Date(h.date);
              return `🎉 ${date.toLocaleDateString("nl-NL", { 
                weekday: "long", 
                day: "numeric", 
                month: "long" 
              })}: ${h.name}`;
            }).join('\n');
            result += '\n\n';
          } else {
            result += `❌ Geen gemeenschappelijke feestdagen gevonden\n\n`;
          }
          
          result += `📋 OVERZICHT PER LAND:\n`;
          allHolidays.forEach(countryData => {
            const flag = flagEmojis[countryData.countryCode] || '🌍';
            result += `${flag} ${countryData.country}: ${countryData.holidays.length} feestdagen\n`;
          });

          result += `\n⚡ Remaining requests: ${rateCheck.remaining}`;
          
          return {
            content: [{ type: "text", text: result }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `❌ Error bij vergelijken feestdagen: ${error.message}\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
            }],
            isError: true
          };
        }
      }

      case "calculate_workdays": {
        const { start_date, end_date } = args;
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const workDays = DutchCalendar.getWorkDaysBetween(startDate, endDate);
        const weekendDays = Math.floor(totalDays / 7) * 2 + Math.max(0, (totalDays % 7) - (5 - startDate.getDay()));
        const holidayDays = totalDays - workDays - weekendDays;
        
        const result = `📅 Werkdagen Berekening
📍 Periode: ${startDate.toLocaleDateString("nl-NL")} - ${endDate.toLocaleDateString("nl-NL")}

📊 Overzicht:
  📆 Totale dagen: ${totalDays}
  💼 Werkdagen: ${workDays}
  🏖️ Weekenddagen: ${weekendDays}
  🎉 Feestdagen: ${holidayDays}

⏰ Werkdagen percentage: ${((workDays / totalDays) * 100).toFixed(1)}%

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_circadian_schedule": {
        const { latitude, longitude, date = "today", timezone = "UTC" } = args;
        const targetDate = date === "today" ? new Date() : new Date(date);
        
        const sunTimes = AstronomicalCalculator.getSunTimes(targetDate, latitude, longitude);
        const schedule = CircadianCalculator.getOptimalTimes(sunTimes.sunrise);
        
        const formatTime = (d: Date) => d.toLocaleString("nl-NL", { 
          timeZone: timezone, 
          timeStyle: "short" 
        });
        
        const result = `🧬 Optimaal Dagschema (Circadiaans Ritme)
📅 Datum: ${targetDate.toLocaleDateString("nl-NL")}
🌅 Gebaseerd op zonsopgang: ${formatTime(sunTimes.sunrise)}

⏰ DAGPLANNING:
  🛏️ Opstaan: ${formatTime(schedule.wakeUp)}
  ☀️ Zonlicht: ${formatTime(schedule.morningLight)}
  🧠 Productiviteitspiek 1: ${formatTime(schedule.productivityPeak1)}
  🍽️ Lunch: ${formatTime(schedule.lunch)}
  🧠 Productiviteitspiek 2: ${formatTime(schedule.productivityPeak2)}
  🏃 Sport: ${formatTime(schedule.exerciseTime)}
  🍽️ Avondeten: ${formatTime(schedule.dinnerTime)}
  📱 Wind down: ${formatTime(schedule.windDown)}
  😴 Slaap: ${formatTime(schedule.sleepTime)}

💡 Dit schema is geoptimaliseerd voor je natuurlijke bioklok!

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "calculate_jetlag": {
        const { origin_timezone, destination_timezone, travel_date = "today" } = args;
        const travelDate = travel_date === "today" ? new Date() : new Date(travel_date);
        
        // Bereken tijdverschil
        const originOffset = new Date().toLocaleString("en", {timeZone: origin_timezone}).match(/(\d+):(\d+)/);
        const destOffset = new Date().toLocaleString("en", {timeZone: destination_timezone}).match(/(\d+):(\d+)/);
        
        // Vereenvoudigde tijdverschil berekening
        const originTime = new Date(travelDate.toLocaleString("en-US", {timeZone: origin_timezone}));
        const destTime = new Date(travelDate.toLocaleString("en-US", {timeZone: destination_timezone}));
        const timeDiff = (destTime.getTime() - originTime.getTime()) / (1000 * 60 * 60);
        
        const recovery = CircadianCalculator.getJetLagRecovery(timeDiff);
        
        const result = `✈️ Jet Lag Analyse
🛫 Van: ${origin_timezone}
🛬 Naar: ${destination_timezone}
📅 Reisdatum: ${travelDate.toLocaleDateString("nl-NL")}

⏰ TIJDVERSCHIL:
  🕐 Verschil: ${Math.abs(timeDiff).toFixed(1)} uur ${timeDiff > 0 ? 'vooruit' : 'achteruit'}
  🧭 Richting: ${timeDiff > 0 ? 'Oostwaarts 🌅' : 'Westwaarts 🌇'}

🔄 HERSTEL:
  📊 Herstel tijd: ${recovery.recoveryDays} dagen
  
💡 TIPS:
${recovery.tips.map(tip => `  • ${tip}`).join('\n')}

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "create_pomodoro_schedule": {
        const { start_time = "now", sessions = 4, timezone = "UTC" } = args;
        const startTime = start_time === "now" ? new Date() : new Date(start_time);
        
        const schedule = ProductivityTimer.getPomodoroSchedule(startTime, sessions);
        
        const formatTime = (d: Date) => d.toLocaleString("nl-NL", { 
          timeZone: timezone, 
          timeStyle: "short" 
        });
        
        const totalDuration = schedule.reduce((sum, item) => sum + item.duration, 0);
        
        const result = `🍅 Pomodoro Schema
⏰ Start: ${formatTime(startTime)}
📊 ${sessions} sessies (${totalDuration} minuten totaal)

📋 PLANNING:
${schedule.map((item, index) => 
  `${index + 1}. ${item.type}: ${formatTime(item.start)} - ${formatTime(item.end)} (${item.duration}min)`
).join('\n')}

💡 TIPS:
  • Zet je telefoon weg tijdens werk sessies
  • Sta op en beweeg tijdens pauzes
  • Drink water tussen sessies door
  • Na 4 pomodoro's: lange pauze van 15-30 min

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "find_meeting_time": {
        const { timezones, duration = 60, date = "today" } = args;
        const targetDate = date === "today" ? new Date() : new Date(date);
        
        const meetingSchedule = MeetingScheduler.findBestMeetingTime(timezones, duration);
        
        const result = `🌍 International Meeting Scheduler
📅 Datum: ${targetDate.toLocaleDateString("nl-NL")}
⏱️ Duur: ${duration} minuten
🌐 Tijdzones: ${timezones.join(", ")}

${meetingSchedule.analysis}

🕐 BESTE TIJDEN:
${meetingSchedule.suggestedTimes.length > 0 ? 
  meetingSchedule.suggestedTimes.map((suggestion, index) => 
    `${index + 1}. ${suggestion.time.toLocaleString("nl-NL", { timeStyle: "short" })} UTC
${suggestion.localTimes.map(lt => `   📍 ${lt.zone}: ${lt.time}`).join('\n')}`
  ).join('\n\n') 
  : '❌ Geen optimale tijd gevonden voor alle tijdzones.\n💡 Overweeg asynchrone communicatie of rotatiesysteem.'}

💡 TIP: Kies een tijd die voor de meeste deelnemers binnen kantooruren (9-17) valt.

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "calculate_days_between": {
        const { start_date, end_date, include_time = false } = args;
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        const isNegative = diffMs < 0;
        const absDays = Math.abs(diffDays);
        const absHours = Math.abs(diffHours);
        const absMinutes = Math.abs(diffMinutes);
        const absSeconds = Math.abs(diffSeconds);
        
        const direction = isNegative ? "⬅️ In het verleden" : "➡️ In de toekomst";
        
        let result = `📅 Tijd Berekening
🗓️ Van: ${startDate.toLocaleDateString("nl-NL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
🗓️ Tot: ${endDate.toLocaleDateString("nl-NL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
${direction}

📊 VERSCHIL:
  📅 Dagen: ${absDays}
  ⏰ Totale uren: ${Math.abs(Math.floor(diffMs / (1000 * 60 * 60)))}
  ⏱️ Totale minuten: ${Math.abs(Math.floor(diffMs / (1000 * 60)))}`;

        if (include_time) {
          result += `\n\n🔍 GEDETAILLEERD:
  📅 ${absDays} dagen
  ⏰ ${absHours} uren  
  ⏱️ ${absMinutes} minuten
  ⏲️ ${absSeconds} seconden`;
        }

        // Voeg context toe
        if (absDays < 7) {
          result += `\n\n💡 Dit is minder dan een week`;
        } else if (absDays < 30) {
          result += `\n\n💡 Dit is ongeveer ${Math.round(absDays/7)} weken`;
        } else if (absDays < 365) {
          result += `\n\n💡 Dit is ongeveer ${Math.round(absDays/30)} maanden`;
        } else {
          result += `\n\n💡 Dit is ongeveer ${Math.round(absDays/365)} jaar`;
        }

        result += `\n\n⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "countdown_to_event": {
        const { target_date, event_name = "Target Event", timezone = "UTC" } = args;
        const now = new Date();
        const targetDate = new Date(target_date);
        
        const diffMs = targetDate.getTime() - now.getTime();
        const isPast = diffMs < 0;
        const absDiffMs = Math.abs(diffMs);
        
        const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);
        
        const targetTimeStr = targetDate.toLocaleString("nl-NL", { 
          timeZone: timezone,
          dateStyle: "full",
          timeStyle: "medium"
        });
        
        let result = `⏰ COUNTDOWN: ${event_name}
🎯 Target: ${targetTimeStr}
🕐 Nu: ${now.toLocaleString("nl-NL", { timeZone: timezone, dateStyle: "medium", timeStyle: "medium" })}

`;

        if (isPast) {
          result += `✅ EVENT AFGELOPEN!
⏰ ${event_name} was ${days} dagen, ${hours} uur, ${minutes} minuten en ${seconds} seconden geleden.

🎉 Hopelijk was het geweldig!`;
        } else {
          const urgencyEmoji = days === 0 ? "🚨" : days < 7 ? "⚠️" : "📅";
          
          result += `${urgencyEmoji} NOG TE GAAN:
📅 ${days} dagen
⏰ ${hours} uur
⏱️ ${minutes} minuten  
⏲️ ${seconds} seconden

💫 Totaal: ${Math.floor(absDiffMs / (1000 * 60 * 60))} uur en ${Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))} minuten`;

          // Urgentie indicatoren
          if (days === 0 && hours < 1) {
            result += `\n\n🚨 LAATSTE MINUTEN! Bijna tijd!`;
          } else if (days === 0) {
            result += `\n\n⚠️ VANDAAG! Nog ${hours} uur te gaan!`;
          } else if (days === 1) {
            result += `\n\n📅 MORGEN! Laatste dag om voor te bereiden!`;
          } else if (days < 7) {
            result += `\n\n⏰ DEZE WEEK! Tijd om voor te bereiden!`;
          }
        }

        result += `\n\n⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      case "get_server_stats": {
        const monitorStats = requestMonitor.getStats();
        const rateLimiterStats = rateLimiter.getStats();
        const uptimeHours = Math.floor(monitorStats.uptime / 3600);
        const uptimeMinutes = Math.floor((monitorStats.uptime % 3600) / 60);
        
        const result = `📊 MCP Astronomical Time Server Statistics

⚡ SERVER STATUS:
  🟢 Status: Online & Healthy
  ⏰ Uptime: ${uptimeHours}h ${uptimeMinutes}m
  🔄 Total requests: ${monitorStats.totalRequests}
  ❌ Error rate: ${monitorStats.errorRate}%
  👥 Active clients: ${rateLimiterStats.totalClients}

🎯 POPULAIRSTE TOOLS:
${monitorStats.mostUsedTools.map((tool, index) => 
  `${index + 1}. ${tool.tool}: ${tool.count} calls`
).join('\n')}

🛡️ RATE LIMITING:
  📈 Requests in memory: ${rateLimiterStats.totalRequests}
  ⏱️ Window: 15 minuten
  🎯 Max requests: 100 per window, 20 per minuut
  ✅ Current status: ${rateCheck.remaining} requests remaining

🌟 FEATURES ACTIVE:
  ☀️ Astronomical calculations (offline)
  🇳🇱 Dutch holidays (offline)  
  🌍 International holidays (Nager.Date API)
  🧬 Circadian optimization
  ✈️ Jet lag calculator
  🍅 Pomodoro scheduler
  🌐 Meeting coordinator
  🛡️ DDoS protection
  📊 Usage analytics

💡 Server version: 2.0.0
🚀 Ready for production use!

⚡ Remaining requests: ${rateCheck.remaining}`;
        
        return {
          content: [{ type: "text", text: result }]
        };
      }

      default:
        requestMonitor.logRequest(name, false);
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    requestMonitor.logRequest(name, false);
    
    return {
      content: [{ 
        type: "text", 
        text: `❌ Error in ${name}: ${error.message}\n\n⚡ Remaining requests: ${rateCheck.remaining}` 
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🌟 MCP Astronomical Time Server v2.0.0 running on stdio");
  console.error("🚀 Features: Time, Astronomy, Holidays, Productivity, DDoS Protection");
  console.error("🛡️ Rate Limiting: 100 requests/15min, 20 requests/min");
}

main().catch(console.error);