import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';
import { ShipBase } from './ShipBase';
import { DEFAULT_CONFIG } from '../Config';

/**
 * Shooter Enemy Ship.
 * Approaches the player and fires projectiles when within a specific attack range.
 */
export class ShooterEnemy extends ShipBase {
    public currentHealth: number = DEFAULT_CONFIG.enemies.shooter.maxHealth;
    private shipSprite: PIXI.Sprite;
    public frontCannon: PIXI.Sprite;
    public isDestroyed = false;
    
    private attackRange = 300;
    private fireCooldown = 1500; // ms
    private lastFireTime = 0;

    constructor() {
        super({
            speed: 0,
            maxSpeed: 4.5,
            acceleration: 0.1,
            friction: 0.92,
            shallowWaterFriction: 0.85,
            rotationSpeed: 0.05,
            maxHealth: 40
        });
        
        this.shipSprite = new PIXI.Sprite(AssetManager.getShipTexture('ship_3.png'));
        this.shipSprite.anchor.set(0.5);
        this.addChild(this.shipSprite);

        this.frontCannon = new PIXI.Sprite(AssetManager.getShipTexture('cannon.png'));
        this.frontCannon.anchor.set(0.5);
        this.frontCannon.rotation = Math.PI / 2; 
        this.frontCannon.y = 45; 
        this.addChild(this.frontCannon);

        // Ensures the UI elements rendered in super() are on top of ship sprites
        this.setChildIndex(this.healthBarContainer, this.children.length - 1);
    }

    /**
     * Modifies internal intents based on target position and handles shooting logic.
     * Returns true if the ship should fire a projectile this frame.
     */
    public updateAI(targetX: number, targetY: number, currentTime: number): boolean {
        if (this.isDestroyed) return false;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetHeading = Math.atan2(dy, dx);
        
        // Adjust because our ship sprites face DOWN (+90 degrees)
        const desiredRotation = targetHeading - Math.PI / 2;

        // Calculate rotation difference and normalize to -PI to PI
        let diff = desiredRotation - this.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // Decide rotation intent
        this.intent.left = diff < -0.05;
        this.intent.right = diff > 0.05;
        
        let isShooting = false;

        if (distance > this.attackRange) {
            this.intent.forward = true;
        } else {
            this.intent.forward = false;
            
            if (Math.abs(diff) < 0.2 && currentTime - this.lastFireTime > this.fireCooldown) {
                isShooting = true;
                this.lastFireTime = currentTime;
            }
        }

        return isShooting;
    }
}