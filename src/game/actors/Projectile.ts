import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';
import type { ProjectileConfig } from '../Config';

/**
 * Represents a cannon ball fired by ships.
 * Self-manages its max travel distance and explosion animation.
 */
export class Projectile extends PIXI.Sprite {
    public isExploding = false;
    
    private distanceTraveled = 0;
    private config: ProjectileConfig;
    private heading: number;
    private explodeTimerMs = 0;

    constructor(x: number, y: number, heading: number, config: ProjectileConfig) {
        super(AssetManager.getShipTexture('cannon_ball.png'));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
        this.heading = heading;
        this.config = config;
        
        // Align visually to the trajectory
        this.rotation = heading;
    }

    /**
     * Updates projectile physics.
     * @returns true if the projectile has finished its lifecycle and should be removed.
     */
    public update(deltaMs: number): boolean {
        if (this.isExploding) {
            this.explodeTimerMs -= deltaMs;
            if (this.explodeTimerMs <= 0) {
                this.parent?.removeChild(this);
                this.destroy();
                return true; 
            }
            return false;
        }

        const moveAmount = this.config.speed * (deltaMs / 1000);
        this.x += Math.cos(this.heading) * moveAmount;
        this.y += Math.sin(this.heading) * moveAmount;
        this.distanceTraveled += moveAmount;

        // Reached maximum allowed travel distance
        if (this.distanceTraveled >= this.config.range) {
            this.explode();
        }

        return false;
    }

    /**
     * Halts movement and plays the explosion effect.
     */
    public explode(): void {
        if (this.isExploding) return;
        this.isExploding = true;
        this.texture = AssetManager.getShipTexture('explosion_3.png');
        this.explodeTimerMs = 150; // Keep the explosion visible for 150ms
    }
}