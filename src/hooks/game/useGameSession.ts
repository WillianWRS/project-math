import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type SetStateAction,
} from "react";
import {
  clearAnswerFlash,
  clearLevelUpFlash,
  createInitialSession,
  setInputValue as applyInputToSession,
  SUBMIT_LOCK_MS,
  unlockSubmit,
} from "../../engine/game-state-machine";
import type { GameSession } from "../../engine/types";

const ANSWER_FLASH_DURATION_MS = 560;
const LEVEL_UP_FLASH_DURATION_MS = 1200;

type SessionAction = { type: "session"; action: SetStateAction<GameSession> };

function sessionReducer(state: GameSession, action: SessionAction): GameSession {
  const next =
    typeof action.action === "function"
      ? (action.action as (current: GameSession) => GameSession)(state)
      : action.action;
  return next === state ? state : next;
}

export interface GameSessionController {
  session: GameSession;
  /** Valor exibido no teclado — alias de `session.inputValue` (fonte única). */
  inputValue: string;
  setSession: (action: SetStateAction<GameSession>) => void;
  /** Atualiza `session.inputValue` via engine. */
  setInputValue: (value: string) => void;
  /** Filtra dígitos (máx. 2) e persiste em `session.inputValue`. */
  onInputChange: (value: string) => void;
  sessionRef: React.MutableRefObject<GameSession>;
  /** Espelho síncrono de `session.inputValue` para handlers imediatos. */
  inputValueRef: React.MutableRefObject<string>;
}

/**
 * Dono do estado central da partida. O input do teclado vive exclusivamente em
 * `session.inputValue` — não há estado React paralelo nem heurística de sync.
 */
export function useGameSession(): GameSessionController {
  const [session, dispatch] = useReducer(
    sessionReducer,
    undefined,
    createInitialSession,
  );
  const sessionRef = useRef(session);
  const inputValueRef = useRef(session.inputValue);

  const setSession = useCallback((action: SetStateAction<GameSession>) => {
    dispatch({
      type: "session",
      action: (current) => {
        const next =
          typeof action === "function"
            ? (action as (current: GameSession) => GameSession)(current)
            : action;
        if (next !== current) {
          sessionRef.current = next;
          inputValueRef.current = next.inputValue;
        }
        return next;
      },
    });
  }, []);

  const setInputValue = useCallback(
    (value: string) => {
      setSession((current) => applyInputToSession(current, value));
    },
    [setSession],
  );

  const onInputChange = useCallback(
    (value: string) => {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 2);
      setSession((current) => applyInputToSession(current, digitsOnly));
    },
    [setSession],
  );

  useEffect(() => {
    sessionRef.current = session;
    inputValueRef.current = session.inputValue;
  }, [session]);

  useEffect(() => {
    if (!session.isSubmitLocked) return;
    const timeout = window.setTimeout(() => {
      setSession((current) => unlockSubmit(current));
    }, SUBMIT_LOCK_MS);
    return () => window.clearTimeout(timeout);
  }, [session.isSubmitLocked, setSession]);

  useEffect(() => {
    if (session.answerFlash === null) return;
    const timeout = window.setTimeout(() => {
      setSession((current) => clearAnswerFlash(current));
    }, ANSWER_FLASH_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [session.answerFlash, setSession]);

  useEffect(() => {
    if (session.rhythmLevelUpFlash === null) return;
    const timeout = window.setTimeout(() => {
      setSession((current) => clearLevelUpFlash(current));
    }, LEVEL_UP_FLASH_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [session.rhythmLevelUpFlash, setSession]);

  return {
    session,
    inputValue: session.inputValue,
    setSession,
    setInputValue,
    onInputChange,
    sessionRef,
    inputValueRef,
  };
}
