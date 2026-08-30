import React, { useState, useEffect } from 'react';
import { 
  Player, 
  CellState, 
  GameLogEntry, 
  GameModeConfig,
  GameOverResult,
  GoldenKeyCard, 
  FloatingEffect,
  SpaceData 
} from './types';
import { BOARD_SPACES, calculateToll, calculateSpaceValue } from './data/boardData';
import { getRandomGoldenKey } from './data/goldenKeyData';
import { soundManager } from './utils/audio';
import { decideAIBuilding, decideAITakeover, decideAISpaceTravelDestination } from './utils/ai';
import { createPlayersForMode } from './utils/playerPresets';
import { Board } from './components/Board';
import { Sidebar } from './components/Sidebar';
import { PurchaseModal } from './components/PurchaseModal';
import { TollModal } from './components/TollModal';
import { GoldenKeyModal } from './components/GoldenKeyModal';
import { SpaceTravelModal } from './components/SpaceTravelModal';
import { TurnTransitionBanner } from './components/TurnTransitionBanner';
import { GameOverModal } from './components/GameOverModal';
import { ModeSelectModal } from './components/ModeSelectModal';
import { FloatingCashEffect } from './components/FloatingCashEffect';
import { GameSetupScreen } from './components/GameSetupScreen';

const INITIAL_MONEY = 300; // 300만 원 initial cash
const SALARY_AMOUNT = 20; // 20만 원 salary

