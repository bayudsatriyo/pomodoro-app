/**
 * localStorage utilities for client-side data persistence
 * This replaces database for Phase 1 testing
 */

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  focusScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthEvent {
  id: string;
  type: string;
  timestamp: string;
  acknowledged: boolean;
  message?: string;
  createdAt: string;
}

export interface AiMemory {
  id: string;
  category: string;
  content: string;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  SESSIONS: "pomodoro_sessions",
  HEALTH_EVENTS: "pomodoro_health_events",
  AI_MEMORY: "pomodoro_ai_memory",
};

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Sessions
export function saveSessions(sessions: Session[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function createSession(startTime: string): Session {
  const session: Session = {
    id: generateId(),
    startTime,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);

  return session;
}

export function updateSession(
  id: string,
  updates: Partial<Session>
): Session | null {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === id);

  if (index === -1) return null;

  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveSessions(sessions);
  return sessions[index];
}

// Health Events
export function saveHealthEvents(events: HealthEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.HEALTH_EVENTS, JSON.stringify(events));
}

export function getHealthEvents(): HealthEvent[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.HEALTH_EVENTS);
  return data ? JSON.parse(data) : [];
}

export function createHealthEvent(type: string, message?: string): HealthEvent {
  const event: HealthEvent = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    message,
    createdAt: new Date().toISOString(),
  };

  const events = getHealthEvents();
  events.push(event);
  saveHealthEvents(events);

  return event;
}

export function acknowledgeHealthEvent(id: string): HealthEvent | null {
  const events = getHealthEvents();
  const index = events.findIndex((e) => e.id === id);

  if (index === -1) return null;

  events[index].acknowledged = true;
  saveHealthEvents(events);

  return events[index];
}

// AI Memory
export function saveAiMemory(memories: AiMemory[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.AI_MEMORY, JSON.stringify(memories));
}

export function getAiMemory(): AiMemory[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.AI_MEMORY);
  return data ? JSON.parse(data) : [];
}

export function createAiMemory(
  category: string,
  content: string,
  confidenceScore: number = 0.7
): AiMemory {
  const memory: AiMemory = {
    id: generateId(),
    category,
    content,
    confidenceScore,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const memories = getAiMemory();
  memories.push(memory);
  saveAiMemory(memories);

  return memory;
}
