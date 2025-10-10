/**
 * Enum representing the physical location status of a user
 */
export enum LocationStatus {
    HOMEOFFICE = "HOMEOFFICE",
    PRESENTE = "PRESENTE",
    UNKNOWN = "UNKNOWN",
}

/**
 * Interface for the API response from the presence control system
 */
export interface PresencaAPIResponse {
    STATUS_FINAL: string; // "FALTA" | "PRESENTE" | ""
}

/**
 * Maps API status to LocationStatus enum
 * @param statusFinal The status returned from the API
 * @returns LocationStatus enum value
 */
export function mapAPIStatusToLocationStatus(statusFinal: string | undefined): LocationStatus {
    if (!statusFinal || statusFinal.trim() === "" || statusFinal.toUpperCase() === "FALTA") {
        return LocationStatus.HOMEOFFICE;
    }
    if (statusFinal.toUpperCase() === "PRESENTE") {
        return LocationStatus.PRESENTE;
    }
    return LocationStatus.UNKNOWN;
}

/**
 * Returns a user-friendly label for the location status
 * @param status LocationStatus enum value
 * @returns Display label in Portuguese
 */
export function getLocationStatusLabel(status: LocationStatus): string {
    switch (status) {
        case LocationStatus.HOMEOFFICE:
            return "Home-Office";
        case LocationStatus.PRESENTE:
            return "Presencial";
        case LocationStatus.UNKNOWN:
            return "Home-Office"; // Default to Home-Office on unknown/error
    }
}

/**
 * Returns a shorter version of the label for badges
 * @param status LocationStatus enum value
 * @returns Short label
 */
export function getLocationStatusShortLabel(status: LocationStatus): string {
    switch (status) {
        case LocationStatus.HOMEOFFICE:
            return "HO";
        case LocationStatus.PRESENTE:
            return "P";
        case LocationStatus.UNKNOWN:
            return "HO"; // Default to HO on unknown/error
    }
}

/**
 * Returns the color associated with each location status
 * @param status LocationStatus enum value
 * @returns Hex color code
 */
export function getLocationStatusColor(status: LocationStatus): number {
    switch (status) {
        case LocationStatus.HOMEOFFICE:
            return 0x4a90e2; // Blue
        case LocationStatus.PRESENTE:
            return 0x68e97a; // Green
        case LocationStatus.UNKNOWN:
            return 0x95a5a6; // Gray
    }
}

/**
 * Returns the emoji icon for each location status
 * @param status LocationStatus enum value
 * @returns Emoji string
 */
export function getLocationStatusEmoji(status: LocationStatus): string {
    switch (status) {
        case LocationStatus.HOMEOFFICE:
            return "🏠";
        case LocationStatus.PRESENTE:
            return "🏢";
        case LocationStatus.UNKNOWN:
            return "❓";
    }
}
