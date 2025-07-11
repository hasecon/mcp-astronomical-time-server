import { describe, test, expect, jest } from '@jest/globals';

describe('Dutch Holiday Calculator', () => {
  // Recreate Easter calculation for testing
  const calculateEaster = (year: number): Date => {
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
  };

  const getDutchHolidays = (year: number) => {
    const easter = calculateEaster(year);
    const holidays = [
      {
        name: "Nieuwjaarsdag",
        date: new Date(year, 0, 1),
        type: "national"
      },
      {
        name: "Koningsdag",
        date: new Date(year, 3, 27), // April 27
        type: "national"
      },
      {
        name: "Pasen",
        date: easter,
        type: "national"
      },
      {
        name: "Tweede Paasdag",
        date: new Date(easter.getTime() + 24 * 60 * 60 * 1000),
        type: "national"
      },
      {
        name: "Bevrijdingsdag",
        date: new Date(year, 4, 5), // May 5
        type: year % 5 === 0 ? "national" : "commemorative"
      },
      {
        name: "Hemelvaart",
        date: new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000),
        type: "national"
      },
      {
        name: "Pinksteren",
        date: new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000),
        type: "national"
      },
      {
        name: "Tweede Pinksterdag",
        date: new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000),
        type: "national"
      },
      {
        name: "Sinterklaas",
        date: new Date(year, 11, 5), // December 5
        type: "traditional"
      },
      {
        name: "Eerste Kerstdag",
        date: new Date(year, 11, 25), // December 25
        type: "national"
      },
      {
        name: "Tweede Kerstdag",
        date: new Date(year, 11, 26), // December 26
        type: "national"
      }
    ];

    return holidays;
  };

  test('should calculate Easter correctly for known years', () => {
    // Known Easter dates
    const easter2024 = calculateEaster(2024);
    expect(easter2024.getMonth()).toBe(2); // March (0-indexed)
    expect(easter2024.getDate()).toBe(31);

    const easter2025 = calculateEaster(2025);
    expect(easter2025.getMonth()).toBe(3); // April
    expect(easter2025.getDate()).toBe(20);
  });

  test('should include all major Dutch holidays', () => {
    const holidays = getDutchHolidays(2024);
    
    const holidayNames = holidays.map(h => h.name);
    expect(holidayNames).toContain("Nieuwjaarsdag");
    expect(holidayNames).toContain("Koningsdag");
    expect(holidayNames).toContain("Pasen");
    expect(holidayNames).toContain("Eerste Kerstdag");
    expect(holidayNames).toContain("Tweede Kerstdag");
  });

  test('should mark Bevrijdingsdag as national holiday in commemoration years', () => {
    const holidays2025 = getDutchHolidays(2025); // 2025 % 5 === 0
    const bevrijdingsdag = holidays2025.find(h => h.name === "Bevrijdingsdag");
    
    expect(bevrijdingsdag?.type).toBe("national");
  });

  test('should mark Bevrijdingsdag as commemorative in non-commemoration years', () => {
    const holidays2024 = getDutchHolidays(2024); // 2024 % 5 !== 0
    const bevrijdingsdag = holidays2024.find(h => h.name === "Bevrijdingsdag");
    
    expect(bevrijdingsdag?.type).toBe("commemorative");
  });

  test('should calculate Easter-dependent holidays correctly', () => {
    const holidays = getDutchHolidays(2024);
    const easter = holidays.find(h => h.name === "Pasen")!;
    const hemelvaart = holidays.find(h => h.name === "Hemelvaart")!;
    const pinksteren = holidays.find(h => h.name === "Pinksteren")!;
    
    // Hemelvaart is 39 days after Easter
    const daysDiff = (hemelvaart.date.getTime() - easter.date.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBe(39);
    
    // Pinksteren is 49 days after Easter
    const pinksterenDiff = (pinksteren.date.getTime() - easter.date.getTime()) / (1000 * 60 * 60 * 24);
    expect(pinksterenDiff).toBe(49);
  });

  test('should have holidays in chronological order when sorted', () => {
    const holidays = getDutchHolidays(2024);
    const dates = holidays.map(h => h.date.getTime()).sort((a, b) => a - b);
    
    // First holiday should be New Year's Day
    const firstHoliday = holidays.find(h => h.date.getTime() === dates[0]);
    expect(firstHoliday?.name).toBe("Nieuwjaarsdag");
    
    // Last holiday should be Tweede Kerstdag
    const lastHoliday = holidays.find(h => h.date.getTime() === dates[dates.length - 1]);
    expect(lastHoliday?.name).toBe("Tweede Kerstdag");
  });
});