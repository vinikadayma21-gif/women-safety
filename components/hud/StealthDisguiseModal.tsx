"use client";

/**
 * StealthDisguiseModal
 * A fully functional calculator overlay that disguises the SafeCity app
 * in uncomfortable or threatening situations.
 *
 * Triggered by: triple-tapping the header logo.
 * Deactivated by: entering the PIN "1234" then "=" on the disguised calculator.
 *
 * Features:
 * - Looks and operates exactly like a standard iOS-style calculator
 * - Background GPS tracking continues silently while active
 * - Entering "1234" + "=" exits stealth mode and returns to the map
 */

import { useState, useCallback, useEffect } from "react";

interface StealthDisguiseModalProps {
  /** Whether the disguise is currently active */
  isActive: boolean;
  /** Called when the user successfully exits stealth mode (enters PIN + =) */
  onExit: () => void;
}

// The hidden exit PIN sequence
const EXIT_PIN = "1234";

type CalcKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "%" | "+/-"
  | "+" | "-" | "×" | "÷"
  | "=" | "AC" | "C";

interface CalcState {
  display: string;
  stored: number | null;
  operator: string | null;
  waitingForOperand: boolean;
  expressionStr: string; // tracks concatenated digits for PIN check
}

const INITIAL_STATE: CalcState = {
  display: "0",
  stored: null,
  operator: null,
  waitingForOperand: false,
  expressionStr: "",
};

const BUTTON_LAYOUT: CalcKey[][] = [
  ["AC", "+/-", "%", "÷"],
  ["7",  "8",  "9",  "×"],
  ["4",  "5",  "6",  "-"],
  ["1",  "2",  "3",  "+"],
  ["0",  ".",  "="],
];

