import { writable, derived, Readable } from "svelte/store";
import { LocationStatus } from "../Phaser/Game/LocationStatus";
import { locationStatusService } from "../Services/LocationStatusService";

/**
 * Map of user identifier (email) to location status
 * This is the internal store holding the data fetched from the API
 */
const locationStatusMap = writable<Map<string, LocationStatus>>(new Map());

/**
 * Map of pending fetch promises to avoid duplicate requests
 */
const pendingFetches = new Map<string, Promise<LocationStatus>>();

/**
 * Fetches location status from API and updates the store
 * @param email User's email address
 * @returns Promise<LocationStatus>
 */
export async function fetchAndSetLocationStatus(email: string): Promise<LocationStatus> {
    if (!email) {
        return LocationStatus.HOMEOFFICE;
    }

    // Check if there's already a pending fetch for this email
    const existingFetch = pendingFetches.get(email);
    if (existingFetch) {
        return existingFetch;
    }

    // Create new fetch promise
    const fetchPromise = locationStatusService
        .fetchLocationStatus(email)
        .then((status) => {
            // Update the store with the fetched status
            locationStatusMap.update((map) => {
                map.set(email, status);
                return map;
            });

            // Remove from pending fetches
            pendingFetches.delete(email);

            return status;
        })
        .catch((error) => {
            console.error(`Error fetching location status for ${email}:`, error);
            pendingFetches.delete(email);
            return LocationStatus.HOMEOFFICE; // Default to HOMEOFFICE on error
        });

    // Store the pending fetch
    pendingFetches.set(email, fetchPromise);

    return fetchPromise;
}

/**
 * Gets the location status for a specific user email (synchronous, from cache)
 * If not in cache, returns HOMEOFFICE and triggers async fetch
 * @param email User's email address
 * @returns LocationStatus - defaults to HOMEOFFICE if not found or on error
 */
export function getLocationStatus(email: string | null | undefined): LocationStatus {
    if (!email) {
        return LocationStatus.HOMEOFFICE; // Default to HOMEOFFICE when no email
    }

    let status: LocationStatus = LocationStatus.HOMEOFFICE; // Default to HOMEOFFICE
    locationStatusMap.subscribe((map) => {
        const foundStatus = map.get(email);
        // If status is UNKNOWN (error from API) or not found, treat as HOMEOFFICE
        status = foundStatus === LocationStatus.UNKNOWN || !foundStatus ? LocationStatus.HOMEOFFICE : foundStatus;
    })();

    // If not in cache, trigger async fetch (fire and forget)
    if (status === LocationStatus.HOMEOFFICE) {
        fetchAndSetLocationStatus(email).catch((error) => {
            console.error(`Background fetch failed for ${email}:`, error);
        });
    }

    return status;
}

/**
 * Creates a readable store for a specific user's location status
 * Useful for reactive UI components
 * Automatically fetches from API if not in cache
 * @param email User's email address
 * @returns Readable<LocationStatus> - defaults to HOMEOFFICE if not found or on error
 */
export function createLocationStatusStore(email: string | null | undefined): Readable<LocationStatus> {
    // Trigger fetch if we have an email
    if (email) {
        fetchAndSetLocationStatus(email).catch((error) => {
            console.error(`Failed to fetch location status for ${email}:`, error);
        });
    }

    return derived(locationStatusMap, ($map) => {
        if (!email) {
            return LocationStatus.HOMEOFFICE; // Default to HOMEOFFICE when no email
        }
        const status = $map.get(email) ?? LocationStatus.HOMEOFFICE; // Default to HOMEOFFICE if not in map

        // If status is UNKNOWN (error from API), treat as HOMEOFFICE
        if (status === LocationStatus.UNKNOWN) {
            return LocationStatus.HOMEOFFICE;
        }

        return status;
    });
}

/**
 * Updates the location status for a specific user
 * @param identifier User's UUID or email address
 * @param status New location status
 */
export function setLocationStatus(identifier: string, status: LocationStatus): void {
    locationStatusMap.update((map) => {
        map.set(identifier, status);
        return map;
    });
}

/**
 * Removes location status for a specific user
 * @param identifier User's UUID or email address
 */
export function removeLocationStatus(identifier: string): void {
    locationStatusMap.update((map) => {
        map.delete(identifier);
        return map;
    });
}

/**
 * Clears all location status data
 */
export function clearLocationStatusData(): void {
    locationStatusMap.set(new Map());
}

/**
 * Gets the entire location status map (for debugging)
 */
export function getLocationStatusMap(): Readable<Map<string, LocationStatus>> {
    return { subscribe: locationStatusMap.subscribe };
}

/**
 * Clears the service cache (for debugging/testing)
 */
export function clearServiceCache(): void {
    locationStatusService.clearCache();
    console.log("LocationStatusStore: Service cache cleared");
}
