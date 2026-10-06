import * as PIXI from 'pixi.js';
import { AssetManager } from '../AssetManager';

export interface ShipPhysics {
    speed: number;
    maxSpeed: number;
    acceleration: number;
    friction: number;
    shallowWaterFriction: number;
    rotationSpeed: number;
    maxHealth: number;
}

type HealthBarStyle = 'player' | 'enemy';

interface HealthBarLayout {
    frameTexture: string;
    fillTextures: {
        green: string;
        amber?: string;
        red: string;
    };
    width: number;
    height: number;
    fillX: number;
    fillY: number;
    fillWidth: number;
    fillHeight: number;
    scale: number;
}

/**
 * Abstract base class for all ships (Player, Chaser, Shooter).
 * Handles movement vectors, environment friction, and crash logic.
 */
export abstract class ShipBase extends PIXI.Container {
    protected physics: ShipPhysics;
    protected inShallowWater = false;
    public currentHealth: number;
    public isDead = false;

    // Movement intent defined by child classes (Inputs or AI)
    protected intent = { forward: false, backward: false, left: false, right: false };

    // UI Elements
    protected healthBarContainer: PIXI.Container;
    protected healthFillMask: PIXI.Graphics;
    protected healthFillSprite!: PIXI.Sprite;
    private readonly healthBarLayout: HealthBarLayout;
    private readonly healthFillTextures: { green: PIXI.Texture; amber?: PIXI.Texture; red: PIXI.Texture };
    private damageVisualTarget: PIXI.Sprite | null = null;
    protected damageEffects: PIXI.Sprite[] = [];

    constructor(physics: ShipPhysics, healthBarStyle: HealthBarStyle = 'enemy') {
        super();
        this.physics = physics;
        this.currentHealth = physics.maxHealth;
        this.healthBarLayout = healthBarStyle === 'player'
            ? {
                frameTexture: 'health_frame',
                fillTextures: {
                    green: 'health_fill_green',
                    amber: 'health_fill_amber',
                    red: 'health_fill_red',
                },
                width: 256,
                height: 48,
                fillX: 30,
                fillY: 15,
                fillWidth: 196,
                fillHeight: 20,
                scale: 0.25,
            }
            : {
                frameTexture: 'enemy_health_frame',
                fillTextures: {
                    green: 'enemy_health_fill_green',
                    red: 'enemy_health_fill_red',
                },
                width: 160,
                height: 40,
                fillX: 24,
                fillY: 12,
                fillWidth: 112,
                fillHeight: 15,
                scale: 0.5,
            };
        this.healthFillTextures = {
            green: AssetManager.getUiTexture(this.healthBarLayout.fillTextures.green),
            amber: this.healthBarLayout.fillTextures.amber
                ? AssetManager.getUiTexture(this.healthBarLayout.fillTextures.amber)
                : undefined,
            red: AssetManager.getUiTexture(this.healthBarLayout.fillTextures.red),
        };

        // Initialize health bar UI
        this.healthBarContainer = new PIXI.Container();
        this.healthFillMask = new PIXI.Graphics();
        this.buildHealthBar();
    }

    private buildHealthBar(): void {
        const frameTexture = AssetManager.getUiTexture(this.healthBarLayout.frameTexture);

        const frame = new PIXI.Sprite(frameTexture);
        this.healthFillSprite = new PIXI.Sprite(this.healthFillTextures.green);

        frame.anchor.set(0);
        this.healthFillSprite.anchor.set(0);

        this.healthBarContainer.x = -this.healthBarLayout.width * this.healthBarLayout.scale / 2;
        this.healthBarContainer.y = -50;
        this.healthBarContainer.scale.set(this.healthBarLayout.scale);

        this.healthFillMask.rect(
            this.healthBarLayout.fillX,
            this.healthBarLayout.fillY,
            this.healthBarLayout.fillWidth,
            this.healthBarLayout.fillHeight,
        );
        this.healthFillMask.fill(0xffffff);

        this.healthFillSprite.mask = this.healthFillMask;

        this.healthBarContainer.addChild(frame);
        this.healthBarContainer.addChild(this.healthFillSprite);
        this.healthBarContainer.addChild(this.healthFillMask);

        this.addChild(this.healthBarContainer);
        this.updateHealthUI();
    }

