import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, 
  CellState, 
  GameLogEntry, 
  GameModeConfig,
  GameOverResult,
  GoldenKeyCard, 
  FloatingEffect,
  SpaceData,
  GameSpeed,
  SPEED_CONFIGS,
  BoardBroadcastMessage
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
    aiCount: 0,
    speed: 'normal'
  });
  const [customNames, setCustomNames] = useState<string[]>(['플레이어 1', '플레이어 2']);
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const currentSpeed: GameSpeed = gameConfig.speed || 'normal';
  const speedConfig = SPEED_CONFIGS[currentSpeed];

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
  const [isTumbling, setIsTumbling] = useState<boolean>(false);
  const [isTurnBusy, setIsTurnBusy] = useState<boolean>(false); // Strict lock for entire turn cycle
  const [currentDice, setCurrentDice] = useState<[number, number]>([3, 4]);
  const [lastDice, setLastDice] = useState<[number, number] | null>(null);
  const [isDouble, setIsDouble] = useState<boolean>(false);
  const [doubleCount, setDoubleCount] = useState<number>(0);

  const [gameLogs, setGameLogs] = useState<GameLogEntry[]>([]);
  const [floatingEffects, setFloatingEffects] = useState<FloatingEffect[]>([]);
  const [turnBannerVisible, setTurnBannerVisible] = useState<boolean>(true);
  const [boardBroadcast, setBoardBroadcast] = useState<BoardBroadcastMessage | null>(null);

  // Active modal controls
  const [activeModal, setActiveModal] = useState<null | 'purchase' | 'toll' | 'golden_key' | 'space_travel' | 'game_over'>(null);
  const [currentGoldenKey, setCurrentGoldenKey] = useState<GoldenKeyCard | null>(null);
  const [currentTollData, setCurrentTollData] = useState<{ space: SpaceData; owner: Player; payer: Player } | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverResult | null>(null);

  // Reference trackers for rock-solid concurrency and race condition prevention
  const turnSeqRef = useRef<number>(1);
  const timersRef = useRef<number[]>([]);
  const playersRef = useRef<Player[]>(players);
  const cellsRef = useRef<Record<number, CellState>>(cells);
  const activePlayerIndexRef = useRef<number>(activePlayerIndex);
  const isTurnBusyRef = useRef<boolean>(false);

  // Synchronize refs
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  useEffect(() => {
    activePlayerIndexRef.current = activePlayerIndex;
  }, [activePlayerIndex]);

  useEffect(() => {
    isTurnBusyRef.current = isTurnBusy;
  }, [isTurnBusy]);

  // Unified timer registration with turn sequence safety validation
  const registerTimer = (fn: () => void, delayMs: number, expectedTurnSeq?: number) => {
    const timerId = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== timerId);
      if (expectedTurnSeq !== undefined && expectedTurnSeq !== turnSeqRef.current) {
        return; // Turn expired, cancel obsolete action safely
      }
      fn();
    }, delayMs);
    timersRef.current.push(timerId);
    return timerId;
  };

  const registerInterval = (fn: () => void, intervalMs: number) => {
    const intervalId = window.setInterval(fn, intervalMs);
    timersRef.current.push(intervalId);
    return intervalId;
  };

  // Immediate full-stop cleanup of all game timers, intervals, and audio
  const clearAllGameTimers = () => {
    timersRef.current.forEach(t => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    timersRef.current = [];
    soundManager.stopAll();
  };

  // Trigger Board Broadcast Notification
  const triggerBroadcast = (msg: Omit<BoardBroadcastMessage, 'id' | 'timestamp'>) => {
    setBoardBroadcast({
      ...msg,
      id: Math.random().toString(),
      timestamp: Date.now()
    });
  };

  // Update sound manager toggle
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial welcome log & board broadcast
  useEffect(() => {
    addLog(0, "🎲 모두의 부루마블 게임이 시작되었습니다! 주사위를 굴려 부를 축적하세요.", "event");
    triggerBroadcast({
      category: 'turn',
      playerId: 0,
      playerName: players[0]?.name || '플레이어 1',
      playerColor: players[0]?.color || '#ef4444',
      isAI: players[0]?.isAI || false,
      title: '🎮 게임 시작! 주사위를 굴려주세요',
      detail: '주사위를 굴려 도시를 매입하고 랜드마크를 건설하세요!',
      badge: '1라운드 시작',
      badgeColor: 'emerald'
    });
    setTurnBannerVisible(true);
    const timer = setTimeout(() => setTurnBannerVisible(false), speedConfig.bannerDurationMs);
    return () => clearTimeout(timer);
  }, [speedConfig.bannerDurationMs]);

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
  const endTurn = (rolledDouble: boolean = false, fromTurnSeq?: number) => {
    if (fromTurnSeq !== undefined && fromTurnSeq !== turnSeqRef.current) {
      return; // Obsolete callback from a past turn sequence
    }

    if (rolledDouble) {
      const currentSeq = ++turnSeqRef.current;
      soundManager.playTurnSwitch();
      setTurnBannerVisible(true);
      registerTimer(() => setTurnBannerVisible(false), speedConfig.bannerDurationMs, currentSeq);

      setIsTurnBusy(false);
      setIsRolling(false);
      setIsTumbling(false);
      setActiveModal(null);

      const activePlayer = playersRef.current[activePlayerIndexRef.current];
      if (activePlayer) {
        triggerBroadcast({
          category: 'turn',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `🎯 [${activePlayer.name}] 더블 찬스 추가 턴!`,
          detail: activePlayer.isAI ? '컴퓨터 AI가 추가 턴 주사위를 굴립니다...' : '🎲 한 번 더 주사위를 굴려 이동하세요!',
          badge: '더블 추가턴',
          badgeColor: 'amber'
        });
      }
      return;
    }

    setDoubleCount(0);
    setIsDouble(false);
    setActiveModal(null);
    setIsRolling(false);
    setIsTumbling(false);

    const currentSeq = ++turnSeqRef.current;

    // Authoritative non-bankrupt next player sequence
    const total = playersRef.current.length;
    let nextIdx = activePlayerIndexRef.current;
    for (let i = 1; i <= total; i++) {
      const candidate = (activePlayerIndexRef.current + i) % total;
      if (!playersRef.current[candidate].isBankrupt) {
        nextIdx = candidate;
        break;
      }
    }

    activePlayerIndexRef.current = nextIdx;
    setActivePlayerIndex(nextIdx);
    setTurnCount(prev => prev + 1);

    const nextPlayer = playersRef.current[nextIdx];
    if (nextPlayer) {
      triggerBroadcast({
        category: 'turn',
        playerId: nextPlayer.id,
        playerName: nextPlayer.name,
        playerColor: nextPlayer.color,
        isAI: nextPlayer.isAI,
        title: `🏁 [${nextPlayer.name}] 님의 차례입니다`,
        detail: nextPlayer.isAI ? '컴퓨터 AI가 주사위 굴림 및 부동산 전략을 연산 중입니다...' : '🎲 주사위 굴리기 버튼을 눌러 이동하세요!',
        badge: nextPlayer.isAI ? 'AI 턴' : '플레이어 턴',
        badgeColor: nextPlayer.isAI ? 'purple' : 'emerald'
      });
    }

    // Play turn switch sound & show banner
    soundManager.playTurnSwitch();
    setTurnBannerVisible(true);
    registerTimer(() => setTurnBannerVisible(false), speedConfig.bannerDurationMs, currentSeq);

    setIsTurnBusy(false);
  };

  // Check Game Over & Bankruptcy
  const checkGameOver = (playerList: Player[]) => {
    const updated = playerList.map(p => {
      if (p.money < 0 && !p.isBankrupt) {
        addLog(p.id, `🚨 ${p.name} 보유 자금 고갈로 파산 탈락했습니다!`, 'bankrupt');
        triggerBroadcast({
          category: 'bankrupt',
          playerId: p.id,
          playerName: p.name,
          playerColor: p.color,
          isAI: p.isAI,
          title: `💥 [${p.name}] 파산 탈락!`,
          detail: '자금 부족으로 모든 자산이 매각되고 게임에서 탈락했습니다.',
          badge: '파산 탈락',
          badgeColor: 'rose'
        });
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
  const handleSpaceAction = (player: Player, space: SpaceData, currentTurnSeq: number) => {
    if (currentTurnSeq !== turnSeqRef.current) return;
    const cellState = cellsRef.current[space.id] || {
      owner: null,
      buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
      currentToll: 0
    };

    // 1. Uninhabited Island
    if (space.type === 'island') {
      soundManager.playTollPenalty();
      addLog(player.id, `🏝️ ${player.name}가 무인도에 조난되었습니다! (3턴 격리)`, 'event');
      triggerBroadcast({
        category: 'island',
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        isAI: player.isAI,
        title: `🏝️ [무인도] 조난 도착!`,
        detail: `${player.name}님이 무인도에 갇혔습니다. 3턴 동안 탈출을 시도해야 합니다.`,
        badge: '무인도 3턴',
        badgeColor: 'indigo'
      });
      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, islandTurnsLeft: 3 } : p);
        return updateTotalAssets(next, cellsRef.current);
      });
      registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
      return;
    }

    // 2. Space Travel
    if (space.type === 'space') {
      soundManager.playGoldenKey();
      addLog(player.id, `🛸 ${player.name}가 우주정거장에 도착! 다음 턴 워프 이동이 예약됩니다.`, 'event');
      triggerBroadcast({
        category: 'space_travel',
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        isAI: player.isAI,
        title: `🛸 [우주정거장 콜롬비아] 도착!`,
        detail: '우주선 탑승 완료! 다음 턴 원하는 도시로 즉시 순간이동할 수 있습니다.',
        badge: '워프 예약',
        badgeColor: 'purple'
      });
      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, spaceTravelQueued: true } : p);
        return updateTotalAssets(next, cellsRef.current);
      });
      registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
      return;
    }

    // 3. Social Fund (사회복지기금)
    if (space.type === 'fund') {
      if (socialFund > 0) {
        soundManager.playCashGain();
        addLog(player.id, `🏦 사회복지기금 접수처에 도착! 누적된 ${socialFund}만 원 전액을 수령합니다!`, 'event');
        triggerBroadcast({
          category: 'fund',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          isAI: player.isAI,
          title: `🏦 [사회복지기금 접수처] 잭팟 수령! (+${socialFund}만 원)`,
          detail: `누적된 사회복지기금 ${socialFund}만 원 전액을 ${player.name}님이 수령했습니다!`,
          badge: `잭팟 +${socialFund}만`,
          badgeColor: 'emerald'
        });
        showFloatingEffect(player.id, socialFund, true);
        const reward = socialFund;
        setSocialFund(0);
        setPlayers(prev => {
          const next = prev.map(p => p.id === player.id ? { ...p, money: p.money + reward } : p);
          return updateTotalAssets(next, cellsRef.current);
        });
      } else {
        addLog(player.id, `🏦 사회복지기금에 도착했습니다. 현재 누적액이 없습니다.`, 'event');
        triggerBroadcast({
          category: 'fund',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          isAI: player.isAI,
          title: `🏦 [사회복지기금 접수처] 도착`,
          detail: '현재 누적된 모금액이 없어 수령할 금액이 0원입니다.',
          badge: '기금 0원',
          badgeColor: 'slate'
        });
      }
      registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
      return;
    }

    // 4. Tax (국세청)
    if (space.type === 'tax') {
      soundManager.playTollPenalty();
      const taxAmount = Math.max(10, Math.floor(player.money * 0.1));
      addLog(player.id, `💰 국세청 세무조사! 자산 비례 세금 ${taxAmount}만 원을 납부합니다.`, 'event');
      triggerBroadcast({
        category: 'tax',
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        isAI: player.isAI,
        title: `💸 [국세청 세무조사] 세금 납부 (-${taxAmount}만 원)`,
        detail: `${player.name}님이 자산 비례 세금 ${taxAmount}만 원을 납부했습니다.`,
        badge: `세금 -${taxAmount}만`,
        badgeColor: 'rose'
      });
      showFloatingEffect(player.id, taxAmount, false);
      setSocialFund(prev => prev + taxAmount);
      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, money: p.money - taxAmount } : p);
        checkGameOver(next);
        return updateTotalAssets(next, cellsRef.current);
      });
      registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
      return;
    }

    // 5. Golden Key (황금열쇠)
    if (space.type === 'golden_key') {
      soundManager.playGoldenKey();
      const keyCard = getRandomGoldenKey();
      setCurrentGoldenKey(keyCard);
      addLog(player.id, `🔑 황금열쇠 찬스 획득! [${keyCard.title}]`, 'golden_key');
      triggerBroadcast({
        category: 'golden_key',
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        isAI: player.isAI,
        title: `🔑 [황금열쇠 찬스] [${keyCard.title}] 카드 뽑기!`,
        detail: keyCard.description,
        badge: '황금열쇠 찬스',
        badgeColor: 'amber'
      });
      setActiveModal('golden_key');
      if (player.isAI) {
        registerTimer(() => {
          applyGoldenKey(currentTurnSeq);
        }, speedConfig.aiActionDelayMs + 800, currentTurnSeq);
      }
      return;
    }

    // 6. City / Tourism Spots
    if (space.type === 'city') {
      const isUnowned = cellState.owner === null;
      const isMine = cellState.owner === player.id;
      const isOpponent = cellState.owner !== null && cellState.owner !== player.id;

      if (isUnowned || (isMine && !cellState.buildings.isLandmark)) {
        // Buy or Upgrade
        if (isUnowned) {
          triggerBroadcast({
            category: 'arrive',
            playerId: player.id,
            playerName: player.name,
            playerColor: player.color,
            isAI: player.isAI,
            title: `📍 [${space.name}] 도착! (미보유지)`,
            detail: `매입가: ${space.price || 10}만 원 | 건물 건설 및 투자 가능`,
            badge: `매입가 ${space.price || 10}만`,
            badgeColor: 'emerald'
          });
        } else {
          triggerBroadcast({
            category: 'arrive',
            playerId: player.id,
            playerName: player.name,
            playerColor: player.color,
            isAI: player.isAI,
            title: `🏠 내 소유지 [${space.name}] 도착!`,
            detail: `현재 통행료: ${cellState.currentToll}만 원 | 추가 건물 및 랜드마크 증축 가능`,
            badge: '보유 도시',
            badgeColor: 'sky'
          });
        }

        if (player.isAI) {
          registerTimer(() => {
            const decision = decideAIBuilding(player, space, cellState, player.money);
            if (decision.totalCost > 0) {
              const simulatedBuildings = {
                hasVilla: cellState.buildings.hasVilla || decision.buyVilla,
                hasBuilding: cellState.buildings.hasBuilding || decision.buyBuilding,
                hasHotel: cellState.buildings.hasHotel || decision.buyHotel,
                isLandmark: cellState.buildings.isLandmark || decision.buyLandmark
              };
              confirmPurchase(simulatedBuildings, decision.totalCost, player, currentTurnSeq);
            } else {
              addLog(player.id, `▶ ${player.name}가 ${space.name} 투자를 보류했습니다.`, 'buy');
              triggerBroadcast({
                category: 'pass',
                playerId: player.id,
                playerName: player.name,
                playerColor: player.color,
                isAI: player.isAI,
                title: `⏭️ [${space.name}] 투자 보류 (패스)`,
                detail: `${player.name}님이 자금 전략을 위해 매입을 건너뛰었습니다.`,
                badge: '투자 보류',
                badgeColor: 'slate'
              });
              registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
            }
          }, speedConfig.aiActionDelayMs, currentTurnSeq);
        } else {
          setActiveModal('purchase');
        }
      } else if (isOpponent) {
        // Toll & Takeover
        const opponent = playersRef.current.find(p => p.id === cellState.owner);
        if (!opponent) {
          registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
          return;
        }

        setCurrentTollData({ space, owner: opponent, payer: player });

        triggerBroadcast({
          category: 'toll_due',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          isAI: player.isAI,
          title: `⚠️ [${opponent.name}]의 [${space.name}] 도착! 통행료 발생!`,
          detail: `지불할 통행료: ${cellState.currentToll}만 원${cellState.buildings.isLandmark ? ' (랜드마크 방어/인수 불가)' : ' | 도시 인수(Takeover) 가능'}`,
          badge: `통행료 ${cellState.currentToll}만`,
          badgeColor: 'rose'
        });

        if (player.isAI) {
          registerTimer(() => {
            const toll = cellState.currentToll;
            const spaceVal = calculateSpaceValue(space, cellState.buildings);
            const takeoverCost = spaceVal * 2;
            const canTakeover = !cellState.buildings.isLandmark && decideAITakeover(player, space, takeoverCost);

            if (canTakeover && player.money >= (toll + takeoverCost)) {
              // AI Takeover!
              executeTakeover(space, opponent, player, toll, takeoverCost, currentTurnSeq);
            } else {
              // Pay Toll
              executePayToll(space, opponent, player, toll, currentTurnSeq);
            }
          }, speedConfig.aiActionDelayMs, currentTurnSeq);
        } else {
          setActiveModal('toll');
        }
      } else {
        // Already fully upgraded Landmark
        addLog(player.id, `👑 ${player.name}의 랜드마크 [${space.name}]에 방문했습니다.`, 'event');
        triggerBroadcast({
          category: 'arrive',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          isAI: player.isAI,
          title: `👑 내 최고 랜드마크 [${space.name}] 도착!`,
          detail: `통행료 ${cellState.currentToll}만 원으로 철벽 방어 중입니다.`,
          badge: '👑 랜드마크',
          badgeColor: 'amber'
        });
        registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
      }
    } else {
      // Start tile
      triggerBroadcast({
        category: 'salary',
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        isAI: player.isAI,
        title: `🏁 [출발점] 정착: 월급 +${SALARY_AMOUNT}만 원 수령!`,
        detail: `${player.name}님이 출발점에 안착하여 월급 ${SALARY_AMOUNT}만 원을 지급받았습니다.`,
        badge: `월급 +${SALARY_AMOUNT}만`,
        badgeColor: 'emerald'
      });
      registerTimer(() => endTurn(isDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
    }
  };

  // Step-by-step Token Movement Animation Engine
  const moveTokenSteps = (player: Player, totalSteps: number, currentTurnSeq: number) => {
    let currentStep = 0;
    let currPos = player.pos;

    const stepInterval = registerInterval(() => {
      if (currentTurnSeq !== turnSeqRef.current) {
        window.clearInterval(stepInterval);
        return;
      }

      currentStep++;
      currPos = (currPos + 1) % 40;
      soundManager.playStepHop();

      // Check salary pass
      if (currPos === 0) {
        soundManager.playCashGain();
        showFloatingEffect(player.id, SALARY_AMOUNT, true);
        addLog(player.id, `🚀 출발점 통과! 월급 +${SALARY_AMOUNT}만 원 지급`, 'event');
        triggerBroadcast({
          category: 'salary',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          isAI: player.isAI,
          title: `💰 [출발점 통과] 월급 +${SALARY_AMOUNT}만 원!`,
          detail: `${player.name}님이 출발점을 경유하여 월급 ${SALARY_AMOUNT}만 원을 지급받았습니다.`,
          badge: `월급 +${SALARY_AMOUNT}만`,
          badgeColor: 'emerald'
        });
        setPlayers(prev => {
          const next = prev.map(p => p.id === player.id ? { ...p, money: p.money + SALARY_AMOUNT } : p);
          return updateTotalAssets(next, cellsRef.current);
        });
      }

      setPlayers(prev => {
        const next = prev.map(p => p.id === player.id ? { ...p, pos: currPos } : p);
        return next;
      });

      if (currentStep >= totalSteps) {
        window.clearInterval(stepInterval);
        setIsRolling(false);
        const finalSpace = BOARD_SPACES[currPos];
        
        // Immediate Arrival Notification (Issue 6 UX Improvement)
        triggerBroadcast({
          category: 'arrive',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          isAI: player.isAI,
          title: `📍 [${finalSpace.name}] 땅에 도착했습니다!`,
          detail: `${player.name}님이 [${finalSpace.name}]에 안착했습니다.`,
          badge: '도착',
          badgeColor: 'sky'
        });

        // Arrival pause to view board position before popping up modal/actions
        registerTimer(() => {
          handleSpaceAction(player, finalSpace, currentTurnSeq);
        }, speedConfig.arrivalPauseMs, currentTurnSeq);
      }
    }, speedConfig.stepIntervalMs);
  };

  // Synchronized Dice Roll Trigger (Visual Tumbling + Audio + Settle + Token Movement)
  const triggerDiceRoll = () => {
    const activePlayer = playersRef.current[activePlayerIndexRef.current];
    if (!activePlayer || activePlayer.isBankrupt || isTurnBusy || isRolling || isTumbling) return;

    setIsTurnBusy(true);
    setIsRolling(true);
    setIsTumbling(true);

    const currentTurnSeq = turnSeqRef.current;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const rolledDouble = d1 === d2;

    const totalTicks = speedConfig.diceRollTicks;
    const tickInterval = speedConfig.diceRollIntervalMs;

    // Start rolling sound immediately in exact sync with animation
    soundManager.playDiceRoll(totalTicks * tickInterval);

    let count = 0;
    const interval = registerInterval(() => {
      if (currentTurnSeq !== turnSeqRef.current) {
        window.clearInterval(interval);
        return;
      }

      setCurrentDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      count++;

      if (count >= totalTicks) {
        window.clearInterval(interval);
        setCurrentDice([d1, d2]);
        setLastDice([d1, d2]);
        setIsTumbling(false);
        soundManager.playDiceLand();

        const total = d1 + d2;
        setIsDouble(rolledDouble);

        if (rolledDouble) {
          soundManager.playDoubleBonus();
          setDoubleCount(prev => prev + 1);
          addLog(activePlayer.id, `🎲 ${activePlayer.name} 주사위 [${d1} + ${d2} = ${total}] 더블 굴림!`, 'roll');
          triggerBroadcast({
            category: 'roll',
            playerId: activePlayer.id,
            playerName: activePlayer.name,
            playerColor: activePlayer.color,
            isAI: activePlayer.isAI,
            title: `🎲 주사위 [${d1} + ${d2} = ${total}] 더블! 🎯`,
            detail: `${activePlayer.name}님이 ${total}칸 전진합니다. (더블 찬스로 한 번 더 굴림!)`,
            badge: '더블 찬스 🎯',
            badgeColor: 'amber'
          });
        } else {
          setDoubleCount(0);
          addLog(activePlayer.id, `🎲 ${activePlayer.name} 주사위 [${d1} + ${d2} = ${total}] 굴림`, 'roll');
          triggerBroadcast({
            category: 'roll',
            playerId: activePlayer.id,
            playerName: activePlayer.name,
            playerColor: activePlayer.color,
            isAI: activePlayer.isAI,
            title: `🎲 주사위 [${d1} + ${d2} = ${total}] 굴림!`,
            detail: `${activePlayer.name}님이 ${total}칸 이동합니다.`,
            badge: `${total}칸 이동`,
            badgeColor: 'sky'
          });
        }

        // Settling delay: let player see the rolled dice result clearly before moving token
        registerTimer(() => {
          // 3 doubles penalty check
          if (rolledDouble && doubleCount >= 2) {
            soundManager.playTollPenalty();
            addLog(activePlayer.id, `🚨 3회 연속 더블 발생! 무인도로 강제 이송됩니다.`, 'event');
            triggerBroadcast({
              category: 'island',
              playerId: activePlayer.id,
              playerName: activePlayer.name,
              playerColor: activePlayer.color,
              isAI: activePlayer.isAI,
              title: `🚨 3회 연속 더블! 무인도 강제 이송!`,
              detail: '과도한 속도 위반으로 무인도에 3턴 동안 구금 조치됩니다.',
              badge: '무인도 수감',
              badgeColor: 'indigo'
            });
            setPlayers(prev => {
              const next = prev.map(p => p.id === activePlayer.id ? { ...p, pos: 10, islandTurnsLeft: 3 } : p);
              return updateTotalAssets(next, cellsRef.current);
            });
            setIsRolling(false);
            registerTimer(() => endTurn(false, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
            return;
          }

          // Space Travel immediate warp handling
          if (activePlayer.spaceTravelQueued) {
            setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, spaceTravelQueued: false } : p));
            if (activePlayer.isAI) {
              const target = decideAISpaceTravelDestination(BOARD_SPACES, cellsRef.current, activePlayer, playersRef.current);
              warpToDestination(target, currentTurnSeq);
            } else {
              setIsRolling(false);
              setActiveModal('space_travel');
            }
            return;
          }

          // Uninhabited Island check
          if (activePlayer.islandTurnsLeft > 0) {
            if (rolledDouble) {
              soundManager.playCashGain();
              addLog(activePlayer.id, `🎉 더블 성공! 무인도에서 극적으로 탈출합니다!`, 'event');
              triggerBroadcast({
                category: 'roll',
                playerId: activePlayer.id,
                playerName: activePlayer.name,
                playerColor: activePlayer.color,
                isAI: activePlayer.isAI,
                title: `🎉 더블 탈출 성공!`,
                detail: `주사위 더블 [${d1}, ${d2}]이 나와 무인도를 탈출하여 ${total}칸 전진합니다!`,
                badge: '탈출 성공',
                badgeColor: 'emerald'
              });
              setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, islandTurnsLeft: 0 } : p));
              moveTokenSteps(activePlayer, total, currentTurnSeq);
            } else {
              soundManager.playTollPenalty();
              addLog(activePlayer.id, `🏝️ 탈출 실패 (남은 턴: ${activePlayer.islandTurnsLeft - 1})`, 'event');
              triggerBroadcast({
                category: 'island',
                playerId: activePlayer.id,
                playerName: activePlayer.name,
                playerColor: activePlayer.color,
                isAI: activePlayer.isAI,
                title: `🏝️ 무인도 탈출 실패 (남은 턴: ${activePlayer.islandTurnsLeft - 1})`,
                detail: '더블이 나오지 않아 이번 턴에는 이동할 수 없습니다.',
                badge: `남은 ${activePlayer.islandTurnsLeft - 1}턴`,
                badgeColor: 'indigo'
              });
              setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, islandTurnsLeft: p.islandTurnsLeft - 1 } : p));
              setIsRolling(false);
              registerTimer(() => endTurn(false, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
            }
            return;
          }

          moveTokenSteps(activePlayer, total, currentTurnSeq);
        }, 400, currentTurnSeq);
      }
    }, tickInterval);
  };

  // Warp directly to destination (Space travel)
  const warpToDestination = (destPos: number, currentTurnSeq?: number) => {
    const activePlayer = playersRef.current[activePlayerIndexRef.current];
    if (!activePlayer) return;

    const seq = currentTurnSeq || turnSeqRef.current;
    setIsTurnBusy(true);
    setIsRolling(false);
    setIsTumbling(false);
    setActiveModal(null);

    const destSpace = BOARD_SPACES[destPos];
    soundManager.playGoldenKey();
    addLog(activePlayer.id, `🛸 우주여행 워프 가동! [${destSpace.name}]으로 순간이동!`, 'event');
    triggerBroadcast({
      category: 'space_travel',
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerColor: activePlayer.color,
      isAI: activePlayer.isAI,
      title: `🛸 [${destSpace.name}]으로 우주 워프 순간이동!`,
      detail: `${activePlayer.name}님이 우주선을 타고 목적지로 즉시 워프 이동했습니다.`,
      badge: '워프 완료',
      badgeColor: 'purple'
    });
    
    setPlayers(prev => {
      const next = prev.map(p => p.id === activePlayer.id ? { ...p, pos: destPos } : p);
      return updateTotalAssets(next, cellsRef.current);
    });

    registerTimer(() => {
      handleSpaceAction(activePlayer, BOARD_SPACES[destPos], seq);
    }, speedConfig.arrivalPauseMs, seq);
  };

  // Confirm Real Estate Purchase & Construction
  const confirmPurchase = (
    buildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean },
    cost: number,
    playerOverride?: Player,
    currentTurnSeq?: number
  ) => {
    const seq = currentTurnSeq || turnSeqRef.current;
    const player = playerOverride || playersRef.current[activePlayerIndexRef.current];
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
        ...cellsRef.current,
        [space.id]: { owner: player.id, buildings, currentToll: calculatedToll }
      });
      return updated;
    });

    const bldNames: string[] = [];
    if (buildings.isLandmark) bldNames.push('👑 랜드마크');
    else {
      if (buildings.hasHotel) bldNames.push('호텔');
      if (buildings.hasBuilding) bldNames.push('빌딩');
      if (buildings.hasVilla) bldNames.push('빌라');
    }
    const bldDesc = bldNames.length > 0 ? bldNames.join(', ') : '토지 매입';

    triggerBroadcast({
      category: 'purchase',
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      isAI: player.isAI,
      title: `🏗️ [${space.name}] ${bldDesc} 완공! (-${cost}만 원)`,
      detail: `${player.name} 투자 완료 (새 통행료: ${calculatedToll}만 원, 잔여 자금: ${player.money - cost}만 원)`,
      badge: buildings.isLandmark ? '👑 랜드마크' : `투자 -${cost}만`,
      badgeColor: buildings.isLandmark ? 'amber' : 'emerald'
    });

    addLog(
      player.id,
      `🏙️ ${player.name}가 [${space.name}]에 투자 완료! (비용: ${cost}만, 통행료: ${calculatedToll}만)${buildings.isLandmark ? ' 👑 랜드마크 달성!' : ''}`,
      buildings.isLandmark ? 'upgrade' : 'buy'
    );

    setActiveModal(null);
    registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
  };

  // Execute Toll Payment
  const executePayToll = (space: SpaceData, owner: Player, payer: Player, toll: number, currentTurnSeq?: number) => {
    const seq = currentTurnSeq || turnSeqRef.current;
    soundManager.playTollPenalty();
    showFloatingEffect(payer.id, toll, false);
    showFloatingEffect(owner.id, toll, true);

    addLog(payer.id, `💸 ${payer.name}가 ${owner.name}의 [${space.name}] 통행료 ${toll}만 원 지불`, 'toll');

    triggerBroadcast({
      category: 'toll_paid',
      playerId: payer.id,
      playerName: payer.name,
      playerColor: playerColor(payer.id),
      isAI: payer.isAI,
      title: `💸 [${space.name}] 통행료 ${toll}만 원 지불 완료!`,
      detail: `${payer.name} → ${owner.name}님에게 통행료 ${toll}만 원 송금 (지불 후 잔액: ${payer.money - toll}만 원)`,
      badge: `통행료 -${toll}만`,
      badgeColor: 'rose'
    });

    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === payer.id) return { ...p, money: p.money - toll };
        if (p.id === owner.id) return { ...p, money: p.money + toll };
        return p;
      });
      checkGameOver(next);
      return updateTotalAssets(next, cellsRef.current);
    });

    setActiveModal(null);
    registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
  };

  function playerColor(id: number) {
    const p = playersRef.current.find(x => x.id === id);
    return p ? p.color : '#3b82f6';
  }

  // Execute Takeover (도시 인수)
  const executeTakeover = (space: SpaceData, owner: Player, buyer: Player, toll: number, takeoverCost: number, currentTurnSeq?: number) => {
    const seq = currentTurnSeq || turnSeqRef.current;
    soundManager.playBuildingBuild(true);
    const totalCost = toll + takeoverCost;

    showFloatingEffect(buyer.id, totalCost, false);
    showFloatingEffect(owner.id, totalCost, true);

    const prevCell = cellsRef.current[space.id] || {
      owner: null,
      buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
      currentToll: 0
    };

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
        ...cellsRef.current,
        [space.id]: { ...prevCell, owner: buyer.id }
      });
    });

    triggerBroadcast({
      category: 'takeover',
      playerId: buyer.id,
      playerName: buyer.name,
      playerColor: buyer.color,
      isAI: buyer.isAI,
      title: `💥 [${space.name}] 전격 인수(Takeover) 성공!`,
      detail: `${buyer.name}님이 ${owner.name}님의 소유지를 인수했습니다! (총 비용: ${totalCost}만 원)`,
      badge: `인수 -${totalCost}만`,
      badgeColor: 'amber'
    });

    addLog(
      buyer.id,
      `💥 ${buyer.name}가 ${owner.name}의 [${space.name}]을(를) ${takeoverCost}만 원에 전격 인수(Takeover)했습니다!`,
      'takeover'
    );

    setActiveModal(null);
    registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
  };

  // Apply Golden Key Effect
  const applyGoldenKey = (currentTurnSeq?: number) => {
    const seq = currentTurnSeq || turnSeqRef.current;
    if (!currentGoldenKey) return;
    const activePlayer = playersRef.current[activePlayerIndexRef.current];
    if (!activePlayer) return;
    const card = currentGoldenKey;

    switch (card.type) {
      case 'money_gain': {
        const gain = card.amount || 20;
        soundManager.playCashGain();
        showFloatingEffect(activePlayer.id, gain, true);
        setPlayers(prev => {
          const next = prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money + gain } : p);
          return updateTotalAssets(next, cellsRef.current);
        });
        addLog(activePlayer.id, `💰 ${card.title}로 +${gain}만 원 획득!`, 'golden_key');
        triggerBroadcast({
          category: 'golden_key',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `💰 [${card.title}] +${gain}만 원 획득!`,
          detail: card.description,
          badge: `+${gain}만 원`,
          badgeColor: 'emerald'
        });
        break;
      }
      case 'money_loss': {
        const loss = card.amount || 20;
        soundManager.playTollPenalty();
        showFloatingEffect(activePlayer.id, loss, false);
        setPlayers(prev => {
          const next = prev.map(p => p.id === activePlayer.id ? { ...p, money: p.money - loss } : p);
          checkGameOver(next);
          return updateTotalAssets(next, cellsRef.current);
        });
        addLog(activePlayer.id, `💸 ${card.title}로 -${loss}만 원 차감`, 'golden_key');
        triggerBroadcast({
          category: 'golden_key',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `💸 [${card.title}] -${loss}만 원 차감`,
          detail: card.description,
          badge: `-${loss}만 원`,
          badgeColor: 'rose'
        });
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
          return updateTotalAssets(next, cellsRef.current);
        });
        addLog(activePlayer.id, `💖 사회복지기금에 ${donation}만 원 후원 완료`, 'golden_key');
        triggerBroadcast({
          category: 'golden_key',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `💖 [${card.title}] 기금 후원 (-${donation}만 원)`,
          detail: card.description,
          badge: `기부 -${donation}만`,
          badgeColor: 'rose'
        });
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
            return updateTotalAssets(next, cellsRef.current);
          });
          addLog(activePlayer.id, `🏦 사회복지기금 대박 수령! (+${pot}만 원)`, 'golden_key');
          triggerBroadcast({
            category: 'golden_key',
            playerId: activePlayer.id,
            playerName: activePlayer.name,
            playerColor: activePlayer.color,
            isAI: activePlayer.isAI,
            title: `🏦 사회복지기금 대박 수령! (+${pot}만 원)`,
            detail: card.description,
            badge: `대박 +${pot}만`,
            badgeColor: 'emerald'
          });
        }
        break;
      }
      case 'escape_card': {
        soundManager.playCashGain();
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, hasIslandEscapeCard: p.hasIslandEscapeCard + 1 } : p));
        addLog(activePlayer.id, `🛶 무인도 탈출권 1장 획득 및 보관`, 'golden_key');
        triggerBroadcast({
          category: 'golden_key',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `🛶 무인도 탈출권 획득!`,
          detail: '무인도 조난 시 즉시 사용할 수 있는 비상 탈출권을 획득했습니다.',
          badge: '탈출권 +1',
          badgeColor: 'amber'
        });
        break;
      }
      case 'move_space': {
        setActiveModal(null);
        warpToDestination(20, seq);
        return;
      }
      case 'move_start': {
        setActiveModal(null);
        warpToDestination(0, seq);
        return;
      }
      case 'move_island': {
        setActiveModal(null);
        soundManager.playTollPenalty();
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, pos: 10, islandTurnsLeft: 3 } : p));
        addLog(activePlayer.id, `🏝️ 폭풍우로 무인도로 강제 이송되었습니다!`, 'golden_key');
        triggerBroadcast({
          category: 'island',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `🏝️ 폭풍우 발생! 무인도로 강제 이송!`,
          detail: '거센 태풍을 만나 무인도로 표류했습니다. (3턴 조난)',
          badge: '무인도 3턴',
          badgeColor: 'indigo'
        });
        registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
        return;
      }
    }

    setActiveModal(null);
    registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
  };

  // AI Turn Automation Trigger (Rock-solid, dependency-isolated)
  useEffect(() => {
    if (gameState !== 'playing' || gameOverData || activeModal !== null || isTurnBusy) return;

    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || !activePlayer.isAI || activePlayer.isBankrupt) return;

    const currentSeq = turnSeqRef.current;
    const aiTimer = registerTimer(() => {
      if (turnSeqRef.current !== currentSeq || isTurnBusyRef.current) return;

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

      // Trigger synchronized visual & sound roll
      triggerDiceRoll();
    }, speedConfig.aiThinkDelayMs, currentSeq);

    return () => {
      window.clearTimeout(aiTimer);
    };
  }, [activePlayerIndex, turnCount, isTurnBusy, activeModal, gameState, gameOverData, currentSpeed]);

  // Apply new game mode config and reset
  const handleApplyConfig = (newConfig: GameModeConfig) => {
    clearAllGameTimers();
    turnSeqRef.current++;
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
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setGameLogs([]);
    const totalCount = newConfig.humanCount + newConfig.aiCount;
    addLog(0, `🎮 [인간 ${newConfig.humanCount}명${newConfig.aiCount > 0 ? ` + AI ${newConfig.aiCount}명` : ''} (총 ${totalCount}인)] 모드가 적용되었습니다.`, 'event');
  };

  // Start Game from setup screen
  const handleStartGameFromSetup = (config: GameModeConfig, names: string[]) => {
    clearAllGameTimers();
    turnSeqRef.current++;
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
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setGameLogs([]);

    const totalCount = config.humanCount + config.aiCount;
    const humanNamesStr = names.join(', ');
    const speedLabel = config.speed === 'slow' ? '느림 (여유로움)' : config.speed === 'fast' ? '빠르게 (스피드)' : '보통 (추천)';
    addLog(0, `🎲 [${humanNamesStr}] 님이 참여하는 부루마블 게임이 시작되었습니다! (총 ${totalCount}인, 속도: ${speedLabel})`, 'event');

    setGameState('playing');
    setTurnBannerVisible(true);
    registerTimer(() => setTurnBannerVisible(false), speedConfig.bannerDurationMs);
  };

  // Change Game Speed on the fly
  const handleChangeSpeed = (newSpeed: GameSpeed) => {
    setGameConfig(prev => ({ ...prev, speed: newSpeed }));
    const label = newSpeed === 'slow' ? '🐢 느림' : newSpeed === 'normal' ? '🚶 보통' : '⚡ 빠르게';
    addLog(0, `⚡ 게임 진행 속도가 [${label}]으로 변경되었습니다.`, 'event');
  };

  // Reset Game with current config and names
  const resetGame = () => {
    clearAllGameTimers();
    turnSeqRef.current++;
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
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setGameLogs([]);
    addLog(0, "✨ 새 게임이 시작되었습니다! 행운을 빕니다.", "event");
    setTurnBannerVisible(true);
    registerTimer(() => setTurnBannerVisible(false), speedConfig.bannerDurationMs);
  };

  const handleExitToLobby = () => {
    clearAllGameTimers();
    turnSeqRef.current++;
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setActiveModal(null);
    setGameOverData(null);
    setGameState('setup');
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
            onRollDice={triggerDiceRoll}
            isRolling={isRolling}
            isTumbling={isTumbling}
            isDiceDisabled={isTurnBusy || isRolling || isTumbling || activePlayer.isAI || activeModal !== null}
            currentDice={currentDice}
            isDouble={isDouble}
            highlightedCellId={activePlayer.pos}
            isDestinationSelectionActive={activeModal === 'space_travel'}
            gameSpeed={currentSpeed}
            broadcast={boardBroadcast}
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
          onChangeSpeed={handleChangeSpeed}
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
            const currentSeq = turnSeqRef.current;
            addLog(activePlayer.id, `▶ ${activePlayer.name}가 [${activeSpace.name}] 투자를 보류했습니다.`, 'buy');
            triggerBroadcast({
              category: 'pass',
              playerId: activePlayer.id,
              playerName: activePlayer.name,
              playerColor: activePlayer.color,
              isAI: activePlayer.isAI,
              title: `⏭️ [${activeSpace.name}] 투자 보류 (패스)`,
              detail: `${activePlayer.name}님이 이번 턴 투자를 건너뛰었습니다.`,
              badge: '투자 보류',
              badgeColor: 'slate'
            });
            setActiveModal(null);
            registerTimer(() => endTurn(isDouble, currentSeq), speedConfig.modalActionDelayMs, currentSeq);
          }}
        />
      )}

      {/* 2. Toll Payment & Takeover Modal */}
      {activeModal === 'toll' && currentTollData && !activePlayer.isAI && (
        <TollModal
          space={currentTollData.space}
          cellState={cells[currentTollData.space.id] || { owner: null, buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false }, currentToll: 0 }}
          payer={currentTollData.payer}
          owner={currentTollData.owner}
          onPayToll={() => executePayToll(currentTollData.space, currentTollData.owner, currentTollData.payer, (cells[currentTollData.space.id] || { currentToll: 0 }).currentToll)}
          onTakeover={(takeoverCost) => executeTakeover(currentTollData.space, currentTollData.owner, currentTollData.payer, (cells[currentTollData.space.id] || { currentToll: 0 }).currentToll, takeoverCost)}
        />
      )}

      {/* 3. Golden Key Modal */}
      {activeModal === 'golden_key' && currentGoldenKey && (
        <GoldenKeyModal
          card={currentGoldenKey}
          onConfirm={() => applyGoldenKey()}
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
