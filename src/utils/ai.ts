import { SpaceData, CellState, Player } from '../types';

export interface AIBuildingDecision {
  buyLand: boolean;
  buyVilla: boolean;
  buyBuilding: boolean;
  buyHotel: boolean;
  buyLandmark: boolean;
  totalCost: number;
}

export function decideAIBuilding(
  player: Player,
  space: SpaceData,
  currentState: CellState,
  remainingCash: number
): AIBuildingDecision {
  const isOwner = currentState.owner === player.id;
  const isUnowned = currentState.owner === null;

  let totalCost = 0;
  let buyLand = false;
  let buyVilla = false;
  let buyBuilding = false;
  let buyHotel = false;
  let buyLandmark = false;

  // Buffer so AI doesn't spend 100% of money recklessly
  const reserveBuffer = Math.min(30, remainingCash * 0.2);
  const spendable = remainingCash - reserveBuffer;

  if (isUnowned) {
    if (space.price && space.price <= spendable) {
      buyLand = true;
      totalCost += space.price;

      if (space.isSpecialLand) {
        // For special land, maybe buy landmark right away if rich
        if (space.landmarkPrice && (totalCost + space.landmarkPrice <= spendable)) {
          buyLandmark = true;
          totalCost += space.landmarkPrice;
        }
      } else {
        // Try to buy Villa, Building, Hotel up to budget
        if (space.villaPrice && (totalCost + space.villaPrice <= spendable)) {
          buyVilla = true;
          totalCost += space.villaPrice;
        }
        if (space.buildingPrice && (totalCost + space.buildingPrice <= spendable)) {
          buyBuilding = true;
          totalCost += space.buildingPrice;
        }
        if (space.hotelPrice && (totalCost + space.hotelPrice <= spendable)) {
          buyHotel = true;
          totalCost += space.hotelPrice;
        }
      }
    }
  } else if (isOwner) {
    // Upgrades
    if (space.isSpecialLand) {
      if (!currentState.buildings.isLandmark && space.landmarkPrice && space.landmarkPrice <= spendable) {
        buyLandmark = true;
        totalCost += space.landmarkPrice;
      }
    } else {
      if (!currentState.buildings.hasVilla && space.villaPrice && (totalCost + space.villaPrice <= spendable)) {
        buyVilla = true;
        totalCost += space.villaPrice;
      }
      if (!currentState.buildings.hasBuilding && space.buildingPrice && (totalCost + space.buildingPrice <= spendable)) {
        buyBuilding = true;
        totalCost += space.buildingPrice;
      }
      if (!currentState.buildings.hasHotel && space.hotelPrice && (totalCost + space.hotelPrice <= spendable)) {
        buyHotel = true;
        totalCost += space.hotelPrice;
      }
      // If all 3 built or ready, consider landmark
      const willHaveAll3 = (currentState.buildings.hasVilla || buyVilla) &&
                           (currentState.buildings.hasBuilding || buyBuilding) &&
                           (currentState.buildings.hasHotel || buyHotel);
      if (willHaveAll3 && !currentState.buildings.isLandmark && space.landmarkPrice && (totalCost + space.landmarkPrice <= spendable)) {
        buyLandmark = true;
        totalCost += space.landmarkPrice;
      }
    }
  }

  return {
    buyLand,
    buyVilla,
    buyBuilding,
    buyHotel,
    buyLandmark,
    totalCost
  };
}

export function decideAITakeover(
  player: Player,
  space: SpaceData,
  takeoverCost: number
): boolean {
  // If player has at least 1.5x the takeover cost, acquire!
  return player.money >= takeoverCost * 1.25 && player.money >= 30;
}

export function decideAISpaceTravelDestination(
  spaces: SpaceData[],
  cells: Record<number, CellState>,
  aiPlayer: Player,
  _opponents?: Player[]
): number {
  // Prioritize high-value unowned cities (Seoul #39, Busan #25, Tokyo #31, etc.)
  const highPriority = [39, 25, 37, 36, 33, 31, 29, 26, 24, 23, 21, 19, 18];
  
  for (const pos of highPriority) {
    if (cells[pos]?.owner === null && (spaces[pos]?.price || 0) <= aiPlayer.money * 0.8) {
      return pos;
    }
  }

  // Next prioritize AI's own cities that can be upgraded to Landmark
  for (const pos of highPriority) {
    const cell = cells[pos];
    if (cell && cell.owner === aiPlayer.id && !cell.buildings.isLandmark) {
      return pos;
    }
  }

  // Or Start point (0) for cash bonus
  return 0;
}
