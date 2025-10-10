import { LocationStatus, mapAPIStatusToLocationStatus, PresencaAPIResponse } from "../Phaser/Game/LocationStatus";
import { getCurrentDateYYYYMMDD } from "../Utils/DateFormatter";

/**
 * Service to fetch location status from the external API
 */
class LocationStatusService {
    private readonly API_URL = "https://portalweb.rrperfumes.com.br/api/controlid/controle_presenca/";
    private readonly TIMEOUT_MS = 10000; // 10 seconds
    private cache: Map<string, { status: LocationStatus; timestamp: number }> = new Map();
    private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

    /**
     * Fetches location status for a user by email
     * @param email User's email address
     * @param date Date in YYYYMMDD format (optional, defaults to today)
     * @returns LocationStatus - PRESENTE or HOMEOFFICE (defaults to HOMEOFFICE on error)
     */
    async fetchLocationStatus(email: string, date?: string): Promise<LocationStatus> {
        if (!email) {
            console.warn("LocationStatusService: No email provided, defaulting to HOMEOFFICE");
            return LocationStatus.HOMEOFFICE;
        }

        // Use provided date or current date
        const queryDate = date ?? getCurrentDateYYYYMMDD();

        // Check cache first
        const cacheKey = `${email}_${queryDate}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            console.log(`LocationStatusService: Using cached status for ${email}:`, cached.status);
            return cached.status;
        }

        try {
            console.log(`LocationStatusService: Fetching status for ${email} on ${queryDate}...`);

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

            const url = `${this.API_URL}?data=${queryDate}&email=${encodeURIComponent(email)}`;

            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`LocationStatusService: API returned error ${response.status}, defaulting to HOMEOFFICE`);
                return LocationStatus.HOMEOFFICE;
            }

            const data: PresencaAPIResponse[] = await response.json();

            // Empty response means no presence record
            if (!data || data.length === 0) {
                console.log(`LocationStatusService: No data for ${email}, defaulting to HOMEOFFICE`);
                this.cacheStatus(cacheKey, LocationStatus.HOMEOFFICE);
                return LocationStatus.HOMEOFFICE;
            }

            // Map API status to our LocationStatus
            const apiStatus = data[0].STATUS_FINAL;
            const locationStatus = mapAPIStatusToLocationStatus(apiStatus);

            console.log(`LocationStatusService: Status for ${email}: ${apiStatus} → ${locationStatus}`);

            // Cache the result
            this.cacheStatus(cacheKey, locationStatus);

            return locationStatus;
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                console.warn(`LocationStatusService: Timeout fetching status for ${email}, defaulting to HOMEOFFICE`);
            } else {
                console.warn(
                    `LocationStatusService: Error fetching status for ${email}, defaulting to HOMEOFFICE:`,
                    error
                );
            }
            return LocationStatus.HOMEOFFICE; // Always default to HOMEOFFICE on error
        }
    }

    /**
     * Caches a status result
     */
    private cacheStatus(key: string, status: LocationStatus): void {
        this.cache.set(key, {
            status,
            timestamp: Date.now(),
        });
    }

    /**
     * Clears the cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log("LocationStatusService: Cache cleared");
    }

    /**
     * Gets cache size (for debugging)
     */
    getCacheSize(): number {
        return this.cache.size;
    }
}

// Export singleton instance
export const locationStatusService = new LocationStatusService();
