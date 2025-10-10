import { localUserStore } from "../Connection/LocalUserStore";
import { fetchAndSetLocationStatus, getLocationStatusMap } from "../Stores/LocationStatusStore";
import { locationStatusService } from "../Services/LocationStatusService";

declare global {
    interface Window {
        debugLocationStatus?: LocationStatusDebug;
    }
}

/**
 * Debug utilities for Location Status feature
 * Use in browser console: window.debugLocationStatus
 */
export class LocationStatusDebug {
    /**
     * Test API call with a specific email
     */
    async testAPI(email: string): Promise<void> {
        console.log("=== Testing Location Status API ===");
        console.log(`Email: ${email}`);

        try {
            const status = await locationStatusService.fetchLocationStatus(email);
            console.log(`✅ Result: ${status}`);
        } catch (error) {
            console.error("❌ Error:", error);
        }
    }

    /**
     * Get current user email
     */
    getCurrentUserEmail(): string | null {
        const localUser = localUserStore.getLocalUser();
        const email = localUser?.email;
        console.log("Current user email:", email);
        return email ?? null;
    }

    /**
     * Test with current user
     */
    async testCurrentUser(): Promise<void> {
        const email = this.getCurrentUserEmail();
        if (!email) {
            console.warn("⚠️ No email found for current user!");
            return;
        }
        await this.testAPI(email);
    }

    /**
     * Show current cache
     */
    showCache(): void {
        console.log("=== Current Location Status Cache ===");
        getLocationStatusMap().subscribe((map) => {
            if (map.size === 0) {
                console.log("Cache is empty");
            } else {
                map.forEach((status, email) => {
                    console.log(`${email}: ${status}`);
                });
            }
        })();
    }

    /**
     * Force refresh for current user
     */
    async refreshCurrentUser(): Promise<void> {
        const email = this.getCurrentUserEmail();
        if (!email) {
            console.warn("⚠️ No email found for current user!");
            return;
        }

        console.log(`🔄 Refreshing status for ${email}...`);
        await fetchAndSetLocationStatus(email);
        this.showCache();
    }

    /**
     * Test direct API call
     */
    async testDirectAPI(email: string, date?: string): Promise<void> {
        const testDate = date ?? new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const url = `https://portalweb.rrperfumes.com.br/api/controlid/controle_presenca/?data=${testDate}&email=${encodeURIComponent(
            email
        )}`;

        console.log("=== Direct API Test ===");
        console.log("URL:", url);

        try {
            const response = await fetch(url);
            console.log("Status:", response.status, response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log("Response:", JSON.stringify(data, null, 2));
            } else {
                console.error("Error response:", await response.text());
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }

    /**
     * Show service cache stats
     */
    showServiceStats(): void {
        console.log("=== Service Stats ===");
        console.log("Cache size:", locationStatusService.getCacheSize());
    }
}

// Export to window for console access
if (typeof window !== "undefined") {
    window.debugLocationStatus = new LocationStatusDebug();
    console.log("🔧 Location Status Debug loaded! Use: window.debugLocationStatus.testCurrentUser()");
}
