import { Easing } from "../../types";
import { LocationStatus, getLocationStatusColor, getLocationStatusLabel } from "../Game/LocationStatus";

/**
 * LocationBadge displays a visual indicator of the user's physical location status
 * (Home Office, Presencial, or Unknown) above their character
 */
export class LocationBadge extends Phaser.GameObjects.Container {
    private shown: boolean;
    private showAnimationTween?: Phaser.Tweens.Tween;
    private currentStatus: LocationStatus;

    private defaultPosition: { x: number; y: number };
    private defaultScale: number;

    private badge: Phaser.GameObjects.Graphics;
    private badgeText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, initialStatus: LocationStatus = LocationStatus.UNKNOWN) {
        super(scene, x, y);

        this.defaultPosition = { x, y };
        this.defaultScale = 1;
        this.currentStatus = initialStatus;
        this.shown = false;

        // Create the badge background (rounded rectangle)
        this.badge = new Phaser.GameObjects.Graphics(scene);
        this.add(this.badge);

        // Create the text label
        this.badgeText = new Phaser.GameObjects.Text(scene, 0, 0, "", {
            fontSize: "9px",
            fontFamily: "Lato",
            color: "#FFFFFF",
            align: "center",
            fontStyle: "bold",
        });
        this.badgeText.setOrigin(0.5, 0.5);
        this.add(this.badgeText);

        // Initial render
        this.updateBadgeAppearance();

        this.setAlpha(0);
        this.setScale(this.defaultScale);

        this.scene.add.existing(this);
    }

    /**
     * Updates the badge appearance based on the current status
     */
    private updateBadgeAppearance(): void {
        const color = getLocationStatusColor(this.currentStatus);
        const label = getLocationStatusLabel(this.currentStatus);

        // Update text
        this.badgeText.setText(label);

        // Calculate width based on text length
        const textWidth = this.badgeText.width;
        const padding = 6;
        const badgeWidth = textWidth + padding * 2;
        const badgeHeight = 14;

        // Redraw background
        this.badge.clear();
        this.badge.fillStyle(color, 1);
        this.badge.fillRoundedRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 3);
    }

    /**
     * Sets the location status and updates the badge appearance
     * @param status The new location status
     */
    public setStatus(status: LocationStatus): void {
        if (this.currentStatus === status) {
            return;
        }

        this.currentStatus = status;
        this.updateBadgeAppearance();

        // If already shown, trigger a small pulse animation
        if (this.shown) {
            this.scene.tweens.add({
                targets: [this],
                duration: 200,
                scale: this.defaultScale * 1.2,
                yoyo: true,
                ease: Easing.BackEaseIn,
            });
        }
    }

    /**
     * Gets the current location status
     */
    public getStatus(): LocationStatus {
        return this.currentStatus;
    }

    /**
     * Shows or hides the badge with animation
     * @param show Whether to show the badge
     * @param forceClose Force close animation even if already animating
     */
    public show(show = true, forceClose = false): void {
        if (this.shown === show && !forceClose) {
            return;
        }
        this.showAnimation(show, forceClose);
    }

    /**
     * Animation for showing/hiding the badge
     */
    private showAnimation(show = true, forceClose = false): void {
        if (!this.scene) {
            // In case the LocationBadge is destroyed because the underlying character was destroyed
            return;
        }

        if (forceClose && !show) {
            this.showAnimationTween?.stop();
        } else if (this.showAnimationTween?.isPlaying()) {
            return;
        }

        this.shown = show;

        if (show) {
            this.y += 20;
            this.scale = 0.05;
            this.alpha = 0;
        }

        this.showAnimationTween = this.scene.tweens.add({
            targets: [this],
            duration: 350,
            alpha: show ? 1 : 0,
            y: this.defaultPosition.y,
            scale: this.defaultScale,
            ease: Easing.BackEaseOut,
            onComplete: () => {
                this.showAnimationTween = undefined;
            },
        });
    }

    /**
     * Returns whether the badge is currently shown
     */
    public isShown(): boolean {
        return this.shown;
    }
}