export default function StealthDisguiseModal({
  isActive,
  onExit,
}: StealthDisguiseModalProps) {
  const [calc, setCalc] = useState<CalcState>(INITIAL_STATE);
  const [showExitHint, setShowExitHint] = useState(false);

  // Reset calculator when modal opens
  useEffect(() => {
    if (isActive) {
      setCalc(INITIAL_STATE);
      setShowExitHint(false);
    }
  }, [isActive]);

  const evaluate = useCallback(
    (a: number, b: number, op: string): number => {
      switch (op) {
        case "+": return a + b;
        case "-": return a - b;
        case "×": return a * b;
        case "÷": return b !== 0 ? a / b : 0;
        default: return b;
      }
    },
    []
  );

  const handleKey = useCallback(
    (key: CalcKey) => {
      setCalc((prev) => {
        const newState = { ...prev };

        switch (key) {
          case "AC":
            return INITIAL_STATE;

          case "C":
            return { ...INITIAL_STATE };

          case "+/-":
            return {
              ...prev,
              display: prev.display.startsWith("-")
                ? prev.display.slice(1)
                : "-" + prev.display,
            };

          case "%": {
            const val = parseFloat(prev.display);
            return {
              ...prev,
              display: String(val / 100),
              expressionStr: prev.expressionStr,
            };
          }

          case "+":
          case "-":
          case "×":
          case "÷": {
            const inputVal = parseFloat(prev.display);
            if (prev.operator && !prev.waitingForOperand) {
              const result = evaluate(prev.stored ?? inputVal, inputVal, prev.operator);
              return {
                ...prev,
                display: String(parseFloat(result.toFixed(10))),
                stored: result,
                operator: key,
                waitingForOperand: true,
              };
            }
            return {
              ...prev,
              stored: inputVal,
              operator: key,
              waitingForOperand: true,
            };
          }

          case "=": {
            const inputVal = parseFloat(prev.display);
            // ── Secret PIN check ──
            if (prev.expressionStr === EXIT_PIN) {
              // Delay so user sees the display briefly
              setTimeout(() => onExit(), 300);
              return { ...INITIAL_STATE, display: "0" };
            }
            if (prev.operator && prev.stored !== null) {
              const result = evaluate(prev.stored, inputVal, prev.operator);
              return {
                ...INITIAL_STATE,
                display: String(parseFloat(result.toFixed(10))),
              };
            }
            return prev;
          }

          case ".": {
            if (prev.waitingForOperand) {
              return { ...prev, display: "0.", waitingForOperand: false };
            }
            if (!prev.display.includes(".")) {
              return { ...prev, display: prev.display + "." };
            }
            return prev;
          }

          default: {
            // Digit
            if (prev.waitingForOperand) {
              return {
                ...prev,
                display: key,
                waitingForOperand: false,
                expressionStr: key,
              };
            }
            const updatedDisplay =
              prev.display === "0" ? key : prev.display + key;
            const updatedExpr = prev.expressionStr + key;
            return {
              ...prev,
              display: updatedDisplay,
              expressionStr: updatedExpr,
            };
          }
        }
      });
    },
    [evaluate, onExit]
  );

  // Keyboard support
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, CalcKey> = {
        "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
        "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
        "+": "+", "-": "-", "*": "×", "/": "÷", "=": "=",
        "Enter": "=", ".": ".", Escape: "AC", Backspace: "C",
        "%": "%",
      };
      const key = map[e.key];
      if (key) {
        e.preventDefault();
        handleKey(key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, handleKey]);

  // Show hint after 5 seconds of stealth mode being active
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => setShowExitHint(true), 5000);
    return () => clearTimeout(timer);
  }, [isActive]);

  if (!isActive) return null;

  const isOperator = (k: CalcKey) =>
    k === "+" || k === "-" || k === "×" || k === "÷";
  const isAction = (k: CalcKey) =>
    k === "AC" || k === "C" || k === "+/-" || k === "%";
  const isEquals = (k: CalcKey) => k === "=";
  const isWideZero = (k: CalcKey) => k === "0";

  function getBgColor(k: CalcKey): string {
    if (isAction(k)) return "rgba(165, 165, 165, 0.3)";
    if (isOperator(k) || isEquals(k)) return "#ff9500";
    return "rgba(51, 51, 51, 0.85)";
  }

  function getTextColor(k: CalcKey): string {
    if (isAction(k)) return "#fff";
    return "#fff";
  }

  return (
    <div
      id="safecity-stealth-calculator"
      role="application"
      aria-label="Calculator"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* ── Display ── */}
      <div
        aria-live="polite"
        aria-label={`Calculator display: ${calc.display}`}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          padding: "0 24px 16px",
          minHeight: "140px",
        }}
      >
        {/* Small hint */}
        {showExitHint && (
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.15)",
              marginBottom: "8px",
              fontFamily: "system-ui, sans-serif",
            }}
            aria-hidden="true"
          >
            Type 1234 then = to exit
          </p>
        )}
        <span
          style={{
            fontSize: calc.display.length > 9 ? "42px" : "72px",
            fontWeight: "200",
            color: "#fff",
            fontFamily:
              "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "-2px",
            lineHeight: 1,
            transition: "font-size 0.1s ease",
          }}
        >
          {parseFloat(Number(calc.display).toFixed(9)).toLocaleString("en-US", {
            maximumFractionDigits: 8,
          })}
        </span>
      </div>

      {/* ── Button Grid ── */}
      <div
        style={{
          padding: "0 12px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {BUTTON_LAYOUT.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            {row.map((key) => (
              <button
                key={key}
                id={`calc-btn-${key.replace(/[^a-zA-Z0-9]/g, "")}`}
                aria-label={key}
                onClick={() => handleKey(key)}
                style={{
                  flex: isWideZero(key) ? 2 : 1,
                  height: "75px",
                  borderRadius: "50px",
                  backgroundColor: getBgColor(key),
                  color: getTextColor(key),
                  border: "none",
                  fontSize: isAction(key) ? "20px" : "28px",
                  fontWeight: isAction(key) ? "600" : "400",
                  cursor: "pointer",
                  fontFamily:
                    "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isWideZero(key) ? "flex-start" : "center",
                  paddingLeft: isWideZero(key) ? "28px" : "0",
                  WebkitTapHighlightColor: "transparent",
                  transition: "opacity 0.1s ease",
                  // Operator buttons that are active get a highlighted ring
                  boxShadow:
                    calc.operator === key && calc.waitingForOperand
                      ? "0 0 0 2px #fff"
                      : "none",
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
                onTouchStart={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
                }}
                onTouchEnd={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