export default function App() {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [gameConfig, setGameConfig] = useState<GameModeConfig>({
    humanCount: 2,
    aiCount: 0
  });
  const [customNames, setCustomNames] = useState<string[]>(['플레이어 1', '플레이어 2']);
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize Players based on config (Default: Human 2 Players, 0 AI)
  const [players, setPlayers] = useState<Player[]>(() =>
    createPlayersForMode(2, 0, INITIAL_MONEY)
  );

  // Cells state
  const [cells, setCells] = useState<Record<number, CellState>>(() => {
    const init: Record<number, CellState> = {};
    BOARD_SPACES.forEach((s) => {
      init[s.id] = {
        owner: null,
        buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
        currentToll: 0
      };
    });
    return init;
  });

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [socialFund, setSocialFund] = useState<number>(50); // initial fund jackpot

  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastDice, setLastDice] = useState<[number, number] | null>(null);
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [doubleCount, setDoubleCount] = useState<number>(0);

  const [gameLogs, setGameLogs] = useState<GameLogEntry[]>([]);
  const [floatingEffects, setFloatingEffects] = useState<FloatingEffect[]>([]);
  const [turnBannerVisible, setTurnBannerVisible] = useState<boolean>(true);

  // Active modal controls
  const [activeModal, setActiveModal] = useState<null | 'purchase' | 'toll' | 'golden_key' | 'space_travel' | 'game_over'>(null);
  const [currentGoldenKey, setCurrentGoldenKey] = useState<GoldenKeyCard | null>(null);
  const [currentTollData, setCurrentTollData] = useState<{ space: SpaceData; owner: Player; payer: Player } | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverResult | null>(null);

  // Update sound manager toggle
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial welcome log
  useEffect(() => {
    addLog(0, "🎲 모두의 부루마블 게임이 시작되었습니다! 주사위를 굴려 부를 축적하세요.", "event");
    setTurnBannerVisible(true);
    const timer = setTimeout(() => setTurnBannerVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Trigger floating cash animation
  const showFloatingEffect = (playerId: number, amount: number, isPositive: boolean) => {
    const newFx: FloatingEffect = {
      id: Math.random().toString(),
      playerId,
      amount,
      isPositive,
      text: `${isPositive ? '+' : '-'}${amount}만 원`,
      x: 50 + (playerId % 2 === 0 ? -15 : 15),
      y: 50
    };
    setFloatingEffects(prev => [...prev, newFx]);
    setTimeout(() => {
      setFloatingEffects(prev => prev.filter(f => f.id !== newFx.id));
    }, 1800);
  };

  // Add game log
  const addLog = (playerId: number, text: string, type: GameLogEntry['type']) => {
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setGameLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        playerId,
        text,
        type,
        timestamp: timeStr
      }
    ]);
  };

  // Recalculate total assets
  const updateTotalAssets = (updatedPlayers: Player[], updatedCells: Record<number, CellState>) => {
    return updatedPlayers.map(p => {
      let assetSum = p.money;
      let count = 0;
      Object.entries(updatedCells).forEach(([idStr, cell]) => {
        if (cell.owner === p.id) {
          count++;
          const space = BOARD_SPACES[Number(idStr)];
          if (space) {
            assetSum += calculateSpaceValue(space, cell.buildings);
          }
        }
      });
      return {
        ...p,
        totalAssets: assetSum,
        ownedCityCount: count
      };
    });
  };

  // Switch Turn handler
  const endTurn = (rolledDouble: boolean = false) => {
    if (rolledDouble) {
      soundManager.playTurnSwitch();
      setTurnBannerVisible(true);
      setTimeout(() => setTurnBannerVisible(false), 1800);
      return;
    }

    setDoubleCount(0);
    setIsDouble(false);

    setPlayers(currentPlayers => {
      const total = currentPlayers.length;
      let nextIdx = activePlayerIndex;
      for (let i = 1; i <= total; i++) {
        const candidate = (activePlayerIndex + i) % total;
        if (!currentPlayers[candidate].isBankrupt) {
          nextIdx = candidate;
          break;
        }
      }
      setActivePlayerIndex(nextIdx);
      setTurnCount(prev => prev + 1);
      return currentPlayers;
    });

    // Play turn switch sound & show banner
    soundManager.playTurnSwitch();
    setTurnBannerVisible(true);
    setTimeout(() => setTurnBannerVisible(false), 1800);
  };

  // Check Game Over & Bankruptcy
  const checkGameOver = (playerList: Player[]) => {
    const updated = playerList.map(p => {
      if (p.money < 0 && !p.isBankrupt) {
        addLog(p.id, `🚨 ${p.name} 보유 자금 고갈로 파산 탈락했습니다!`, 'bankrupt');
        return { ...p, isBankrupt: true };
      }
      return p;
    });

    // Clear bankrupt player's owned tiles so other players can acquire them
    const bankruptIds = updated.filter(p => p.isBankrupt).map(p => p.id);
    if (bankruptIds.length > 0) {
      setCells(prev => {
        const nextCells: Record<number, CellState> = { ...prev };
        let modified = false;
        Object.entries(nextCells).forEach(([idStr, cell]) => {
          if (cell.owner !== null && bankruptIds.includes(cell.owner)) {
            nextCells[Number(idStr)] = {
              owner: null,
              buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
              currentToll: 0
            };
            modified = true;
          }
        });
        return modified ? nextCells : prev;
      });
    }

    const activePlayers = updated.filter(p => !p.isBankrupt);
    if (activePlayers.length <= 1) {
      const winner = activePlayers[0] || updated[0];
      const rankings = [...updated].sort((a, b) => {
        if (a.isBankrupt !== b.isBankrupt) return a.isBankrupt ? 1 : -1;
        return b.totalAssets - a.totalAssets;
      });

      soundManager.playVictory();
      setGameOverData({
        winner,
        rankings,
        reason: updated.length > 2 ? '최후의 1인 생존 완승!' : `${winner.name}의 독점 완승!`
      });
      setActiveModal('game_over');
      return true;
    }

    return false;
  };

  // Handle Action on Space Landing
  const handleSpaceAction = (player: Player, space: SpaceData) => {
    const cellState = cells[space.id];

    // 1. Uninhabited Island
    if (space.type === 'island') {
      soundManager.playTollPenalty();
      addLog(player.id, `🏝️ ${player.name}가 무인도에 조난되었습니다! (3턴 격리)`, 'event');
      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, islandTurnsLeft: 3 } : p);
        return updateTotalAssets(next, cells);
      });
      setTimeout(() => endTurn(isDouble), 800);
      return;
    }

    // 2. Space Travel
    if (space.type === 'space') {
      soundManager.playGoldenKey();
      addLog(player.id, `🛸 ${player.name}가 우주정거장에 도착! 다음 턴 워프 이동이 예약됩니다.`, 'event');
      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, spaceTravelQueued: true } : p);
        return updateTotalAssets(next, cells);
      });
      setTimeout(() => endTurn(isDouble), 800);
      return;
    }

    // 3. Social Fund (사회복지기금)
    if (space.type === 'fund') {
      if (socialFund > 0) {
        soundManager.playCashGain();
        addLog(player.id, `🏦 사회복지기금 접수처에 도착! 누적된 ${socialFund}만 원 전액을 수령합니다!`, 'event');
        showFloatingEffect(player.id, socialFund, true);
        const reward = socialFund;
        setSocialFund(0);
        setPlayers(prev => {
          const next = prev.map(p => p.id === player.id ? { ...p, money: p.money + reward } : p);
          return updateTotalAssets(next, cells);
        });
      } else {
        addLog(player.id, `🏦 사회복지기금에 도착했습니다. 현재 누적액이 없습니다.`, 'event');
      }
      setTimeout(() => endTurn(isDouble), 800);
      return;
    }

    // 4. Tax (국세청)
    if (space.type === 'tax') {
      soundManager.playTollPenalty();
      const taxAmount = Math.max(10, Math.floor(player.money * 0.1));
      addLog(player.id, `💰 국세청 세무조사! 자산 비례 세금 ${taxAmount}만 원을 납부합니다.`, 'event');
      showFloatingEffect(player.id, taxAmount, false);
      setSocialFund(prev => prev + taxAmount);
      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, money: p.money - taxAmount } : p);
        checkGameOver(next);
        return updateTotalAssets(next, cells);
      });
      setTimeout(() => endTurn(isDouble), 800);
      return;
    }

    // 5. Golden Key (황금열쇠)
    if (space.type === 'golden_key') {
      soundManager.playGoldenKey();
      const keyCard = getRandomGoldenKey();
      setCurrentGoldenKey(keyCard);
      addLog(player.id, `🔑 황금열쇠 찬스 획득! [${keyCard.title}]`, 'golden_key');
      setActiveModal('golden_key');
      return;
    }

    // 6. City / Tourism Spots
    if (space.type === 'city') {
      const isUnowned = cellState.owner === null;
      const isMine = cellState.owner === player.id;
      const isOpponent = cellState.owner !== null && cellState.owner !== player.id;

      if (isUnowned || (isMine && !cellState.buildings.isLandmark)) {
        // Buy or Upgrade
        if (player.isAI) {
          const decision = decideAIBuilding(player, space, cellState, player.money);
          if (decision.totalCost > 0) {
            const simulatedBuildings = {
              hasVilla: cellState.buildings.hasVilla || decision.buyVilla,
              hasBuilding: cellState.buildings.hasBuilding || decision.buyBuilding,
              hasHotel: cellState.buildings.hasHotel || decision.buyHotel,
              isLandmark: cellState.buildings.isLandmark || decision.buyLandmark
            };
            confirmPurchase(simulatedBuildings, decision.totalCost, player);
          } else {
            addLog(player.id, `▶ ${player.name}가 ${space.name} 투자를 보류했습니다.`, 'buy');
            setTimeout(() => endTurn(isDouble), 600);
          }
        } else {
          setActiveModal('purchase');
        }
      } else if (isOpponent) {
        // Toll & Takeover
        const opponent = players.find(p => p.id === cellState.owner);
        if (!opponent) {
          setTimeout(() => endTurn(isDouble), 600);
          return;
        }

        setCurrentTollData({ space, owner: opponent, payer: player });

        if (player.isAI) {
          const toll = cellState.currentToll;
          const spaceVal = calculateSpaceValue(space, cellState.buildings);
          const takeoverCost = spaceVal * 2;
          const canTakeover = !cellState.buildings.isLandmark && decideAITakeover(player, space, takeoverCost);

          if (canTakeover && player.money >= (toll + takeoverCost)) {
            // AI Takeover!
            executeTakeover(space, opponent, player, toll, takeoverCost);
          } else {
            // Pay Toll
            executePayToll(space, opponent, player, toll);
          }
        } else {
          setActiveModal('toll');
        }
      } else {
        // Already fully upgraded Landmark
        addLog(player.id, `👑 ${player.name}의 랜드마크 [${space.name}]에 방문했습니다.`, 'event');
        setTimeout(() => endTurn(isDouble), 600);
      }
    } else {
      // Start tile
      setTimeout(() => endTurn(isDouble), 600);
    }
  };

  // Step-by-step Token Movement Animation Engine
  const moveTokenSteps = (player: Player, totalSteps: number) => {
    let currentStep = 0;
    let currPos = player.pos;

    const stepInterval = setInterval(() => {
      currentStep++;
      currPos = (currPos + 1) % 40;
      soundManager.playStepHop();

      // Check salary pass
      if (currPos === 0) {
        soundManager.playCashGain();
        showFloatingEffect(player.id, SALARY_AMOUNT, true);
        addLog(player.id, `🚀 출발점 통과! 월급 +${SALARY_AMOUNT}만 원 지급`, 'event');
        setPlayers(prev => {
          const next = prev.map(p => p.id === player.id ? { ...p, money: p.money + SALARY_AMOUNT } : p);
          return updateTotalAssets(next, cells);
        });
      }

      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, pos: currPos } : p);
        return next;
      });

      if (currentStep >= totalSteps) {
        clearInterval(stepInterval);
        setIsRolling(false);
        const finalSpace = BOARD_SPACES[currPos];
        handleSpaceAction(player, finalSpace);
      }
    }, 160);
  };

  // Roll Dice Trigger
  const handleRollDice = (d1: number, d2: number) => {
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || activePlayer.isBankrupt) return;

    setIsRolling(true);
    setLastDice([d1, d2]);

    const total = d1 + d2;
    const rolledDouble = d1 === d2;
    setIsDouble(rolledDouble);

    if (rolledDouble) {
      soundManager.playDoubleBonus();
      setDoubleCount(prev => prev + 1);
      addLog(activePlayer.id, `🎲 ${activePlayer.name} 주사위 [${d1} + ${d2} = ${total}] 더블 굴림!`, 'roll');
    } else {
      setDoubleCount(0);
      addLog(activePlayer.id, `🎲 ${activePlayer.name} 주사위 [${d1} + ${d2} = ${total}] 굴림`, 'roll');
    }

    // 3 doubles penalty check
    if (rolledDouble && doubleCount >= 2) {
      soundManager.playTollPenalty();
      addLog(activePlayer.id, `🚨 3회 연속 더블 발생! 무인도로 강제 이송됩니다.`, 'event');
      setPlayers(prev => {
        const next = prev.map(p => p.id === activePlayer.id ? { ...p, pos: 10, islandTurnsLeft: 3 } : p);
        return updateTotalAssets(next, cells);
      });
      setIsRolling(false);
      setTimeout(() => endTurn(false), 800);
      return;
    }

    // Space Travel immediate warp handling
    if (activePlayer.spaceTravelQueued) {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, spaceTravelQueued: false } : p));
      if (activePlayer.isAI) {
        const target = decideAISpaceTravelDestination(BOARD_SPACES, cells, activePlayer, players);
        warpToDestination(target);
      } else {
        setIsRolling(false);
        setActiveModal('space_travel');
        return;
      }
      return;
    }

    // Uninhabited Island check
    if (activePlayer.islandTurnsLeft > 0) {
      if (rolledDouble) {
        soundManager.playCashGain();
        addLog(activePlayer.id, `🎉 더블 성공! 무인도에서 극적으로 탈출합니다!`, 'event');
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, islandTurnsLeft: 0 } : p));
        moveTokenSteps(activePlayer, total);
      } else {
        soundManager.playTollPenalty();
        addLog(activePlayer.id, `🏝️ 탈출 실패 (남은 턴: ${activePlayer.islandTurnsLeft - 1})`, 'event');
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, islandTurnsLeft: p.islandTurnsLeft - 1 } : p));
        setIsRolling(false);
        setTimeout(() => endTurn(false), 800);
      }
      return;
    }

    moveTokenSteps(activePlayer, total);
  };

  // Warp directly to destination (Space travel)
  const warpToDestination = (destPos: number) => {
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer) return;

    soundManager.playGoldenKey();
    addLog(activePlayer.id, `🛸 우주여행 워프 가동! [${BOARD_SPACES[destPos].name}]으로 순간이동!`, 'event');
    
    setPlayers(prev => {
      const next = prev.map(p => p.id === activePlayer.id ? { ...p, pos: destPos } : p);
      return updateTotalAssets(next, cells);
    });

    setActiveModal(null);
    setTimeout(() => {
      handleSpaceAction(activePlayer, BOARD_SPACES[destPos]);
    }, 500);
  };

  // Confirm Real Estate Purchase & Construction
  const confirmPurchase = (
    buildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean },
    cost: number,
    playerOverride?: Player
  ) => {
    const player = playerOverride || players[activePlayerIndex];
    const space = BOARD_SPACES[player.pos];

    soundManager.playBuildingBuild(buildings.isLandmark);
    showFloatingEffect(player.id, cost, false);

    const calculatedToll = calculateToll(space, buildings);

    setCells(prev => ({
      ...prev,
      [space.id]: {
        owner: player.id,
        buildings,
        currentToll: calculatedToll
      }
    }));

    setPlayers(prev => {
      const next = prev.map(p => p.id === player.id ? { ...p, money: p.money - cost } : p);
      const updated = updateTotalAssets(next, {
        ...cells,
        [space.id]: { owner: player.id, buildings, currentToll: calculatedToll }
      });
      return updated;
    });

    addLog(
      player.id,
      `🏙️ ${player.name}가 [${space.name}]에 투자 완료! (비용: ${cost}만, 통행료: ${calculatedToll}만)${buildings.isLandmark ? ' 👑 랜드마크 달성!' : ''}`,
      buildings.isLandmark ? 'upgrade' : 'buy'
    );

    setActiveModal(null);
    setTimeout(() => endTurn(isDouble), 600);
  };

  // Execute Toll Payment
  const executePayToll = (space: SpaceData, owner: Player, payer: Player, toll: number) => {
    soundManager.playTollPenalty();
    showFloatingEffect(payer.id, toll, false);
    showFloatingEffect(owner.id, toll, true);

    addLog(payer.id, `💸 ${payer.name}가 ${owner.name}의 [${space.name}] 통행료 ${toll}만 원 지불`, 'toll');

    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === payer.id) return { ...p, money: p.money - toll };
        if (p.id === owner.id) return { ...p, money: p.money + toll };
        return p;
      });
      checkGameOver(next);
      return updateTotalAssets(next, cells);
    });

    setActiveModal(null);
    setTimeout(() => endTurn(isDouble), 600);
  };

  // Execute Takeover (도시 인수)
  const executeTakeover = (space: SpaceData, owner: Player, buyer: Player, toll: number, takeoverCost: number) => {
    soundManager.playBuildingBuild(true);
    const totalCost = toll + takeoverCost;

    showFloatingEffect(buyer.id, totalCost, false);
    showFloatingEffect(owner.id, totalCost, true);

    const prevCell = cells[space.id];
    setCells(prev => ({
      ...prev,
      [space.id]: {
        ...prevCell,
        owner: buyer.id
      }
    }));

    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === buyer.id) return { ...p, money: p.money - totalCost };
        if (p.id === owner.id) return { ...p, money: p.money + totalCost };
        return p;
      });
      return updateTotalAssets(next, {
        ...cells,
        [space.id]: { ...prevCell, owner: buyer.id }
      });
    });

    addLog(
      buyer.id,
      `💥 ${buyer.name}가 ${owner.name}의 [${space.name}]을(를) ${takeoverCost}만 원에 전격 인수(Takeover)했습니다!`,
      'takeover'
    );

    setActiveModal(null);
    setTimeout(() => endTurn(isDouble), 600);
  };

  // Apply Golden Key Effect
  const applyGoldenKey = () => {
    if (!currentGoldenKey) return;
    const activePlayer = players[activePlayerIndex];
    const card = currentGoldenKey;

    switch (card.type) {
      case 'money_gain': {
        const gain = card.amount || 20;
        soundManager.playCashGain();
        showFloatingEffect(activePlayer.id, gain, true);
        setPlayers(prev => {
          const next = prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money + gain } : p);
          return updateTotalAssets(next, cells);
        });
        addLog(activePlayer.id, `💰 ${card.title}로 +${gain}만 원 획득!`, 'golden_key');
        break;
      }
      case 'money_loss': {
        const loss = card.amount || 20;
        soundManager.playTollPenalty();
        showFloatingEffect(activePlayer.id, loss, false);
        setPlayers(prev => {
          const next = prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money - loss } : p);
          checkGameOver(next);
          return updateTotalAssets(next, cells);
        });
        addLog(activePlayer.id, `💸 ${card.title}로 -${loss}만 원 차감`, 'golden_key');
        break;
      }
      case 'donation': {
        const donation = card.amount || 15;
        soundManager.playTollPenalty();
        showFloatingEffect(activePlayer.id, donation, false);
        setSocialFund(prev => prev + donation);
        setPlayers(prev => {
          const next = prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money - donation } : p);
          checkGameOver(next);
          return updateTotalAssets(next, cells);
        });
        addLog(activePlayer.id, `💖 사회복지기금에 ${donation}만 원 후원 완료`, 'golden_key');
        break;
      }
      case 'jackpot': {
        if (socialFund > 0) {
          soundManager.playCashGain();
          const pot = socialFund;
          setSocialFund(0);
          showFloatingEffect(activePlayer.id, pot, true);
          setPlayers(prev => {
            const next = prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money + pot } : p);
            return updateTotalAssets(next, cells);
          });
          addLog(activePlayer.id, `🏦 사회복지기금 대박 수령! (+${pot}만 원)`, 'golden_key');
        }
        break;
      }
      case 'escape_card': {
        soundManager.playCashGain();
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, hasIslandEscapeCard: p.hasIslandEscapeCard + 1 } : p));
        addLog(activePlayer.id, `🛶 무인도 탈출권 1장 획득 및 보관`, 'golden_key');
        break;
      }
      case 'move_space': {
        setActiveModal(null);
        warpToDestination(20);
        return;
      }
      case 'move_start': {
        setActiveModal(null);
        warpToDestination(0);
        return;
      }
      case 'move_island': {
        setActiveModal(null);
        soundManager.playTollPenalty();
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, pos: 10, islandTurnsLeft: 3 } : p));
        addLog(activePlayer.id, `🏝️ 폭풍우로 무인도로 강제 이송되었습니다!`, 'golden_key');
        setTimeout(() => endTurn(isDouble), 600);
        return;
      }
    }

    setActiveModal(null);
    setTimeout(() => endTurn(isDouble), 600);
  };

  // AI Turn Automation Trigger
  useEffect(() => {
    const activePlayer = players[activePlayerIndex];
    if (activePlayer && activePlayer.isAI && !activePlayer.isBankrupt && !isRolling && activeModal === null && !gameOverData) {
      const aiTimer = setTimeout(() => {
        // If in island, decide whether to pay fee or try double
        if (activePlayer.islandTurnsLeft > 0) {
          if (activePlayer.hasIslandEscapeCard > 0) {
            setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, hasIslandEscapeCard: p.hasIslandEscapeCard - 1, islandTurnsLeft: 0 } : p));
            addLog(activePlayer.id, `🛶 AI가 무인도 탈출권을 사용하여 즉시 탈출했습니다!`, 'event');
          } else if (activePlayer.money >= 100) {
            setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money - 20, islandTurnsLeft: 0 } : p));
            addLog(activePlayer.id, `💰 AI가 보석금 20만 원을 내고 무인도를 탈출했습니다.`, 'event');
          }
        }

        // Roll
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        handleRollDice(d1, d2);
      }, 1200);

      return () => clearTimeout(aiTimer);
    }
  }, [activePlayerIndex, isRolling, activeModal, gameOverData, players]);

  // Apply new game mode config and reset
  const handleApplyConfig = (newConfig: GameModeConfig) => {
    setGameConfig(newConfig);
    const newPlayers = createPlayersForMode(newConfig.humanCount, newConfig.aiCount, INITIAL_MONEY);
    setPlayers(newPlayers);

    const initCells: Record<number, CellState> = {};
    BOARD_SPACES.forEach((s) => {
      initCells[s.id] = {
        owner: null,
        buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
        currentToll: 0
      };
    });
    setCells(initCells);
    setActivePlayerIndex(0);
    setTurnCount(1);
    setSocialFund(50);
    setGameOverData(null);
    setActiveModal(null);
    setLastDice(null);
    setIsDouble(false);
    setDoubleCount(0);
    setGameLogs([]);
    const totalCount = newConfig.humanCount + newConfig.aiCount;
    addLog(0, `🎮 [인간 ${newConfig.humanCount}명${newConfig.aiCount > 0 ? ` + AI ${newConfig.aiCount}명` : ''} (총 ${totalCount}인)] 모드가 적용되었습니다.`, 'event');
  };

  // Start Game from setup screen
  const handleStartGameFromSetup = (config: GameModeConfig, names: string[]) => {
    setGameConfig(config);
    setCustomNames(names);

    const newPlayers = createPlayersForMode(config.humanCount, config.aiCount, INITIAL_MONEY, names);
    setPlayers(newPlayers);

    const initCells: Record<number, CellState> = {};
    BOARD_SPACES.forEach((s) => {
      initCells[s.id] = {
        owner: null,
        buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
        currentToll: 0
      };
    });
    setCells(initCells);
    setActivePlayerIndex(0);
    setTurnCount(1);
    setSocialFund(50);
    setGameOverData(null);
    setActiveModal(null);
    setLastDice(null);
    setIsDouble(false);
    setDoubleCount(0);
    setGameLogs([]);

    const totalCount = config.humanCount + config.aiCount;
    const humanNamesStr = names.join(', ');
    addLog(0, `🎲 [${humanNamesStr}] 님이 참여하는 부루마블 게임이 시작되었습니다! (총 ${totalCount}인)`, 'event');

    setGameState('playing');
    setTurnBannerVisible(true);
    setTimeout(() => setTurnBannerVisible(false), 2000);
  };

  // Reset Game with current config and names
  const resetGame = () => {
    const newPlayers = createPlayersForMode(gameConfig.humanCount, gameConfig.aiCount, INITIAL_MONEY, customNames);
    setPlayers(newPlayers);

    const initCells: Record<number, CellState> = {};
    BOARD_SPACES.forEach((s) => {
      initCells[s.id] = {
        owner: null,
        buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
        currentToll: 0
      };
    });
    setCells(initCells);
    setActivePlayerIndex(0);
    setTurnCount(1);
    setSocialFund(50);
    setGameOverData(null);
    setActiveModal(null);
    setLastDice(null);
    setIsDouble(false);
    setDoubleCount(0);
    setGameLogs([]);
    addLog(0, "✨ 새 게임이 시작되었습니다! 행운을 빕니다.", "event");
    setTurnBannerVisible(true);
    setTimeout(() => setTurnBannerVisible(false), 2000);
  };

  const handleExitToLobby = () => {
    setGameState('setup');
    setActiveModal(null);
    setGameOverData(null);
  };

  const activePlayer = players[activePlayerIndex] || players[0];
  const activeSpace = BOARD_SPACES[activePlayer.pos];
  const activeCellState = cells[activePlayer.pos] || {
    owner: null,
    buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
    currentToll: 0
  };

  if (gameState === 'setup') {
    return <GameSetupScreen onStartGame={handleStartGameFromSetup} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#08120a] text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 lg:p-6 overflow-x-hidden relative">
      {/* Background Warm Tabletop Lighting & Board Felt Ambient Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_35%,rgba(74,222,128,0.12),rgba(0,0,0,0.85))] pointer-events-none" />
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Cash Gain / Loss Particles */}
      <FloatingCashEffect effects={floatingEffects} />

      {/* Smooth Turn Transition Banner */}
      <TurnTransitionBanner
        player={activePlayer}
        turnCount={turnCount}
        visible={turnBannerVisible}
      />

      {/* Main Responsive Grid Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6 z-10">
        {/* Left / Center Area: Board */}
        <main className="w-full flex-1 flex flex-col items-center justify-center">
          <Board
            spaces={BOARD_SPACES}
            cells={cells}
            players={players}
            activePlayerIndex={activePlayerIndex}
            onRollDice={handleRollDice}
            isRolling={isRolling}
            isDiceDisabled={isRolling || activePlayer.isAI || activeModal !== null}
            lastDice={lastDice}
            isDouble={isDouble}
            highlightedCellId={activePlayer.pos}
            isDestinationSelectionActive={activeModal === 'space_travel'}
            onCellClick={(id) => {
              if (activeModal === 'space_travel') {
                warpToDestination(id);
              }
            }}
          />
        </main>

        {/* Right Area: Status Sidebar & Controls */}
        <Sidebar
          players={players}
          activePlayerIndex={activePlayerIndex}
          gameLogs={gameLogs}
          gameConfig={gameConfig}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onExitToLobby={handleExitToLobby}
          socialFund={socialFund}
          currentTurnCount={turnCount}
        />
      </div>

      {/* MODALS */}
      {/* 0. Mode & Player Count Select Modal (if triggered) */}
      {isModeModalOpen && (
        <ModeSelectModal
          currentConfig={gameConfig}
          onApplyConfig={handleApplyConfig}
          onClose={() => setIsModeModalOpen(false)}
        />
      )}

      {/* 1. Real Estate Purchase & Construction Modal */}
      {activeModal === 'purchase' && !activePlayer.isAI && (
        <PurchaseModal
          space={activeSpace}
          cellState={activeCellState}
          player={activePlayer}
          onConfirmPurchase={(buildings, cost) => confirmPurchase(buildings, cost)}
          onSkip={() => {
            addLog(activePlayer.id, `▶ ${activePlayer.name}가 투자를 보류했습니다.`, 'buy');
            setActiveModal(null);
            setTimeout(() => endTurn(isDouble), 600);
          }}
        />
      )}

      {/* 2. Toll Payment & Takeover Modal */}
      {activeModal === 'toll' && currentTollData && !activePlayer.isAI && (
        <TollModal
          space={currentTollData.space}
          cellState={cells[currentTollData.space.id]}
          payer={currentTollData.payer}
          owner={currentTollData.owner}
          onPayToll={() => executePayToll(currentTollData.space, currentTollData.owner, currentTollData.payer, cells[currentTollData.space.id].currentToll)}
          onTakeover={(takeoverCost) => executeTakeover(currentTollData.space, currentTollData.owner, currentTollData.payer, cells[currentTollData.space.id].currentToll, takeoverCost)}
        />
      )}

      {/* 3. Golden Key Modal */}
      {activeModal === 'golden_key' && currentGoldenKey && (
        <GoldenKeyModal
          card={currentGoldenKey}
          onConfirm={applyGoldenKey}
        />
      )}

      {/* 4. Space Travel Modal */}
      {activeModal === 'space_travel' && (
        <SpaceTravelModal
          spaces={BOARD_SPACES}
          cells={cells}
          player={activePlayer}
          onSelectDestination={(destPos) => warpToDestination(destPos)}
        />
      )}

      {/* 5. Game Over / Victory Modal */}
      {activeModal === 'game_over' && gameOverData && (
        <GameOverModal
          winner={gameOverData.winner}
          rankings={gameOverData.rankings}
          reason={gameOverData.reason}
          onRestart={resetGame}
          onExitToLobby={handleExitToLobby}
        />
      )}
    </div>
  );
}
