import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';

/**
 * Represents the player's controlled ship.
 * Handles WASD input, acceleration, friction, and rotation.
 */
export class PlayerShip extends PIXI.Container {
    private shipSprite: PIXI.Sprite;
    
    // Physics parameters
    private speed = 0;
    private maxSpeed = 6;
    private acceleration = 0.2;
    private friction = 0.95;
    private shallowWaterFriction = 0.85; // Increases drag
    private rotationSpeed = 0.05;

    // Environmental state
    private inShallowWater = false;

    // Input state
    private keys: { [key: string]: boolean } = {
        'w': false, 'a': false, 's': false, 'd': false
    };

    constructor() {
        super();
        
        this.shipSprite = new PIXI.Sprite(AssetManager.getShipTexture('ship_1.png'));
        this.shipSprite.anchor.set(0.5);
        this.addChild(this.shipSprite);

        this.setupInputs();
    }

    private setupInputs(): void {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
    };

    /**
     * Toggles the environmental drag applied to the ship.
     */
    public setInShallowWater(status: boolean): void {
        this.inShallowWater = status;
    }

    /**
     * Called every frame by the GameEngine ticker.
     * Calculates the new position based on inputs and inertia.
     */
    public update(): void {
        if (this.keys['a']) this.rotation -= this.rotationSpeed;
        if (this.keys['d']) this.rotation += this.rotationSpeed;

        if (this.keys['s']) {
            this.speed += this.acceleration;
        } else if (this.keys['w']) {
            this.speed -= this.acceleration;
        }

        // Apply dynamic water friction
        const currentFriction = this.inShallowWater ? this.shallowWaterFriction : this.friction;
        this.speed *= currentFriction;

        // Cap speed (reversing is slower than going forward)
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.speed, this.maxSpeed));

        // The ship sprites face UP (-90 degrees / -PI/2 radians). 
        // We offset the rotation to move in the correct visual direction.
        const heading = this.rotation - Math.PI / 2;
        
        this.x += Math.cos(heading) * this.speed;
        this.y += Math.sin(heading) * this.speed;
    }

    /**
     * Halts forward momentum and applies a slight bounce effect upon collision.
     */
    public crash(): void {
        this.speed *= -0.5;
    }

    /**
     * Cleanup event listeners to prevent memory leaks when changing screens.
     */
    public destroy(options?: PIXI.DestroyOptions): void {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        super.destroy(options);
    }
}