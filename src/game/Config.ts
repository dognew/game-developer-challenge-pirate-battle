/**
 * Defines the strict types for the game configuration.
 * This ensures consistency between the React UI (Options menu) and the PixiJS Game Engine.
 */
export interface ProjectileConfig {
    speed: number;        // Pixels per second
    damage: number;       // Health points reduced on impact
    lifetimeMs: number;   // Milliseconds before the projectile disappears
    range: number;        // Maximum travel distance in pixels
}

export interface WeaponConfig {
    cooldownMs: number;   // Minimum time between shots
    projectile: ProjectileConfig;
}

export interface ShipConfig {
    maxHealth: number;
    moveSpeed: number;    // Pixels per second
    rotateSpeed: number;  // Radians per second
}

export interface ShooterEnemyConfig extends ShipConfig {
    attackRange: number;  // Distance in pixels to start shooting at the player
    weapon: WeaponConfig;
}

export interface ChaserEnemyConfig extends ShipConfig {
    impactDamage: number; // Damage dealt to the player upon collision
}

export interface GameModeConfig {
    sessionTimeMs: number;       // Match duration (Allowed: 60000ms to 180000ms)
    spawnIntervalMs: number;     // Time between enemy spawns
    spawnDistribution: {         // Percentage distribution of enemy types (0.0 to 1.0)
        chaser: number;
        shooter: number;
    };
}

export interface RootGameConfig {
    match: GameModeConfig;
    player: ShipConfig & {
        frontWeapon: WeaponConfig;
        sideWeapon: WeaponConfig;
    };
    enemies: {
        chaser: ChaserEnemyConfig;
        shooter: ShooterEnemyConfig;
    };
}

/**
 * Default balancing and parameters for the game.
 * Values are frame-rate independent (time/pixels based).
 */
export const DEFAULT_CONFIG: RootGameConfig = {
    match: {
        sessionTimeMs: 120000, // 120 seconds
        spawnIntervalMs: 3000, // 3 seconds
        spawnDistribution: {
            chaser: 0.6,  // 60% chance
            shooter: 0.4  // 40% chance
        }
    },
    player: {
        maxHealth: 100,
        moveSpeed: 150,
        rotateSpeed: Math.PI, // 180 degrees per second
        frontWeapon: {
            cooldownMs: 400,
            projectile: {
                speed: 400,
                damage: 20,
                lifetimeMs: 2000,
                range: 600
            }
        },
        sideWeapon: {
            cooldownMs: 800,
            projectile: {
                speed: 350,
                damage: 15,
                lifetimeMs: 1500,
                range: 450
            }
        }
    },
    enemies: {
        chaser: {
            maxHealth: 30,
            moveSpeed: 180, // Slightly faster than player
            rotateSpeed: Math.PI * 1.5,
            impactDamage: 25
        },
        shooter: {
            maxHealth: 40,
            moveSpeed: 100, // Slower than player
            rotateSpeed: Math.PI * 0.8,
            attackRange: 350,
            weapon: {
                cooldownMs: 1500,
                projectile: {
                    speed: 250,
                    damage: 10,
                    lifetimeMs: 2000,
                    range: 400
                }
            }
        }
    }
};