    public updateHealthUI(): void {
        const healthPercent = Math.min(1, Math.max(0, this.currentHealth / this.physics.maxHealth));
        
        this.healthFillMask.clear();
        this.healthFillMask.rect(
            this.healthBarLayout.fillX,
            this.healthBarLayout.fillY,
            this.healthBarLayout.fillWidth * healthPercent,
            this.healthBarLayout.fillHeight,
        );
        this.healthFillMask.fill(0xffffff);

        if (healthPercent <= 0.3) {
            this.healthFillSprite.texture = this.healthFillTextures.red;
        } else if (healthPercent <= 0.6 && this.healthFillTextures.amber) {
            this.healthFillSprite.texture = this.healthFillTextures.amber;
        } else {
            this.healthFillSprite.texture = this.healthFillTextures.green;
        }
    }

    protected setDamageVisualTarget(shipSprite: PIXI.Sprite): void {
        this.damageVisualTarget = shipSprite;
        this.damageEffects = [
            new PIXI.Sprite(AssetManager.getShipTexture('fire_2.png')),
            new PIXI.Sprite(AssetManager.getShipTexture('fire_1.png')),
            new PIXI.Sprite(AssetManager.getShipTexture('fire_2.png')),
        ];

        const positions = [
            { x: -10, y: -15 },
            { x: 7, y: 8 },
            { x: -4, y: 27 },
        ];

        this.damageEffects.forEach((effect, index) => {
            effect.anchor.set(0.5, 0.8);
            effect.scale.set(0.65);
            effect.position.set(positions[index].x, positions[index].y);
            effect.visible = false;
            this.addChild(effect);
        });

        this.updateDamageVisual();
    }

    public takeDamage(amount: number): void {
        if (!Number.isFinite(amount) || amount <= 0 || this.isDead) return;

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthUI();
        this.updateDamageVisual();

        if (this.currentHealth === 0) {
            this.isDead = true;
            this.onDeath();
        }
    }

    protected onDeath(): void {
        this.physics.speed = 0;
        this.intent.forward = false;
        this.intent.backward = false;
        this.intent.left = false;
        this.intent.right = false;
        this.damageEffects.forEach((effect) => effect.visible = false);
    }

    private updateDamageVisual(): void {
        if (!this.damageVisualTarget) return;

        const healthPercent = Math.min(1, Math.max(0, this.currentHealth / this.physics.maxHealth));
        const damageStage = healthPercent <= 0.25
            ? 3
            : healthPercent <= 0.5
                ? 2
                : healthPercent <= 0.75
                    ? 1
                    : 0;

        this.damageVisualTarget.tint = healthPercent <= 0.25
            ? 0xff9999
            : healthPercent <= 0.5
                ? 0xffcccc
                : 0xffffff;

        this.damageEffects.forEach((effect, index) => {
            effect.visible = index < damageStage;
        });
    }

    public setInShallowWater(status: boolean): void {
        this.inShallowWater = status;
    }

    /**
     * Halts forward momentum and applies a slight bounce effect upon collision.
     */
    public crash(): void {
        this.physics.speed *= -0.5;
    }

    /**
     * Core update loop for physics and translation.
     */
    public update(_deltaMs: number): void {
        if (this.isDead) return;

        if (this.intent.left) this.rotation -= this.physics.rotationSpeed;
        if (this.intent.right) this.rotation += this.physics.rotationSpeed;

        // Forward adds speed, backward reduces it
        if (this.intent.forward) {
            this.physics.speed += this.physics.acceleration;
        } else if (this.intent.backward) {
            this.physics.speed -= this.physics.acceleration;
        }

        const currentFriction = this.inShallowWater ? this.physics.shallowWaterFriction : this.physics.friction;
        this.physics.speed *= currentFriction;
        
        // Cap speed (reversing is slower than going forward)
        this.physics.speed = Math.max(-this.physics.maxSpeed / 2, Math.min(this.physics.speed, this.physics.maxSpeed));

        // Adjust heading considering the sprite natively faces DOWN (+90 degrees)
        const heading = this.rotation + Math.PI / 2;
        this.x += Math.cos(heading) * this.physics.speed;
        this.y += Math.sin(heading) * this.physics.speed;

        // Counter-rotate the health bar to keep it horizontal
        this.healthBarContainer.rotation = -this.rotation;
    }
}