import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  loadUser,
  saveUser,
  loadTotalPoints,
  saveTotalPoints,
  loadHistory,
  addHistoryEntry,
} from '../utils/storage';

const AppContext = createContext(null);

const initialState = {
  user: {
    id: 'USR-001',
    name: 'Estudiante',
    university: 'Universidad',
    career: 'Ingeniería',
    avatar: null,
    level: 1,
  },
  totalPoints: 0,
  sessionPoints: 0,
  activeSession: null, // { machineId, machineName, startTime, pointsPerSecond }
  history: [],
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        user: action.user || state.user,
        totalPoints: action.totalPoints,
        history: action.history,
        loading: false,
      };

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'START_SESSION':
      return {
        ...state,
        activeSession: action.payload,
        sessionPoints: 0,
      };

    case 'TICK_SESSION':
      return {
        ...state,
        sessionPoints: state.sessionPoints + (state.activeSession?.pointsPerSecond || 0),
      };

    case 'END_SESSION': {
      const earned = Math.round(state.sessionPoints);
      const newTotal = state.totalPoints + earned;
      const level = Math.floor(newTotal / 500) + 1;
      return {
        ...state,
        totalPoints: newTotal,
        sessionPoints: 0,
        activeSession: null,
        history: action.history,
        user: { ...state.user, level },
      };
    }

    case 'ADD_POINTS':
      return { ...state, totalPoints: state.totalPoints + action.amount };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const user = await loadUser();
      const totalPoints = await loadTotalPoints();
      const history = await loadHistory();
      dispatch({ type: 'INIT', user, totalPoints, history });
    })();
  }, []);

  async function updateUser(fields) {
    const updated = { ...state.user, ...fields };
    await saveUser(updated);
    dispatch({ type: 'UPDATE_USER', payload: fields });
  }

  function startSession(machine) {
    dispatch({
      type: 'START_SESSION',
      payload: {
        machineId: machine.id,
        machineName: machine.name,
        machineType: machine.type,
        startTime: Date.now(),
        pointsPerSecond: machine.pointsPerSecond,
      },
    });
  }

  function tickSession() {
    dispatch({ type: 'TICK_SESSION' });
  }

  async function endSession() {
    const earned = Math.round(state.sessionPoints);
    const duration = Math.round((Date.now() - state.activeSession.startTime) / 1000);
    const entry = {
      id: Date.now(),
      machineId: state.activeSession.machineId,
      machineName: state.activeSession.machineName,
      machineType: state.activeSession.machineType,
      points: earned,
      duration,
      date: new Date().toISOString(),
    };
    const history = await addHistoryEntry(entry);
    const newTotal = state.totalPoints + earned;
    await saveTotalPoints(newTotal);
    dispatch({ type: 'END_SESSION', history });
    return entry;
  }

  return (
    <AppContext.Provider value={{ state, updateUser, startSession, tickSession, endSession }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
