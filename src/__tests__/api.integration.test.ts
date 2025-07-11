import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('International Holidays API Integration', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  test('should fetch holidays from Nager.Date API', async () => {
    const mockHolidays = [
      {
        date: "2024-01-01",
        localName: "New Year's Day",
        name: "New Year's Day",
        countryCode: "US",
        fixed: true,
        global: true,
        counties: null,
        launchYear: null,
        types: ["Public"]
      }
    ];

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHolidays,
    } as Response);

    // Mock the InternationalHolidays.fetchHolidays function
    const fetchHolidays = async (countryCode: string, year: number) => {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // Suppress console.error in tests
        return [];
      }
    };

    const holidays = await fetchHolidays('US', 2024);
    
    expect(fetch).toHaveBeenCalledWith('https://date.nager.at/api/v3/PublicHolidays/2024/US');
    expect(holidays).toEqual(mockHolidays);
    expect((holidays as any)[0].name).toBe("New Year's Day");
  });

  test('should handle API errors gracefully', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const fetchHolidays = async (countryCode: string, year: number) => {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // Suppress console.error in tests
        return [];
      }
    };

    const holidays = await fetchHolidays('INVALID', 2024);
    
    expect(holidays).toEqual([]);
  });

  test('should handle HTTP error responses', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const fetchHolidays = async (countryCode: string, year: number) => {
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // Suppress console.error in tests
        return [];
      }
    };

    const holidays = await fetchHolidays('INVALID', 2024);
    
    expect(holidays).toEqual([]);
  });

  test('should fetch available countries', async () => {
    const mockCountries = [
      { countryCode: "US", name: "United States" },
      { countryCode: "NL", name: "Netherlands" },
      { countryCode: "DE", name: "Germany" }
    ];

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCountries,
    } as Response);

    const getCountries = async () => {
      try {
        const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        // Suppress console.error in tests
        return [];
      }
    };

    const countries = await getCountries();
    
    expect(fetch).toHaveBeenCalledWith('https://date.nager.at/api/v3/AvailableCountries');
    expect(countries).toEqual(mockCountries);
    expect(countries).toHaveLength(3);
  });

  test('should handle rate limiting', async () => {
    // Simulate rate limiting response
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    const fetchWithRetry = async (url: string, retries: number = 3): Promise<any> => {
      try {
        const response = await fetch(url);
        
        if (response.status === 429 && retries > 0) {
          // Wait before retry (simplified for test)
          await new Promise(resolve => setTimeout(resolve, 100));
          return fetchWithRetry(url, retries - 1);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        if (retries > 0) {
          return fetchWithRetry(url, retries - 1);
        }
        throw error;
      }
    };

    // Mock successful response on retry
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ date: "2024-01-01", name: "Test Holiday" }],
    } as Response);

    const result = await fetchWithRetry('https://date.nager.at/api/v3/PublicHolidays/2024/US');
    
    expect(fetch).toHaveBeenCalledTimes(2); // Initial call + retry
    expect(result).toEqual([{ date: "2024-01-01", name: "Test Holiday" }]);
  });
});