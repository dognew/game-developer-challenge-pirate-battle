import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';
import { DEFAULT_CONFIG } from '../Config';
import { ShipBase } from './ShipBase';

/**
 * Represents the player's controlled ship.
 * Extends ShipBase to utilize shared movement and collision physics.
 */
export class PlayerShip extends ShipBase {
    private shipSprite: PIXI.Sprite;
    private frontCannon: PIXI.Sprite;
    private leftCannons: PIXI.Sprite[] = [];
    private rightCannons: PIXI.Sprite[] = [];

    // Weapons state
    private frontCooldown = 0;
    private leftCooldown = 0;
    private rightCooldown = 0;
    private leftFireTimer = 0;
    private rightFireTimer = 0;

    public onFire?: (projectiles: { x: number, y: number, heading: number, isFront: boolean }[]) => void;

    private keys: { [key: string]: boolean } = {
        'w': false, 'a': false, 's': false, 'd': false,
        'arrowup': false, 'arrowleft': false, 'arrowright': false
    };

    constructor() {
        // Feed the specific player balancing configs to the base class
        super({
            speed: 0,
            maxSpeed: 6,
            acceleration: 0.2,
            friction: 0.95,
            shallowWaterFriction: 0.85,
            rotationSpeed: 0.05,
            maxHealth: 100
        }, 'player');
        
        for (let i = 0; i < 3; i++) {
            const yOffset = -25 + (i * 25);
            
            const leftC = new PIXI.Sprite(AssetManager.getShipTexture('cannon_loose.png'));
            leftC.anchor.set(0.5);
            leftC.x = 22;
            leftC.y = yOffset;
            leftC.rotation = 0; 
            leftC.visible = false;
            this.leftCannons.push(leftC);
            this.addChild(leftC);

            const rightC = new PIXI.Sprite(AssetManager.getShipTexture('cannon_loose.png'));
            rightC.anchor.set(0.5);
            rightC.x = -22;
            rightC.y = yOffset;
            rightC.rotation = Math.PI; 
            rightC.visible = false;
            this.rightCannons.push(rightC);
            this.addChild(rightC);
        }

        this.shipSprite = new PIXI.Sprite(AssetManager.getShipTexture('ship_1.png'));
        this.shipSprite.anchor.set(0.5);
        this.addChild(this.shipSprite);

        this.frontCannon = new PIXI.Sprite(AssetManager.getShipTexture('cannon.png'));
        this.frontCannon.anchor.set(0.5);
        this.frontCannon.rotation = Math.PI / 2; 
        this.frontCannon.y = 45; 
        this.addChild(this.frontCannon);

        // Ensures the UI elements rendered in super() are on top of ship sprites
        this.setChildIndex(this.healthBarContainer, this.children.length - 1);

        this.setupInputs();
    }

    private setupInputs(): void {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    private onKeyDown = (e: KeyboardEvent): void => { this.setInput(e.key, true); };
    private onKeyUp = (e: KeyboardEvent): void => { this.setInput(e.key, false); };

    public setInput(action: string, isPressed: boolean): void {
        const key = action.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = isPressed;
        }
    }

    public update(deltaMs: number): void {
        // Map raw inputs to physics intents before calling super.update
        this.intent.forward = this.keys['w'];
        this.intent.backward = this.keys['s'];
        this.intent.left = this.keys['a'];
        this.intent.right = this.keys['d'];

        super.update(deltaMs);

        if (this.frontCooldown > 0) this.frontCooldown -= deltaMs;
        if (this.leftCooldown > 0) this.leftCooldown -= deltaMs;
        if (this.rightCooldown > 0) this.rightCooldown -= deltaMs;

        if (this.leftFireTimer > 0) {
            this.leftFireTimer -= deltaMs;
            if (this.leftFireTimer <= 0) this.leftCannons.forEach(c => c.visible = false);
        }
        if (this.rightFireTimer > 0) {
            this.rightFireTimer -= deltaMs;
            if (this.rightFireTimer <= 0) this.rightCannons.forEach(c => c.visible = false);
        }

        if (this.keys['arrowup']) this.fireFront();
        if (this.keys['arrowleft']) this.fireLeft();
        if (this.keys['arrowright']) this.fireRight();
    }

    public fireFront(): void {
        if (this.frontCooldown > 0 || !this.onFire) return;
        this.frontCooldown = DEFAULT_CONFIG.player.frontWeapon.cooldownMs;

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

    public destroy(options?: PIXI.DestroyOptions): void {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        super.destroy(options);
    }
}