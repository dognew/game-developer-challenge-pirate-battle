import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';
import { ShipBase } from './ShipBase';

/**
 * Chaser Enemy Ship.
 * Follows the player, causing damage upon collision and blowing itself up.
 */
export class ChaserEnemy extends ShipBase {
    private shipSprite: PIXI.Sprite;
    public isDestroyed = false;

    constructor() {
        // Slightly faster physics to catch the player
        super({
            speed: 0,
            maxSpeed: 6.5,
            acceleration: 0.15,
            friction: 0.95,
            shallowWaterFriction: 0.85,
            rotationSpeed: 0.04,
            maxHealth: 30
        });
        
        // Pick a red ship from the spritesheet for visual distinction
        this.shipSprite = new PIXI.Sprite(AssetManager.getShipTexture('ship_7.png'));
        this.shipSprite.anchor.set(0.5);
        this.addChild(this.shipSprite);

        // Ensures the UI elements rendered in super() are on top of ship sprites
        this.setChildIndex(this.healthBarContainer, this.children.length - 1);
    }

    /**
     * Modifies the internal intents based on the target position.
     */
    public chaseTarget(targetX: number, targetY: number): void {
        if (this.isDestroyed) return;

        // Angle between enemy and target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const targetHeading = Math.atan2(dy, dx);
        
        // Adjust because our ship sprites face UP (-90 degrees)
        const desiredRotation = targetHeading - Math.PI / 2;

        // Calculate rotation difference and normalize to -PI to PI
        let diff = desiredRotation - this.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // Decide rotation intent
        this.intent.left = diff < -0.05;
        this.intent.right = diff > 0.05;
        
        // Always try to move forward
        this.intent.forward = true;
    }
}