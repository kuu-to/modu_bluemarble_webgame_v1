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
  BoardBroadcastMessage,
  AirplaneColorId
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
import { EmergencyDebtModal } from './components/EmergencyDebtModal';
import { StartUpgradeModal, getUpgradeableCities } from './components/StartUpgradeModal';
import { IslandModal } from './components/IslandModal';

const INITIAL_MONEY = 300; // 300만 원 initial cash
const SALARY_AMOUNT = 20; // 20만 원 salary

export default function App() {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [gameConfig, setGameConfig] = useState<GameModeConfig>({
    humanCount: 2,
    aiCount: 0,
    speed: 'normal',
    timeLimitMinutes: 60
  });
  const [customNames, setCustomNames] = useState<string[]>(['플레이어 1', '플레이어 2']);
  const [customAirplaneColors, setCustomAirplaneColors] = useState<AirplaneColorId[]>(['red', 'blue']);
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Time limit state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const currentSpeed: GameSpeed = gameConfig.speed || 'normal';
  const speedConfig = SPEED_CONFIGS[currentSpeed];

  // Initialize Players based on config (Default: Human 2 Players, 0 AI)
  const [players, setPlayers] = useState<Player[]>(() =>
    createPlayersForMode(2, 0, INITIAL_MONEY, undefined, ['red', 'blue'])
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
  const [activeModal, setActiveModal] = useState<null | 'purchase' | 'toll' | 'golden_key' | 'space_travel' | 'game_over' | 'debt' | 'start_upgrade' | 'island'>(null);
  const [currentGoldenKey, setCurrentGoldenKey] = useState<GoldenKeyCard | null>(null);
  const [goldenKeyContext, setGoldenKeyContext] = useState<{
    card: GoldenKeyCard;
    player: Player;
    currentTurnSeq: number;
    rolledDouble: boolean;
  } | null>(null);
  const [currentTollData, setCurrentTollData] = useState<{ space: SpaceData; owner: Player; payer: Player } | null>(null);
  const [debtModalData, setDebtModalData] = useState<{
    payer: Player;
    debtAmount: number;
    totalRequiredAmount?: number;
    recipient: Player | null;
    reasonText: string;
    rolledDouble?: boolean;
    onSuccess: (updatedPayer: Player, updatedRecipient: Player | null) => void;
  } | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverResult | null>(null);

  // Reference trackers for rock-solid concurrency and race condition prevention
  const turnSeqRef = useRef<number>(1);
  const timersRef = useRef<number[]>([]);
  const playersRef = useRef<Player[]>(players);
  const cellsRef = useRef<Record<number, CellState>>(cells);
  const activePlayerIndexRef = useRef<number>(activePlayerIndex);
  const isTurnBusyRef = useRef<boolean>(false);
  const doubleCountRef = useRef<number>(0);
  const rolledDoubleRef = useRef<boolean>(false);

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

  useEffect(() => {
    doubleCountRef.current = doubleCount;
  }, [doubleCount]);

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
    if (broadcastTimeoutRef.current) {
      window.clearTimeout(broadcastTimeoutRef.current);
      broadcastTimeoutRef.current = null;
    }
    soundManager.stopAll();
  };

  // Broadcast timer ref to revert to idle after display time
  const broadcastTimeoutRef = useRef<number | null>(null);

  // Trigger Board Broadcast Notification
  const triggerBroadcast = (msg: Omit<BoardBroadcastMessage, 'id' | 'timestamp'>) => {
    if (broadcastTimeoutRef.current) {
      window.clearTimeout(broadcastTimeoutRef.current);
      broadcastTimeoutRef.current = null;
    }
    setBoardBroadcast({
      ...msg,
      id: Math.random().toString(),
      timestamp: Date.now()
    });

    // Auto-revert broadcast back to turn guidance after 6.5s so it never freezes
    broadcastTimeoutRef.current = window.setTimeout(() => {
      setBoardBroadcast(null);
      broadcastTimeoutRef.current = null;
    }, 6500);
  };

  // Update sound manager toggle
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Time Limit Countdown Interval
  useEffect(() => {
    if (gameState !== 'playing' || remainingSeconds === null || gameOverData) return;

    if (remainingSeconds <= 0) {
      // Time expired! Trigger final asset evaluation
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, remainingSeconds, gameOverData]);

  // Handle Game Time Limit Expiration
  const handleTimeExpired = () => {
    const playerList = playersRef.current;
    // Calculate final net wealth: totalAssets (which includes land + buildings + cash - debt)
    const sorted = [...playerList].sort((a, b) => {
      if (a.isBankrupt !== b.isBankrupt) return a.isBankrupt ? 1 : -1;
      return b.totalAssets - a.totalAssets;
    });

    const winner = sorted[0];
    soundManager.playVictory();
    setGameOverData({
      winner,
      rankings: sorted,
      reason: `⏱️ 제한 시간 종료! 총 자산(땅+건물+현금-빚) 최고 보유자 승리!`
    });
    setActiveModal('game_over');
    triggerBroadcast({
      category: 'turn',
      playerId: winner.id,
      playerName: winner.name,
      playerColor: winner.color,
      isAI: winner.isAI,
      title: `🏆 [${winner.name}] 제한 시간 종료 최종 우승!`,
      detail: `최종 순자산 ${winner.totalAssets}만 원으로 1위를 차지했습니다!`,
      badge: '시간 종료 승리',
      badgeColor: 'amber'
    });
  };

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

  // Recalculate total assets (Cash + Land & Buildings Value - Debt)
  const updateTotalAssets = (updatedPlayers: Player[], updatedCells: Record<number, CellState>) => {
    return updatedPlayers.map(p => {
      let propertySum = 0;
      let count = 0;
      Object.entries(updatedCells).forEach(([idStr, cell]) => {
        if (cell.owner === p.id) {
          count++;
          const space = BOARD_SPACES[Number(idStr)];
          if (space) {
            propertySum += calculateSpaceValue(space, cell.buildings);
          }
        }
      });

      // Total Net Assets = Cash + Property Value - Debt
      const netAssets = Math.max(0, p.money + propertySum - (p.debt || 0));

      return {
        ...p,
        totalAssets: netAssets,
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
      rolledDoubleRef.current = true;
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

    // Normal turn switch: completely reset double state
    rolledDoubleRef.current = false;
    setDoubleCount(0);
    doubleCountRef.current = 0;
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
      if (nextPlayer.spaceTravelQueued) {
        triggerBroadcast({
          category: 'space_travel',
          playerId: nextPlayer.id,
          playerName: nextPlayer.name,
          playerColor: nextPlayer.color,
          isAI: nextPlayer.isAI,
          title: `🛸 [${nextPlayer.name}] 우주여행 차례입니다!`,
          detail: nextPlayer.isAI
            ? '컴퓨터 AI가 우주여행 목적지를 연산 중입니다...'
            : '🚀 [우주여행 하기] 버튼을 눌러 원하는 목적지로 워프하세요!',
          badge: '우주여행 턴',
          badgeColor: 'purple'
        });
      } else {
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

      // If next player is trapped in Island, open Island Escape Action Modal
      if (!nextPlayer.isAI && nextPlayer.islandTurnsLeft > 0) {
        registerTimer(() => {
          if (turnSeqRef.current === currentSeq) {
            setActiveModal('island');
          }
        }, speedConfig.bannerDurationMs + 100, currentSeq);
      }
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

  // Repay Debt handler for players
  const handleRepayDebt = (playerId: number) => {
    const p = playersRef.current.find(x => x.id === playerId);
    if (!p || p.debt <= 0 || p.money < p.debt) return;

    soundManager.playCashGain();
    const repayAmount = p.debt;
    showFloatingEffect(p.id, repayAmount, false);

    setPlayers(prev => {
      const next = prev.map(x => x.id === playerId ? { ...x, money: x.money - repayAmount, debt: 0 } : x);
      return updateTotalAssets(next, cellsRef.current);
    });

    addLog(p.id, `💳 ${p.name}가 대출 빚 ${repayAmount}만 원을 전액 상환했습니다!`, 'event');
    triggerBroadcast({
      category: 'purchase',
      playerId: p.id,
      playerName: p.name,
      playerColor: p.color,
      isAI: p.isAI,
      title: `💳 [대출 빚 상환 완료]`,
      detail: `${p.name}님이 누적된 대출 빚 ${repayAmount}만 원을 전액 변제했습니다.`,
      badge: '부채 0원',
      badgeColor: 'emerald'
    });
  };

  // Handle Action on Space Landing
  const handleSpaceAction = (player: Player, space: SpaceData, currentTurnSeq: number, rolledDouble: boolean = false) => {
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
        playersRef.current = next;
        return updateTotalAssets(next, cellsRef.current);
      });
      rolledDoubleRef.current = false;
      registerTimer(() => endTurn(false, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
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
        playersRef.current = next;
        return updateTotalAssets(next, cellsRef.current);
      });
      rolledDoubleRef.current = false;
      registerTimer(() => endTurn(false, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
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
          playersRef.current = next;
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
      registerTimer(() => endTurn(rolledDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
      return;
    }

    // 4. Tax (국세청)
    if (space.type === 'tax') {
      const freshPlayer = playersRef.current.find(p => p.id === player.id) || player;
      const taxAmount = Math.max(15, Math.floor(freshPlayer.money * 0.1) || 20);
      executeUniversalPayment({
        payer: freshPlayer,
        totalAmount: taxAmount,
        recipient: null,
        reasonTitle: '국세청 세무조사 세금',
        reasonText: `국세청 세무조사 세금 ${taxAmount}만 원 중 ${Math.max(0, taxAmount - freshPlayer.money)}만 원 부족`,
        category: 'tax',
        isSocialFundDonation: true,
        currentTurnSeq,
        rolledDouble
      });
      return;
    }

    // 5. Golden Key (황금열쇠)
    if (space.type === 'golden_key') {
      soundManager.playGoldenKey();
      const keyCard = getRandomGoldenKey();
      setCurrentGoldenKey(keyCard);
      setGoldenKeyContext({
        card: keyCard,
        player,
        currentTurnSeq,
        rolledDouble
      });
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
          applyGoldenKey(player, currentTurnSeq, rolledDouble);
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
              confirmPurchase(simulatedBuildings, decision.totalCost, player, currentTurnSeq, rolledDouble);
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
              registerTimer(() => endTurn(rolledDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
            }
          }, speedConfig.aiActionDelayMs, currentTurnSeq);
        } else {
          setActiveModal('purchase');
        }
      } else if (isOpponent) {
        // Toll & Takeover
        const opponent = playersRef.current.find(p => p.id === cellState.owner);
        if (!opponent) {
          registerTimer(() => endTurn(rolledDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
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
              executeTakeover(space, opponent, player, toll, takeoverCost, currentTurnSeq, rolledDouble);
            } else {
              // Pay Toll
              executePayToll(space, opponent, player, toll, currentTurnSeq, rolledDouble);
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
        registerTimer(() => endTurn(rolledDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
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

      // Special Rule: If landing exactly on start after turn 1 (turnCount > 1), player can upgrade 1 owned property
      if (turnCount > 1) {
        const upgradeableList = getUpgradeableCities(BOARD_SPACES, cellsRef.current, player);
        if (upgradeableList.length > 0) {
          if (player.isAI) {
            registerTimer(() => {
              const affordable = upgradeableList.filter(item => player.money >= item.nextUpgradeCost);
              if (affordable.length > 0) {
                // Pick best upgradeable property (Landmark priority, then highest tollDiff)
                const best = [...affordable].sort((a, b) => {
                  if (a.nextUpgradeType === 'landmark') return -1;
                  if (b.nextUpgradeType === 'landmark') return 1;
                  return b.tollDiff - a.tollDiff;
                })[0];
                handleConfirmStartUpgrade(best.space.id, best.nextBuildings, best.nextUpgradeCost, player, currentTurnSeq, rolledDouble);
              } else {
                addLog(player.id, `🏁 ${player.name}가 출발점에 안착했습니다. (자금 부족으로 증축 패스)`, 'event');
                registerTimer(() => endTurn(rolledDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
              }
            }, speedConfig.aiActionDelayMs, currentTurnSeq);
            return;
          } else {
            // Human player: open StartUpgradeModal
            setActiveModal('start_upgrade');
            return;
          }
        } else {
          addLog(player.id, `🏁 ${player.name}가 출발점에 안착했습니다. (추가 증축 가능한 보유 도시 없음)`, 'event');
        }
      }

      registerTimer(() => endTurn(rolledDouble, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
    }
  };

  // Step-by-step Token Movement Animation Engine
  const moveTokenSteps = (player: Player, totalSteps: number, currentTurnSeq: number, rolledDouble: boolean = false) => {
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
      let passedSalary = false;
      if (currPos === 0) {
        passedSalary = true;
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
      }

      setPlayers(prev => {
        const next = prev.map(p => {
          if (p.id === player.id) {
            return {
              ...p,
              pos: currPos,
              money: passedSalary ? p.money + SALARY_AMOUNT : p.money
            };
          }
          return p;
        });
        playersRef.current = next;
        return updateTotalAssets(next, cellsRef.current);
      });

      if (currentStep >= totalSteps) {
        window.clearInterval(stepInterval);
        setIsRolling(false);
        const finalSpace = BOARD_SPACES[currPos];
        const freshPlayer = playersRef.current.find(p => p.id === player.id) || { ...player, pos: currPos };
        
        // Immediate Arrival Notification
        triggerBroadcast({
          category: 'arrive',
          playerId: freshPlayer.id,
          playerName: freshPlayer.name,
          playerColor: freshPlayer.color,
          isAI: freshPlayer.isAI,
          title: `📍 [${finalSpace.name}] 땅에 도착했습니다!`,
          detail: `${freshPlayer.name}님이 [${finalSpace.name}]에 안착했습니다.`,
          badge: '도착',
          badgeColor: 'sky'
        });

        // Arrival pause to view board position before popping up modal/actions
        registerTimer(() => {
          handleSpaceAction(freshPlayer, finalSpace, currentTurnSeq, rolledDouble);
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
        rolledDoubleRef.current = rolledDouble;

        if (rolledDouble) {
          const nextDoubleCount = doubleCountRef.current + 1;
          setDoubleCount(nextDoubleCount);
          doubleCountRef.current = nextDoubleCount;

          soundManager.playDoubleBonus();
          addLog(activePlayer.id, `🎲 ${activePlayer.name} 주사위 [${d1} + ${d2} = ${total}] 더블 굴림! (연속 ${nextDoubleCount}회)`, 'roll');
          triggerBroadcast({
            category: 'roll',
            playerId: activePlayer.id,
            playerName: activePlayer.name,
            playerColor: activePlayer.color,
            isAI: activePlayer.isAI,
            title: `🎲 주사위 [${d1} + ${d2} = ${total}] 더블! (연속 ${nextDoubleCount}회) 🎯`,
            detail: `${activePlayer.name}님이 ${total}칸 전진합니다. (더블 찬스로 한 번 더 굴림!)`,
            badge: `더블 찬스 (${nextDoubleCount}연속)`,
            badgeColor: 'amber'
          });
        } else {
          setDoubleCount(0);
          doubleCountRef.current = 0;
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
          // 3 consecutive doubles penalty rule: Send to Island directly
          if (rolledDouble && doubleCountRef.current >= 3) {
            soundManager.playTollPenalty();
            addLog(activePlayer.id, `🚨 3회 연속 더블 발생! 무인도로 강제 이송 조치됩니다.`, 'event');
            triggerBroadcast({
              category: 'island',
              playerId: activePlayer.id,
              playerName: activePlayer.name,
              playerColor: activePlayer.color,
              isAI: activePlayer.isAI,
              title: `🚨 3회 연속 더블! 무인도 강제 이송!`,
              detail: '과속 위반으로 무인도에 3턴 동안 구금 조치됩니다.',
              badge: '무인도 수감',
              badgeColor: 'indigo'
            });
            setPlayers(prev => {
              const next = prev.map(p => p.id === activePlayer.id ? { ...p, pos: 10, islandTurnsLeft: 3 } : p);
              return updateTotalAssets(next, cellsRef.current);
            });
            setIsRolling(false);
            setDoubleCount(0);
            doubleCountRef.current = 0;
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
              setPlayers(prev => {
                const next = prev.map(p => p.id === activePlayer.id ? { ...p, islandTurnsLeft: 0 } : p);
                playersRef.current = next;
                return next;
              });
              moveTokenSteps(activePlayer, total, currentTurnSeq, rolledDouble);
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
              setPlayers(prev => {
                const next = prev.map(p => p.id === activePlayer.id ? { ...p, islandTurnsLeft: p.islandTurnsLeft - 1 } : p);
                playersRef.current = next;
                return next;
              });
              setIsRolling(false);
              registerTimer(() => endTurn(false, currentTurnSeq), speedConfig.modalActionDelayMs, currentTurnSeq);
            }
            return;
          }

          moveTokenSteps(activePlayer, total, currentTurnSeq, rolledDouble);
        }, 400, currentTurnSeq);
      }
    }, tickInterval);
  };

  // Handle start of space travel for active human player
  const handleStartSpaceTravel = () => {
    const activePlayer = playersRef.current[activePlayerIndexRef.current];
    if (!activePlayer || activePlayer.isBankrupt || isTurnBusy || isRolling) return;

    soundManager.playGoldenKey();
    setActiveModal('space_travel');
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
    
    // In Blue Marble, passing start line (from pos 20 to 0~19) awards salary
    const passedStart = activePlayer.pos > destPos;
    if (passedStart) {
      soundManager.playCashGain();
      showFloatingEffect(activePlayer.id, SALARY_AMOUNT, true);
      addLog(activePlayer.id, `🚀 우주여행 중 출발점 통과! 월급 +${SALARY_AMOUNT}만 원 지급`, 'event');
      triggerBroadcast({
        category: 'salary',
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        playerColor: activePlayer.color,
        isAI: activePlayer.isAI,
        title: `💰 [출발점 통과] 월급 +${SALARY_AMOUNT}만 원!`,
        detail: `${activePlayer.name}님이 우주 비행 중 출발점을 경유하여 월급 ${SALARY_AMOUNT}만 원을 지급받았습니다.`,
        badge: `월급 +${SALARY_AMOUNT}만`,
        badgeColor: 'emerald'
      });
    }

    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id === activePlayer.id) {
          const salaryBonus = passedStart ? SALARY_AMOUNT : 0;
          return { ...p, pos: destPos, money: p.money + salaryBonus, spaceTravelQueued: false };
        }
        return p;
      });
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

  // Confirm Start Tile Remote Upgrade (Only 1 property upgradeable on Start landing after turn 1)
  const handleConfirmStartUpgrade = (
    spaceId: number,
    newBuildings: { hasVilla: boolean; hasBuilding: boolean; hasHotel: boolean; isLandmark: boolean },
    cost: number,
    playerOverride?: Player,
    currentTurnSeq?: number
  ) => {
    const seq = currentTurnSeq || turnSeqRef.current;
    const player = playerOverride || playersRef.current[activePlayerIndexRef.current];
    const space = BOARD_SPACES[spaceId];
    if (!space) return;

    soundManager.playBuildingBuild(newBuildings.isLandmark);
    showFloatingEffect(player.id, cost, false);

    const calculatedToll = calculateToll(space, newBuildings);

    setCells(prev => ({
      ...prev,
      [space.id]: {
        owner: player.id,
        buildings: newBuildings,
        currentToll: calculatedToll
      }
    }));

    setPlayers(prev => {
      const next = prev.map(p => p.id === player.id ? { ...p, money: p.money - cost } : p);
      const updated = updateTotalAssets(next, {
        ...cellsRef.current,
        [space.id]: { owner: player.id, buildings: newBuildings, currentToll: calculatedToll }
      });
      return updated;
    });

    const bldNames: string[] = [];
    if (newBuildings.isLandmark) bldNames.push('👑 랜드마크');
    else {
      if (newBuildings.hasHotel) bldNames.push('호텔');
      if (newBuildings.hasBuilding) bldNames.push('빌딩');
      if (newBuildings.hasVilla) bldNames.push('별장');
    }
    const bldDesc = bldNames.length > 0 ? bldNames[bldNames.length - 1] : '건물';

    triggerBroadcast({
      category: 'purchase',
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      isAI: player.isAI,
      title: `🏁 [출발점 원격 건설] [${space.name}] ${bldDesc} 증축 완공! (-${cost}만)`,
      detail: `${player.name}님이 출발점 보너스로 [${space.name}]에 건물을 추가 증축했습니다. (새 통행료: ${calculatedToll}만 원)`,
      badge: newBuildings.isLandmark ? '👑 랜드마크' : `원격증축 -${cost}만`,
      badgeColor: newBuildings.isLandmark ? 'amber' : 'emerald'
    });

    addLog(
      player.id,
      `🏁 [출발점 원격 건설] ${player.name}가 [${space.name}]에 ${bldDesc}을(를) 추가 증축했습니다! (비용: ${cost}만 원, 통행료: ${calculatedToll}만 원)${newBuildings.isLandmark ? ' 👑 랜드마크 달성!' : ''}`,
      newBuildings.isLandmark ? 'upgrade' : 'buy'
    );

    setActiveModal(null);
    registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
  };

  // Island Escape Actions (Inventory-stored card usage, bail fee, and double roll)
  const handleUseIslandEscapeCard = (playerOverride?: Player) => {
    const player = playerOverride || playersRef.current[activePlayerIndexRef.current];
    if (!player || player.hasIslandEscapeCard <= 0) return;

    soundManager.playCashGain();
    setPlayers(prev => prev.map(p => p.id === player.id ? {
      ...p,
      hasIslandEscapeCard: p.hasIslandEscapeCard - 1,
      islandTurnsLeft: 0
    } : p));

    addLog(player.id, `🛶 ${player.name}가 보관 중이던 [무인도 탈출권]을 사용하여 무인도를 즉시 탈출했습니다! (남은 탈출권: ${player.hasIslandEscapeCard - 1}장)`, 'event');
    triggerBroadcast({
      category: 'island',
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      isAI: player.isAI,
      title: `🛶 [무인도 탈출] 탈출권 사용 성공!`,
      detail: `${player.name}님이 보관 중이던 무인도 탈출권을 사용하여 즉시 탈출했습니다. 주사위를 굴려 전진하세요!`,
      badge: '탈출 성공',
      badgeColor: 'emerald'
    });

    setActiveModal(null);
  };

  const handlePayIslandBail = (playerOverride?: Player) => {
    const player = playerOverride || playersRef.current[activePlayerIndexRef.current];
    if (!player || player.money < 20) return;

    soundManager.playTollPenalty();
    showFloatingEffect(player.id, 20, false);
    setSocialFund(prev => prev + 20);

    setPlayers(prev => {
      const next = prev.map(p => p.id === player.id ? {
        ...p,
        money: p.money - 20,
        islandTurnsLeft: 0
      } : p);
      return updateTotalAssets(next, cellsRef.current);
    });

    addLog(player.id, `💰 ${player.name}가 보석금 20만 원을 지불하고 무인도를 즉시 탈출했습니다. (기금 적립)`, 'event');
    triggerBroadcast({
      category: 'island',
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      isAI: player.isAI,
      title: `💰 [무인도 보석금 탈출] 20만 원 납부`,
      detail: `${player.name}님이 보석금을 납부하고 무인도를 즉시 탈출했습니다. 주사위를 굴려 전진하세요!`,
      badge: '보석금 -20만',
      badgeColor: 'amber'
    });

    setActiveModal(null);
  };

  const handleTryIslandDouble = () => {
    setActiveModal(null);
    triggerDiceRoll();
  };

  // Universal Payment & Emergency Debt / Sale Relief Handler
  interface UniversalPaymentParams {
    payer: Player;
    totalAmount: number;
    recipient: Player | null;
    reasonTitle: string;
    reasonText: string;
    category: 'toll' | 'tax' | 'golden_key' | 'fund' | 'event';
    isSocialFundDonation?: boolean;
    currentTurnSeq?: number;
    onCompleted?: (updatedPayer: Player, updatedRecipient: Player | null) => void;
  }

  const executeUniversalPayment = (params: UniversalPaymentParams) => {
    const {
      payer,
      totalAmount,
      recipient,
      reasonTitle,
      reasonText,
      category,
      isSocialFundDonation = false,
      currentTurnSeq,
      onCompleted
    } = params;

    const seq = currentTurnSeq || turnSeqRef.current;

    // 1. Normal Payment (Player has sufficient cash)
    if (payer.money >= totalAmount) {
      soundManager.playTollPenalty();
      showFloatingEffect(payer.id, totalAmount, false);
      if (recipient) {
        showFloatingEffect(recipient.id, totalAmount, true);
      }
      if (isSocialFundDonation) {
        setSocialFund(prev => prev + totalAmount);
      }

      const logType = category === 'toll' ? 'toll' : category === 'golden_key' ? 'golden_key' : 'event';
      const recipientName = recipient ? `${recipient.name}님에게 ` : isSocialFundDonation ? '사회복지기금에 ' : '';
      addLog(payer.id, `💸 ${payer.name}가 ${recipientName}[${reasonTitle}] ${totalAmount}만 원 지불 완료`, logType);

      triggerBroadcast({
        category: category === 'toll' ? 'toll_paid' : category === 'tax' ? 'tax' : 'golden_key',
        playerId: payer.id,
        playerName: payer.name,
        playerColor: playerColor(payer.id),
        isAI: payer.isAI,
        title: `💸 [${reasonTitle}] ${totalAmount}만 원 지불 완료!`,
        detail: recipient
          ? `${payer.name} → ${recipient.name}님에게 ${totalAmount}만 원 송금 (지불 후 잔액: ${payer.money - totalAmount}만 원)`
          : isSocialFundDonation
          ? `${payer.name}님이 기금에 ${totalAmount}만 원을 적립했습니다. (지불 후 잔액: ${payer.money - totalAmount}만 원)`
          : `${payer.name}님이 ${totalAmount}만 원을 납부했습니다. (지불 후 잔액: ${payer.money - totalAmount}만 원)`,
        badge: `-${totalAmount}만`,
        badgeColor: 'rose'
      });

      let updatedPayerRes: Player | null = null;
      let updatedRecipientRes: Player | null = null;

      setPlayers(prev => {
        const next = prev.map(p => {
          if (p.id === payer.id) {
            const u = { ...p, money: p.money - totalAmount };
            updatedPayerRes = u;
            return u;
          }
          if (recipient && p.id === recipient.id) {
            const u = { ...p, money: p.money + totalAmount };
            updatedRecipientRes = u;
            return u;
          }
          return p;
        });
        checkGameOver(next);
        return updateTotalAssets(next, cellsRef.current);
      });

      setActiveModal(null);
      if (onCompleted && updatedPayerRes) {
        onCompleted(updatedPayerRes, updatedRecipientRes);
      } else {
        registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
      }
      return;
    }

    // 2. Insufficient Funds (Emergency Debt & Property Sale Relief)
    const deficit = totalAmount - payer.money;

    // AI Emergency Handling
    if (payer.isAI) {
      if (!payer.hasUsedLoan) {
        // AI Option 1: Emergency Loan
        const loanAmt = deficit;
        soundManager.playCashGain();
        if (isSocialFundDonation) {
          setSocialFund(prev => prev + totalAmount);
        }

        const updatedPayer: Player = {
          ...payer,
          money: 0,
          debt: (payer.debt || 0) + loanAmt,
          hasUsedLoan: true
        };

        const updatedRecipient: Player | null = recipient ? {
          ...recipient,
          money: recipient.money + totalAmount
        } : null;

        showFloatingEffect(payer.id, totalAmount, false);
        if (recipient) {
          showFloatingEffect(recipient.id, totalAmount, true);
        }

        addLog(payer.id, `💳 ${payer.name}가 긴급 대출 ${loanAmt}만 원을 승인받아 [${reasonTitle}] ${totalAmount}만 원을 완납했습니다.`, 'event');
        triggerBroadcast({
          category: 'purchase',
          playerId: payer.id,
          playerName: payer.name,
          playerColor: payer.color,
          isAI: payer.isAI,
          title: `💳 [긴급 구제 대출] ${reasonTitle} 완납`,
          detail: `${payer.name}님이 긴급 대출 ${loanAmt}만 원을 실행하여 비용을 해결했습니다. (총 부채: ${updatedPayer.debt}만 원)`,
          badge: `대출 빚 +${loanAmt}만`,
          badgeColor: 'indigo'
        });

        setPlayers(prev => {
          const next = prev.map(p => {
            if (p.id === payer.id) return updatedPayer;
            if (recipient && p.id === recipient.id) return updatedRecipient!;
            return p;
          });
          return updateTotalAssets(next, cellsRef.current);
        });

        setActiveModal(null);
        if (onCompleted) {
          onCompleted(updatedPayer, updatedRecipient);
        } else {
          registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
        }
        return;
      } else {
        // AI Option 2: Sell Properties
        const aiOwnedCells = (Object.entries(cellsRef.current) as [string, CellState][]).filter(([_, c]) => c.owner === payer.id);
        let recovered = 0;
        const soldIds: number[] = [];

        for (const [idStr, c] of aiOwnedCells) {
          const sId = Number(idStr);
          const sp = BOARD_SPACES[sId];
          if (sp) {
            const val = calculateSpaceValue(sp, c.buildings);
            recovered += val;
            soldIds.push(sId);
            if (payer.money + recovered >= totalAmount) break;
          }
        }

        if (payer.money + recovered >= totalAmount) {
          if (isSocialFundDonation) {
            setSocialFund(prev => prev + totalAmount);
          }

          setCells(prev => {
            const nextC = { ...prev };
            soldIds.forEach(id => {
              nextC[id] = {
                owner: null,
                buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
                currentToll: 0
              };
            });
            return nextC;
          });

          const remainingCash = (payer.money + recovered) - totalAmount;
          const updatedPayer: Player = { ...payer, money: remainingCash };
          const updatedRecipient: Player | null = recipient ? { ...recipient, money: recipient.money + totalAmount } : null;

          showFloatingEffect(payer.id, totalAmount, false);
          if (recipient) {
            showFloatingEffect(recipient.id, totalAmount, true);
          }

          addLog(payer.id, `🏬 ${payer.name}가 도시 ${soldIds.length}개를 긴급 매각(+${recovered}만 원)하여 [${reasonTitle}]을 완납했습니다.`, 'event');
          triggerBroadcast({
            category: 'purchase',
            playerId: payer.id,
            playerName: payer.name,
            playerColor: payer.color,
            isAI: payer.isAI,
            title: `🏬 [소유 도시 긴급 매각] ${reasonTitle} 완납`,
            detail: `매각 환급금 ${recovered}만 원으로 부족금을 충당하여 전액 완납했습니다.`,
            badge: `매각 +${recovered}만`,
            badgeColor: 'amber'
          });

          setPlayers(prev => {
            const next = prev.map(p => {
              if (p.id === payer.id) return updatedPayer;
              if (recipient && p.id === recipient.id) return updatedRecipient!;
              return p;
            });
            return updateTotalAssets(next, cellsRef.current);
          });

          setActiveModal(null);
          if (onCompleted) {
            onCompleted(updatedPayer, updatedRecipient);
          } else {
            registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
          }
          return;
        } else {
          // AI Bankrupt
          setPlayers(prev => {
            const next = prev.map(p => p.id === payer.id ? { ...p, money: -1 } : p);
            checkGameOver(next);
            return updateTotalAssets(next, cellsRef.current);
          });
          setActiveModal(null);
          registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
          return;
        }
      }
    }

    // Human Player: Open EmergencyDebtModal
    setActiveModal(null);
    setDebtModalData({
      payer,
      debtAmount: deficit,
      totalRequiredAmount: totalAmount,
      recipient,
      reasonText,
      onSuccess: (updatedPayer, updatedRecipient) => {
        showFloatingEffect(payer.id, totalAmount, false);
        if (recipient) {
          showFloatingEffect(recipient.id, totalAmount, true);
        }
        if (isSocialFundDonation) {
          setSocialFund(prev => prev + totalAmount);
        }

        addLog(payer.id, `💸 ${payer.name}가 구제 조치를 통해 [${reasonTitle}] ${totalAmount}만 원을 정상 완납했습니다.`, category === 'toll' ? 'toll' : category === 'golden_key' ? 'golden_key' : 'event');

        setPlayers(prev => {
          const next = prev.map(p => {
            if (p.id === updatedPayer.id) return updatedPayer;
            if (updatedRecipient && p.id === updatedRecipient.id) return updatedRecipient;
            return p;
          });
          return updateTotalAssets(next, cellsRef.current);
        });

        setActiveModal(null);
        setDebtModalData(null);
        if (onCompleted) {
          onCompleted(updatedPayer, updatedRecipient);
        } else {
          registerTimer(() => endTurn(isDouble, seq), speedConfig.modalActionDelayMs, seq);
        }
      }
    });
    setActiveModal('debt');
  };

  // Execute Toll Payment (With Loan & Property Sale Rescue Support)
  const executePayToll = (space: SpaceData, owner: Player, payer: Player, toll: number, currentTurnSeq?: number) => {
    executeUniversalPayment({
      payer,
      totalAmount: toll,
      recipient: owner,
      reasonTitle: `${owner.name}의 [${space.name}] 통행료`,
      reasonText: `${owner.name}의 [${space.name}] 통행료 ${toll}만 원 중 ${Math.max(0, toll - payer.money)}만 원 부족`,
      category: 'toll',
      currentTurnSeq
    });
  };

  // Loan confirmation handler from EmergencyDebtModal
  const handleConfirmLoan = (loanAmount: number) => {
    if (!debtModalData) return;
    const { payer, debtAmount, totalRequiredAmount, recipient, onSuccess } = debtModalData;
    const fullAmount = totalRequiredAmount || (payer.money + debtAmount);

    soundManager.playCashGain();
    const updatedPayer: Player = {
      ...payer,
      money: 0, // Used all existing cash + loan to pay full bill
      debt: (payer.debt || 0) + loanAmount,
      hasUsedLoan: true
    };

    const updatedRecipient: Player | null = recipient ? {
      ...recipient,
      money: recipient.money + fullAmount
    } : null;

    addLog(payer.id, `💳 ${payer.name}가 긴급 구제 대출 ${loanAmount}만 원을 실행하여 부채가 발생했습니다.`, 'event');
    triggerBroadcast({
      category: 'purchase',
      playerId: payer.id,
      playerName: payer.name,
      playerColor: payer.color,
      isAI: payer.isAI,
      title: `💳 [긴급 구제 대출 실행] (+${loanAmount}만 원)`,
      detail: `${payer.name}님이 긴급 대출을 받아 부족금을 완납했습니다. (총 부채: ${updatedPayer.debt}만 원)`,
      badge: `대출 빚 +${loanAmount}만`,
      badgeColor: 'indigo'
    });

    onSuccess(updatedPayer, updatedRecipient);
  };

  // Property sale confirmation handler from EmergencyDebtModal
  const handleConfirmSellProperties = (soldSpaceIds: number[], totalRecoveredMoney: number) => {
    if (!debtModalData) return;
    const { payer, debtAmount, totalRequiredAmount, recipient, onSuccess } = debtModalData;
    const fullAmount = totalRequiredAmount || (payer.money + debtAmount);

    // Reset sold cells
    setCells(prev => {
      const nextC = { ...prev };
      soldSpaceIds.forEach(id => {
        nextC[id] = {
          owner: null,
          buildings: { hasVilla: false, hasBuilding: false, hasHotel: false, isLandmark: false },
          currentToll: 0
        };
      });
      return nextC;
    });

    const totalMoneyAvailable = payer.money + totalRecoveredMoney;
    const remainingMoney = totalMoneyAvailable - fullAmount;

    const updatedPayer: Player = {
      ...payer,
      money: remainingMoney
    };

    const updatedRecipient: Player | null = recipient ? {
      ...recipient,
      money: recipient.money + fullAmount
    } : null;

    soundManager.playCashGain();
    addLog(payer.id, `🏬 ${payer.name}가 소유 도시 ${soldSpaceIds.length}개를 매각하여 +${totalRecoveredMoney}만 원을 확보하고 전액 완납했습니다.`, 'event');
    triggerBroadcast({
      category: 'purchase',
      playerId: payer.id,
      playerName: payer.name,
      playerColor: payer.color,
      isAI: payer.isAI,
      title: `🏬 [소유 도시 ${soldSpaceIds.length}개 긴급 매각]`,
      detail: `매각 환급금 ${totalRecoveredMoney}만 원으로 부족금을 마련하여 전액 완납했습니다.`,
      badge: `매각 +${totalRecoveredMoney}만`,
      badgeColor: 'amber'
    });

    onSuccess(updatedPayer, updatedRecipient);
  };

  // Voluntary bankruptcy from EmergencyDebtModal
  const handleVoluntaryBankruptcy = () => {
    if (!debtModalData) return;
    const { payer } = debtModalData;
    setActiveModal(null);
    setDebtModalData(null);

    setPlayers(prev => {
      const next = prev.map(p => p.id === payer.id ? { ...p, money: -1 } : p);
      checkGameOver(next);
      return updateTotalAssets(next, cellsRef.current);
    });

    const currentSeq = turnSeqRef.current;
    registerTimer(() => endTurn(false, currentSeq), speedConfig.modalActionDelayMs, currentSeq);
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
        executeUniversalPayment({
          payer: activePlayer,
          totalAmount: loss,
          recipient: null,
          reasonTitle: `황금열쇠 [${card.title}]`,
          reasonText: `황금열쇠 [${card.title}] 납부 비용 ${loss}만 원 중 ${Math.max(0, loss - activePlayer.money)}만 원 부족`,
          category: 'golden_key',
          currentTurnSeq: seq
        });
        return;
      }
      case 'donation': {
        const donation = card.amount || 15;
        executeUniversalPayment({
          payer: activePlayer,
          totalAmount: donation,
          recipient: null,
          reasonTitle: `황금열쇠 [${card.title}] 기금 후원`,
          reasonText: `황금열쇠 [${card.title}] 후원금 ${donation}만 원 중 ${Math.max(0, donation - activePlayer.money)}만 원 부족`,
          category: 'golden_key',
          isSocialFundDonation: true,
          currentTurnSeq: seq
        });
        return;
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
        addLog(activePlayer.id, `🛶 [무인도 탈출권] 1장을 획득하여 인벤토리에 보관했습니다! (보유: ${activePlayer.hasIslandEscapeCard + 1}장)`, 'golden_key');
        triggerBroadcast({
          category: 'golden_key',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          isAI: activePlayer.isAI,
          title: `🛶 [무인도 탈출권] 인벤토리 보관 완료!`,
          detail: '무인도 조난 시 [탈출권 사용] 버튼을 눌러 소모 없이 즉시 탈출할 수 있습니다.',
          badge: '탈출권 +1 보관',
          badgeColor: 'purple'
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

      // If AI has space travel queued, warp directly without rolling dice!
      if (activePlayer.spaceTravelQueued) {
        const target = decideAISpaceTravelDestination(BOARD_SPACES, cellsRef.current, activePlayer, playersRef.current);
        warpToDestination(target, currentSeq);
        return;
      }

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
    doubleCountRef.current = 0;
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setGameLogs([]);
    const totalCount = newConfig.humanCount + newConfig.aiCount;
    addLog(0, `🎮 [인간 ${newConfig.humanCount}명${newConfig.aiCount > 0 ? ` + AI ${newConfig.aiCount}명` : ''} (총 ${totalCount}인)] 모드가 적용되었습니다.`, 'event');
  };

  // Start Game from setup screen
  const handleStartGameFromSetup = (
    config: GameModeConfig, 
    names: string[], 
    airplaneColors: AirplaneColorId[]
  ) => {
    clearAllGameTimers();
    turnSeqRef.current++;
    setGameConfig(config);
    setCustomNames(names);
    setCustomAirplaneColors(airplaneColors);

    const newPlayers = createPlayersForMode(
      config.humanCount, 
      config.aiCount, 
      INITIAL_MONEY, 
      names, 
      airplaneColors
    );
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
    doubleCountRef.current = 0;
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setGameLogs([]);

    // Initialize timer countdown if set
    if (config.timeLimitMinutes) {
      setRemainingSeconds(config.timeLimitMinutes * 60);
    } else {
      setRemainingSeconds(null);
    }

    const totalCount = config.humanCount + config.aiCount;
    const humanNamesStr = names.join(', ');
    const speedLabel = config.speed === 'slow' ? '느림 (여유로움)' : config.speed === 'fast' ? '빠르게 (스피드)' : '보통 (추천)';
    const timeLabel = config.timeLimitMinutes ? `${config.timeLimitMinutes}분` : '무제한';
    addLog(0, `🎲 [${humanNamesStr}] 님이 참여하는 부루마블 게임이 시작되었습니다! (총 ${totalCount}인, 속도: ${speedLabel}, 제한시간: ${timeLabel})`, 'event');

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
    const newPlayers = createPlayersForMode(
      gameConfig.humanCount, 
      gameConfig.aiCount, 
      INITIAL_MONEY, 
      customNames,
      customAirplaneColors
    );
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
    doubleCountRef.current = 0;
    setIsRolling(false);
    setIsTumbling(false);
    setIsTurnBusy(false);
    setGameLogs([]);

    if (gameConfig.timeLimitMinutes) {
      setRemainingSeconds(gameConfig.timeLimitMinutes * 60);
    } else {
      setRemainingSeconds(null);
    }

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
    setDebtModalData(null);
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
    <div className="min-h-screen w-full bg-[#08120a] text-slate-100 flex flex-col items-center justify-start lg:justify-center p-2 sm:p-3 overflow-x-hidden relative">
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
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center lg:items-center justify-center gap-3 sm:gap-6 z-10">
        {/* Left / Center Area: Board */}
        <main className="w-full flex-1 flex flex-col items-center justify-center">
          <Board
            spaces={BOARD_SPACES}
            cells={cells}
            players={players}
            activePlayerIndex={activePlayerIndex}
            onRollDice={triggerDiceRoll}
            onSpaceTravel={handleStartSpaceTravel}
            isRolling={isRolling}
            isTumbling={isTumbling}
            isDiceDisabled={isTurnBusy || isRolling || isTumbling || activePlayer.isAI || activeModal !== null}
            currentDice={currentDice}
            isDouble={isDouble}
            highlightedCellId={activePlayer.pos}
            isDestinationSelectionActive={activeModal === 'space_travel'}
            gameSpeed={currentSpeed}
            broadcast={boardBroadcast}
            onOpenIslandModal={() => setActiveModal('island')}
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
          remainingSeconds={remainingSeconds}
          onRepayDebt={handleRepayDebt}
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

      {/* 3. Emergency Debt & Property Sale Modal (Rescue mechanism) */}
      {activeModal === 'debt' && debtModalData && (
        <EmergencyDebtModal
          payer={debtModalData.payer}
          debtAmount={debtModalData.debtAmount}
          totalRequiredAmount={debtModalData.totalRequiredAmount}
          recipient={debtModalData.recipient}
          reasonText={debtModalData.reasonText}
          spaces={BOARD_SPACES}
          cells={cells}
          onTakeLoan={handleConfirmLoan}
          onSellProperties={handleConfirmSellProperties}
          onBankrupt={handleVoluntaryBankruptcy}
        />
      )}

      {/* 4. Golden Key Modal */}
      {activeModal === 'golden_key' && currentGoldenKey && (
        <GoldenKeyModal
          card={currentGoldenKey}
          onConfirm={() => applyGoldenKey()}
        />
      )}

      {/* 5. Space Travel Modal */}
      {activeModal === 'space_travel' && (
        <SpaceTravelModal
          spaces={BOARD_SPACES}
          cells={cells}
          player={activePlayer}
          onSelectDestination={(destPos) => warpToDestination(destPos)}
        />
      )}

      {/* 6. Game Over / Victory Modal */}
      {activeModal === 'game_over' && gameOverData && (
        <GameOverModal
          winner={gameOverData.winner}
          rankings={gameOverData.rankings}
          reason={gameOverData.reason}
          onRestart={resetGame}
          onExitToLobby={handleExitToLobby}
        />
      )}

      {/* 7. Start Tile Remote Upgrade Modal */}
      {activeModal === 'start_upgrade' && !activePlayer.isAI && (
        <StartUpgradeModal
          spaces={BOARD_SPACES}
          cells={cells}
          player={activePlayer}
          onConfirmUpgrade={(spaceId, newBuildings, cost) => handleConfirmStartUpgrade(spaceId, newBuildings, cost)}
          onSkip={() => {
            const currentSeq = turnSeqRef.current;
            addLog(activePlayer.id, `🏁 ${activePlayer.name}가 출발점 원격 증축 기회를 건너뛰었습니다.`, 'event');
            triggerBroadcast({
              category: 'pass',
              playerId: activePlayer.id,
              playerName: activePlayer.name,
              playerColor: activePlayer.color,
              isAI: activePlayer.isAI,
              title: `⏭️ [출발점] 원격 증축 건너뜀 (패스)`,
              detail: `${activePlayer.name}님이 출발점 추가 증축 기회를 보류했습니다.`,
              badge: '증축 보류',
              badgeColor: 'slate'
            });
            setActiveModal(null);
            registerTimer(() => endTurn(isDouble, currentSeq), speedConfig.modalActionDelayMs, currentSeq);
          }}
        />
      )}

      {/* 8. Island Trapped Escape Action Modal */}
      {activeModal === 'island' && !activePlayer.isAI && activePlayer.islandTurnsLeft > 0 && (
        <IslandModal
          player={activePlayer}
          onUseEscapeCard={() => handleUseIslandEscapeCard(activePlayer)}
          onPayEscapeFee={() => handlePayIslandBail(activePlayer)}
          onTryDouble={handleTryIslandDouble}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
