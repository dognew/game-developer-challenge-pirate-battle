import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';
import { ShipBase } from './ShipBase';

/**
 * Chaser Enemy Ship.
 * Follows the player, causing damage upon collision and blowing itself up.
 */
export class ChaserEnemy extends ShipBase {
    private shipSprite: PIXI.Sprite;
    private explosion: PIXI.AnimatedSprite | null = null;
    public isDestroyed = false;
    public isExploding = false;

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
        this.setDamageVisualTarget(this.shipSprite);

        // Ensures the UI elements rendered in super() are on top of ship sprites
        this.setChildIndex(this.healthBarContainer, this.children.length - 1);
    }

    /**
     * Modifies the internal intents based on the target position.
     */
    public chaseTarget(targetX: number, targetY: number): void {
        if (this.isDestroyed || this.isExploding) return;

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

    public explode(): void {
        if (this.isExploding || this.isDestroyed) return;

        this.isExploding = true;
        this.shipSprite.visible = false;
        this.healthBarContainer.visible = false;

        this.explosion = new PIXI.AnimatedSprite([
            AssetManager.getShipTexture('explosion_1.png'),
            AssetManager.getShipTexture('explosion_2.png'),
            AssetManager.getShipTexture('explosion_3.png'),
        ]);
        this.explosion.anchor.set(0.5);
        this.explosion.animationSpeed = 0.15;
        this.explosion.loop = false;
        this.explosion.onComplete = () => {
            this.isDestroyed = true;
            this.parent?.removeChild(this);
            this.explosion?.parent?.removeChild(this.explosion);
            this.explosion?.destroy();
            this.explosion = null;
        };
        this.addChild(this.explosion);
        this.explosion.play();
    }
}