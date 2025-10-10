import type { AvailabilityStatus, SayMessage } from "@workadventure/messages";
import { CompanionTextureDescriptionInterface } from "../Companion/CompanionTextures";
import type { WokaTextureDescriptionInterface } from "../Entity/PlayerTextures";
import { LocationStatus } from "./LocationStatus";

export interface PlayerInterface {
    //jid: any;
    userId: number;
    name: string;
    characterTextures: WokaTextureDescriptionInterface[];
    visitCardUrl: string | null;
    companionTexture?: CompanionTextureDescriptionInterface;
    userUuid: string;
    email?: string; // User email for location status API
    availabilityStatus: AvailabilityStatus;
    locationStatus?: LocationStatus;
    color?: string | null;
    outlineColor?: number;
    isLogged?: boolean;
    chatID?: string;
    sayMessage?: SayMessage;
    //chat interface
    //companion: string | null;
    //wokaSrc?: string;
}
