import { TerrainBase } from '../TerrainBase';
import { IslandModelA } from './IslandModelA';
import { IslandModelB } from './IslandModelB';
import { IslandModelC } from './IslandModelC';
import { IslandModelD } from './IslandModelD';
import { IslandModelE } from './IslandModelE';
import { IslandModelF } from './IslandModelF';

/**
 * Registry of all available island models.
 * The GameEngine will pick random classes from this array to instantiate.
 */
export const AvailableIslands: (new () => TerrainBase)[] = [
    IslandModelA,
    IslandModelB,
    IslandModelC,
    IslandModelD,
    IslandModelE,
    IslandModelF
];