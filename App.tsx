import { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];

// ─── Constants ───────────────────────────────────────────────────────────────

const WINNING_LINES: [number, number, number][] = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

const EMPTY_BOARD: Board = [null, null, null, null, null, null, null, null, null];

const COLORS = {
  bg: '#000000',
  bgCell: '#0A0A0A',
  neon: '#00FF41',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  yellow: '#FFE600',
  white: '#FFFFFF',
  dimGreen: '#004D14',
  border: '#00FF41',
};

const FONT = Platform.select({ ios: 'Courier New', android: 'monospace' }) ?? 'Courier New';

// ─── Helper ───────────────────────────────────────────────────────────────────

function calculateWinner(board: Board): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

// ─── Cell Component ───────────────────────────────────────────────────────────

interface CellProps {
  value: Cell;
  index: number;
  onPress: (index: number) => void;
  disabled: boolean;
  isWinning: boolean;
}

function GameCell({ value, index, onPress, disabled, isWinning }: CellProps) {
  const color =
    value === 'X' ? COLORS.magenta : value === 'O' ? COLORS.cyan : 'transparent';

  const cellStyle = [
    styles.cell,
    isWinning && styles.cellWinning,
  ];

  return (
    <TouchableOpacity
      style={cellStyle}
      onPress={() => onPress(index)}
      disabled={disabled || value !== null}
      activeOpacity={0.6}
    >
      <Text style={[styles.cellText, { color }]}>{value ?? ''}</Text>
    </TouchableOpacity>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winningCells, setWinningCells] = useState<number[]>([]);

  const blinkAnim = useRef(new Animated.Value(1)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;

  // Title blink loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [blinkAnim]);

  // Status slide-in on change
  useEffect(() => {
    statusAnim.setValue(0);
    Animated.spring(statusAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [board]);

  const winner = calculateWinner(board);
  const isDraw = !winner && isBoardFull(board);
  const gameOver = Boolean(winner) || isDraw;

  function handlePress(index: number): void {
    if (gameOver || board[index]) return;

    const next: Board = [...board] as Board;
    next[index] = isXNext ? 'X' : 'O';

    const newWinner = calculateWinner(next);
    if (newWinner) {
      const line = WINNING_LINES.find(
        ([a, b, c]) => next[a] === newWinner && next[b] === newWinner && next[c] === newWinner
      );
      setWinningCells(line ?? []);
    }

    setBoard(next);
    setIsXNext((prev) => !prev);
  }

  function resetGame(): void {
    setBoard(EMPTY_BOARD);
    setIsXNext(true);
    setWinningCells([]);
  }

  // Status message
  let statusText: string;
  let statusColor: string;
  if (winner) {
    statusText = `** PLAYER ${winner} WINS! **`;
    statusColor = winner === 'X' ? COLORS.magenta : COLORS.cyan;
  } else if (isDraw) {
    statusText = '** DRAW — INSERT COIN **';
    statusColor = COLORS.yellow;
  } else {
    statusText = `PLAYER ${isXNext ? 'X' : 'O'} — YOUR TURN`;
    statusColor = isXNext ? COLORS.magenta : COLORS.cyan;
  }

  const statusSlide = statusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Title */}
      <Animated.Text style={[styles.title, { opacity: blinkAnim }]}>
        {'★  TIC TAC TOE  ★'}
      </Animated.Text>
      <Text style={styles.subtitle}>{'[ ARCADE EDITION ]'}</Text>

      {/* Status */}
      <Animated.Text
        style={[
          styles.status,
          { color: statusColor, opacity: statusAnim, transform: [{ translateY: statusSlide }] },
        ]}
      >
        {statusText}
      </Animated.Text>

      {/* Board */}
      <View style={styles.board}>
        {board.map((cell, i) => (
          <GameCell
            key={i}
            value={cell}
            index={i}
            onPress={handlePress}
            disabled={gameOver}
            isWinning={winningCells.includes(i)}
          />
        ))}
      </View>

      {/* Reset button */}
      <TouchableOpacity style={styles.resetButton} onPress={resetGame} activeOpacity={0.7}>
        <Text style={styles.resetText}>{'[ NEW GAME ]'}</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>{'© 1984  OPENCODE SYSTEMS'}</Text>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CELL_SIZE = 96;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.yellow,
    letterSpacing: 4,
    marginBottom: 4,
    textShadowColor: COLORS.yellow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: 11,
    color: COLORS.dimGreen,
    letterSpacing: 6,
    marginBottom: 28,
  },
  status: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 24,
    textAlign: 'center',
  },
  board: {
    width: CELL_SIZE * 3 + 12, // 3 cells + 2 gaps
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 36,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: COLORS.bgCell,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWinning: {
    backgroundColor: '#001A07',
    borderColor: COLORS.yellow,
    borderWidth: 3,
  },
  cellText: {
    fontFamily: FONT,
    fontSize: 48,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    textShadowColor: 'currentColor',
  },
  resetButton: {
    borderWidth: 2,
    borderColor: COLORS.neon,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 32,
  },
  resetText: {
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.neon,
    letterSpacing: 3,
  },
  footer: {
    fontFamily: FONT,
    fontSize: 10,
    color: '#1A3A1A',
    letterSpacing: 2,
    position: 'absolute',
    bottom: 20,
  },
});
