import type { EventStatus } from "../types/domain";

export const SITE_NAME = "MyHalftimeQuiz.com";

export const BRAND_ASSETS = {
  logo: "/HQ25_logo.png",
  loginBackground: "/sports-login-bg.png",
  splashVideo: "/splash.mp4",
  icons: {
    soccer: "/icons/soccer.png",
    football: "/icons/football.png",
    basketball: "/icons/basketball.png",
    hockey: "/icons/hockey.png",
    rugby: "/icons/rugby.png",
    cricket: "/icons/cricket.png",
  },
} as const;

export const COLLECTIONS = {
  users: "users",
  sports: "sports",
  leagues: "leagues",
  teams: "teams",
  stadiums: "stadiums",
  events: "events",
  questions: "questions",
  quizResults: "quizResults",
  leaderboards: "leaderboards",
  ads: "ads",
  adminSettings: "adminSettings",
  eventQuestions: "eventQuestions",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const PUBLIC_ROUTES = {
  home: "/",
  login: "/login",
  choose: "/choose",
  sports: "/sports",
  quiz: "/quiz",
  results: "/results",
  leaderboard: "/leaderboard",
} as const;

export const ADMIN_ROUTES = {
  home: "/admin",
  login: "/admin/login",
  sports: "/admin/sports",
  leagues: "/admin/leagues",
  teams: "/admin/teams",
  stadiums: "/admin/stadiums",
  events: "/admin/events",
  questions: "/admin/questions",
  ads: "/admin/ads",
  results: "/admin/results",
  leaderboards: "/admin/leaderboards",
  users: "/admin/users",
  settings: "/admin/settings",
  games: "/admin/games",
  quizzes: "/admin/quizzes",
} as const;

export const DEFAULTS = {
  questionCount: 12,
  countdownSeconds: 10,
  soccerQuizOffsetMinutes: 47,
  quizWindowDurationMinutes: 18,
  leaderboardTopEntries: 25,
} as const;

export const PUBLIC_EVENT_STATUSES: EventStatus[] = [
  "upcoming",
  "liveSoon",
  "active",
];

export const ADMIN_NAV_SECTIONS = [
  { label: "Dashboard", href: ADMIN_ROUTES.home },
  { label: "Sports", href: ADMIN_ROUTES.sports },
  { label: "Leagues", href: ADMIN_ROUTES.leagues },
  { label: "Teams", href: ADMIN_ROUTES.teams },
  { label: "Stadiums", href: ADMIN_ROUTES.stadiums },
  { label: "Events", href: ADMIN_ROUTES.events },
  { label: "Questions", href: ADMIN_ROUTES.questions },
  { label: "Ads", href: ADMIN_ROUTES.ads },
  { label: "Results", href: ADMIN_ROUTES.results },
  { label: "Leaderboards", href: ADMIN_ROUTES.leaderboards },
  { label: "Users", href: ADMIN_ROUTES.users },
  { label: "Settings", href: ADMIN_ROUTES.settings },
] as const;
