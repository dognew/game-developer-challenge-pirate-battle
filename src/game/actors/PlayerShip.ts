import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';
import { DEFAULT_CONFIG } from '../Config';

/**
 * Represents the player's controlled ship.
 * Handles WASD movement, Arrow keys shooting, acceleration, friction, and rotation.
 */
export class PlayerShip extends PIXI.Container {
    private shipSprite: PIXI.Sprite;
    private frontCannon: PIXI.Sprite;
    private leftCannons: PIXI.Sprite[] = [];
    private rightCannons: PIXI.Sprite[] = [];
    
    // Physics parameters
    private speed = 0;
    private maxSpeed = 6;
    private acceleration = 0.2;
    private friction = 0.95;
    private shallowWaterFriction = 0.85; 
    private rotationSpeed = 0.05;

    // Environmental state
    private inShallowWater = false;

    // Weapons state
    private frontCooldown = 0;
    private leftCooldown = 0;
    private rightCooldown = 0;
    private leftFireTimer = 0;
    private rightFireTimer = 0;

    // Public event emitter for the GameEngine
    public onFire?: (projectiles: { x: number, y: number, heading: number, isFront: boolean }[]) => void;

    // Input state
    private keys: { [key: string]: boolean } = {
        'w': false, 'a': false, 's': false, 'd': false,
        'arrowup': false, 'arrowleft': false, 'arrowright': false
    };

    constructor() {
        super();
        
        // 1. Build Layer: Side Cannons (Underneath the hull)
        for (let i = 0; i < 3; i++) {
            const yOffset = -25 + (i * 25);
            
            // Left (Port) Side - X+ since native forward is Y+
            const leftC = new PIXI.Sprite(AssetManager.getShipTexture('cannon_loose.png'));
            leftC.anchor.set(0.5);
            leftC.x = 22;
            leftC.y = yOffset;
            leftC.rotation = 0; 
            leftC.visible = false;
            this.leftCannons.push(leftC);
            this.addChild(leftC);

            // Right (Starboard) Side - X-
            const rightC = new PIXI.Sprite(AssetManager.getShipTexture('cannon_loose.png'));
            rightC.anchor.set(0.5);
            rightC.x = -22;
            rightC.y = yOffset;
            rightC.rotation = Math.PI; // 180 degrees outwards
            rightC.visible = false;
            this.rightCannons.push(rightC);
            this.addChild(rightC);
        }

        // 2. Build Layer: Hull
        this.shipSprite = new PIXI.Sprite(AssetManager.getShipTexture('ship_1.png'));
        this.shipSprite.anchor.set(0.5);
        this.addChild(this.shipSprite);

        // 3. Build Layer: Front Cannon (On top of the hull)
        this.frontCannon = new PIXI.Sprite(AssetManager.getShipTexture('cannon.png'));
        this.frontCannon.anchor.set(0.5);
        this.frontCannon.rotation = Math.PI / 2; // Face down visually
        this.frontCannon.y = 45; // Positioned near the bottom of the inverted sprite
        this.addChild(this.frontCannon);

        this.setupInputs();
    }

    private setupInputs(): void {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        this.setInput(e.key, true);
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        this.setInput(e.key, false);
    };

    /**
     * Mobile/React Interface: Externally toggle input actions.
     */
    public setInput(action: string, isPressed: boolean): void {
        const key = action.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = isPressed;
        }
    }

    public setInShallowWater(status: boolean): void {
        this.inShallowWater = status;
    }

    /**
     * Core update loop. Receives deltaMs from the main Ticker.
     */
    public update(deltaMs: number): void {
        // Cooldown processing
        if (this.frontCooldown > 0) this.frontCooldown -= deltaMs;
        if (this.leftCooldown > 0) this.leftCooldown -= deltaMs;
        if (this.rightCooldown > 0) this.rightCooldown -= deltaMs;

        // Cannon visibility timers
        if (this.leftFireTimer > 0) {
            this.leftFireTimer -= deltaMs;
            if (this.leftFireTimer <= 0) this.leftCannons.forEach(c => c.visible = false);
        }
        if (this.rightFireTimer > 0) {
            this.rightFireTimer -= deltaMs;
            if (this.rightFireTimer <= 0) this.rightCannons.forEach(c => c.visible = false);
        }

        // Shooting Controls
        if (this.keys['arrowup']) this.fireFront();
        if (this.keys['arrowleft']) this.fireLeft();
        if (this.keys['arrowright']) this.fireRight();

        // Movement Controls
        if (this.keys['a']) this.rotation -= this.rotationSpeed;
        if (this.keys['d']) this.rotation += this.rotationSpeed;

        if (this.keys['s']) {
            this.speed += this.acceleration;
        } else if (this.keys['w']) {
            this.speed -= this.acceleration;
        }

        const currentFriction = this.inShallowWater ? this.shallowWaterFriction : this.friction;
        this.speed *= currentFriction;
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.speed, this.maxSpeed));

        const heading = this.rotation - Math.PI / 2;
        this.x += Math.cos(heading) * this.speed;
        this.y += Math.sin(heading) * this.speed;
    }

    public fireFront(): void {
        if (this.frontCooldown > 0 || !this.onFire) return;
        this.frontCooldown = DEFAULT_CONFIG.player.frontWeapon.cooldownMs;

        // Converts local cannon offset to global arena coordinates based on ship rotation
        const heading = this.rotation + Math.PI / 2; 
        const spawnX = this.x + Math.cos(this.rotation) * this.frontCannon.x - Math.sin(this.rotation) * this.frontCannon.y;
        const spawnY = this.y + Math.sin(this.rotation) * this.frontCannon.x + Math.cos(this.rotation) * this.frontCannon.y;

        this.onFire([{ x: spawnX, y: spawnY, heading, isFront: true }]);
    }

    public fireLeft(): void {
        if (this.leftCooldown > 0 || !this.onFire) return;
        this.leftCooldown = DEFAULT_CONFIG.player.sideWeapon.cooldownMs;
        this.leftFireTimer = 150;
        this.leftCannons.forEach(c => c.visible = true);

        const heading = this.rotation; 
        const projectiles = this.leftCannons.map(cannon => ({
            x: this.x + Math.cos(this.rotation) * cannon.x - Math.sin(this.rotation) * cannon.y,
            y: this.y + Math.sin(this.rotation) * cannon.x + Math.cos(this.rotation) * cannon.y,
            heading,
            isFront: false
        }));

        this.onFire(projectiles);
    }

    public fireRight(): void {
        if (this.rightCooldown > 0 || !this.onFire) return;
        this.rightCooldown = DEFAULT_CONFIG.player.sideWeapon.cooldownMs;
        this.rightFireTimer = 150;
        this.rightCannons.forEach(c => c.visible = true);

        const heading = this.rotation + Math.PI; 
        const projectiles = this.rightCannons.map(cannon => ({
            x: this.x + Math.cos(this.rotation) * cannon.x - Math.sin(this.rotation) * cannon.y,
            y: this.y + Math.sin(this.rotation) * cannon.x + Math.cos(this.rotation) * cannon.y,
            heading,
            isFront: false
        }));

        this.onFire(projectiles);
    }

    public crash(): void {
        this.speed *= -0.5;
    }

    public destroy(options?: PIXI.DestroyOptions): void {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        super.destroy(options);
    }
}