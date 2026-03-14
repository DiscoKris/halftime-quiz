export type UserRole = "user" | "admin" | "superadmin";

export type EventStatus =
  | "draft"
  | "upcoming"
  | "liveSoon"
  | "active"
  | "expired"
  | "archived";

export type QuestionSourceType = "team" | "league" | "sport";

export type Difficulty = "easy" | "medium" | "hard";

export type AdMediaType = "image" | "video";

export type AdStatus = "draft" | "active" | "paused" | "archived";

export type FirestoreDateValue =
  | Date
  | string
  | number
  | {
      seconds: number;
      nanoseconds?: number;
      toDate?: () => Date;
    }
  | null
  | undefined;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AuditFields {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface User extends AuditFields {
  uid: string;
  email: string;
  username: string;
  city?: string;
  state?: string;
  country?: string;
  role: UserRole;
  isPaid: boolean;
  isActive: boolean;
  lastLoginAt?: Date | null;
}

export interface Sport extends AuditFields {
  id: string;
  name: string;
  slug: string;
  defaultQuizOffsetMinutes: number;
  defaultQuestionCount: number;
  isActive: boolean;
}

export interface League extends AuditFields {
  id: string;
  name: string;
  slug: string;
  sportId: string;
  sportName: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Team extends AuditFields {
  id: string;
  name: string;
  slug: string;
  shortName?: string;
  sportId: string;
  sportName: string;
  leagueId: string;
  leagueName: string;
  city?: string;
  nickname?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
}

export interface Stadium extends AuditFields {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  country: string;
  timezone: string;
  address?: string;
  geo?: GeoPoint;
  sportIds: string[];
  leagueIds: string[];
  imageUrl?: string;
  isActive: boolean;
}

export interface EventQuestionSources {
  useHomeTeam: boolean;
  useAwayTeam: boolean;
  useLeaguePool?: boolean;
  useSportPool?: boolean;
}

export interface Event extends AuditFields {
  id: string;
  title: string;
  slug: string;
  sportId: string;
  sportName: string;
  leagueId: string;
  leagueName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  stadiumId: string;
  stadiumName: string;
  kickoffTime: Date;
  halftimeOffsetMinutes: number;
  quizStartTime: Date;
  quizEndTime: Date;
  status: EventStatus;
  questionCount: number;
  countdownSeconds: number;
  questionSources: EventQuestionSources;
  adIds: string[];
  allowQuizPlay: boolean;
  resultWriteEnabled: boolean;
  leaderboardReadEnabled: boolean;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
}

export interface Question extends AuditFields {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  sourceType: QuestionSourceType;
  sourceId: string;
  sourceName: string;
  sportId: string;
  sportName: string;
  leagueId?: string;
  leagueName?: string;
  teamId?: string;
  teamName?: string;
  difficulty?: Difficulty;
  category?: string;
  isActive: boolean;
}

export interface EventQuestion {
  id: string;
  originalQuestionId: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  sourceType: QuestionSourceType;
  sourceId: string;
  sourceName: string;
  sortOrder: number;
  createdAt?: Date | null;
}

export interface QuizResult extends AuditFields {
  id: string;
  eventId: string;
  sportId: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  userId: string;
  username: string;
  score: number;
  timeSeconds: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: Date;
  city?: string;
  adViewed: boolean;
  adSkipped: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  timeSeconds: number;
  completedAt: Date;
  city?: string;
}

export interface Leaderboard extends AuditFields {
  eventId: string;
  title: string;
  topEntries: LeaderboardEntry[];
  playerCount: number;
  lastUpdated: Date;
  version: number;
}

export interface Ad extends AuditFields {
  id: string;
  title: string;
  sponsorName: string;
  mediaType: AdMediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  clickUrl?: string;
  durationSeconds: number;
  skippableAfterSeconds: number;
  status: AdStatus;
  assignedEventIds: string[];
  assignedLeagueIds: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
}
