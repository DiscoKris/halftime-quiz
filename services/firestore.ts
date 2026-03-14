import {
  addDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { COLLECTIONS, DEFAULTS, PUBLIC_EVENT_STATUSES } from "../lib/constants";
import {
  collectionRef,
  documentRef,
  eventQuestionsCollectionRef,
  toDate,
  withId,
} from "../lib/firestore";
import type {
  Ad,
  Event,
  EventQuestion,
  Leaderboard,
  League,
  Question,
  QuizResult,
  Sport,
  Stadium,
  Team,
  User,
} from "../types/domain";
import { buildFrozenEventQuestions } from "../utils/event-questions";
import {
  matchesQuestionFilters,
  normalizeQuestionOptions,
  type QuestionListFilters,
  validateQuestionPayload,
} from "../utils/questions";
import {
  buildLeaderboardSummary,
  createLeaderboardEntry,
  isResultLeaderboardCandidate,
  mergeLeaderboardEntries,
} from "../utils/leaderboards";
import { db } from "../lib/firebase/client";

async function listDocuments<T extends object>(
  collectionName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[] = [],
) {
  const snapshot = await getDocs(query(collectionRef(COLLECTIONS[collectionName]), ...constraints));
  return snapshot.docs.map((document) => withId(document.id, document.data() as T));
}

async function getDocument<T extends object>(
  collectionName: keyof typeof COLLECTIONS,
  documentId: string,
) {
  const snapshot = await getDoc(documentRef(COLLECTIONS[collectionName], documentId));
  if (!snapshot.exists()) {
    return null;
  }

  return withId(documentId, snapshot.data() as T);
}

async function createDocument<T extends object>(
  collectionName: keyof typeof COLLECTIONS,
  payload: T,
) {
  return addDoc(collectionRef(COLLECTIONS[collectionName]), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function updateDocument<T extends object>(
  collectionName: keyof typeof COLLECTIONS,
  documentId: string,
  payload: Partial<T>,
) {
  return updateDoc(documentRef(COLLECTIONS[collectionName], documentId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

function normalizeEvent(event: Event) {
  return {
    ...event,
    kickoffTime: toDate(event.kickoffTime) ?? new Date(),
    quizStartTime: toDate(event.quizStartTime) ?? new Date(),
    quizEndTime: toDate(event.quizEndTime) ?? new Date(),
    createdAt: toDate(event.createdAt),
    updatedAt: toDate(event.updatedAt),
  };
}

function normalizeQuestion(question: Question) {
  return {
    ...question,
    options: normalizeQuestionOptions(question.options),
    createdAt: toDate(question.createdAt),
    updatedAt: toDate(question.updatedAt),
  };
}

function normalizeEventQuestion(question: EventQuestion) {
  return {
    ...question,
    createdAt: toDate(question.createdAt),
  };
}

function normalizeQuizResult(result: QuizResult) {
  return {
    ...result,
    completedAt: toDate(result.completedAt) ?? new Date(),
    createdAt: toDate(result.createdAt),
    updatedAt: toDate(result.updatedAt),
  };
}

function prepareQuestionPayload(payload: Omit<Question, "id">) {
  const normalizedPayload: Omit<Question, "id"> = {
    ...payload,
    questionText: payload.questionText.trim(),
    options: normalizeQuestionOptions(payload.options),
    sourceId: payload.sourceId.trim(),
    sourceName: payload.sourceName.trim(),
    sportId: payload.sportId.trim(),
    sportName: payload.sportName.trim(),
    leagueId: payload.leagueId?.trim() || undefined,
    leagueName: payload.leagueName?.trim() || undefined,
    teamId: payload.teamId?.trim() || undefined,
    teamName: payload.teamName?.trim() || undefined,
    category: payload.category?.trim() || undefined,
    difficulty: payload.difficulty,
    isActive: payload.isActive,
  };
  const errors = validateQuestionPayload(normalizedPayload);

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return normalizedPayload;
}

export const sportsService = {
  listActive: () =>
    listDocuments<Sport>("sports", [where("isActive", "==", true), orderBy("name")]),
  listAll: () => listDocuments<Sport>("sports", [orderBy("name")]),
  getById: (sportId: string) => getDocument<Sport>("sports", sportId),
  create: (payload: Omit<Sport, "id">) => createDocument("sports", payload),
  update: (sportId: string, payload: Partial<Sport>) =>
    updateDocument("sports", sportId, payload),
};

export const leaguesService = {
  listActive: () =>
    listDocuments<League>("leagues", [where("isActive", "==", true), orderBy("name")]),
  listAll: () => listDocuments<League>("leagues", [orderBy("name")]),
  listBySport: (sportId: string) =>
    listDocuments<League>("leagues", [where("sportId", "==", sportId), orderBy("name")]),
  getById: (leagueId: string) => getDocument<League>("leagues", leagueId),
  create: (payload: Omit<League, "id">) => createDocument("leagues", payload),
  update: (leagueId: string, payload: Partial<League>) =>
    updateDocument("leagues", leagueId, payload),
};

export const teamsService = {
  listActive: () =>
    listDocuments<Team>("teams", [where("isActive", "==", true), orderBy("name")]),
  listAll: () => listDocuments<Team>("teams", [orderBy("name")]),
  listByLeague: (leagueId: string) =>
    listDocuments<Team>("teams", [where("leagueId", "==", leagueId), orderBy("name")]),
  getById: (teamId: string) => getDocument<Team>("teams", teamId),
  create: (payload: Omit<Team, "id">) => createDocument("teams", payload),
  update: (teamId: string, payload: Partial<Team>) =>
    updateDocument("teams", teamId, payload),
};

export const stadiumsService = {
  listActive: () =>
    listDocuments<Stadium>("stadiums", [where("isActive", "==", true), orderBy("name")]),
  listAll: () => listDocuments<Stadium>("stadiums", [orderBy("name")]),
  getById: (stadiumId: string) => getDocument<Stadium>("stadiums", stadiumId),
  create: (payload: Omit<Stadium, "id">) => createDocument("stadiums", payload),
  update: (stadiumId: string, payload: Partial<Stadium>) =>
    updateDocument("stadiums", stadiumId, payload),
};

export const eventsService = {
  listPublic: async () => {
    const events = await listDocuments<Event>("events", [
      where("allowQuizPlay", "==", true),
      where("status", "in", PUBLIC_EVENT_STATUSES),
      orderBy("quizStartTime"),
      limit(20),
    ]);
    return events.map(normalizeEvent).filter((event) => event.isActive !== false);
  },
  listAll: async () => {
    const events = await listDocuments<Event>("events", [orderBy("kickoffTime", "desc")]);
    return events.map(normalizeEvent);
  },
  getById: async (eventId: string) => {
    const event = await getDocument<Event>("events", eventId);
    return event ? normalizeEvent(event) : null;
  },
  create: (payload: Omit<Event, "id">) => createDocument("events", payload),
  update: (eventId: string, payload: Partial<Event>) =>
    updateDocument("events", eventId, payload),
  listEventQuestions: async (eventId: string) => {
    const snapshot = await getDocs(query(eventQuestionsCollectionRef<EventQuestion>(eventId), orderBy("sortOrder")));
    return snapshot.docs.map((document) =>
      normalizeEventQuestion(withId(document.id, document.data() as EventQuestion)),
    );
  },
  countEventQuestions: async (eventId: string) => {
    const snapshot = await getCountFromServer(query(eventQuestionsCollectionRef<EventQuestion>(eventId)));
    return snapshot.data().count;
  },
  hasSnapshot: async (eventId: string) => {
    const count = await eventsService.countEventQuestions(eventId);
    return count > 0;
  },
  getSnapshotStatus: async (eventId: string) => {
    const count = await eventsService.countEventQuestions(eventId);
    return {
      count,
      hasSnapshot: count > 0,
    };
  },
  buildSnapshot: (
    event: Pick<
      Event,
      | "sportId"
      | "leagueId"
      | "homeTeamId"
      | "awayTeamId"
      | "questionCount"
      | "questionSources"
    >,
    questions: Question[],
  ) =>
    buildFrozenEventQuestions(event, questions),
  writeSnapshot: async (eventId: string, snapshotQuestions: EventQuestion[]) => {
    const existingSnapshot = await getDocs(query(eventQuestionsCollectionRef<EventQuestion>(eventId)));
    const batch = writeBatch(db);

    existingSnapshot.docs.forEach((documentSnapshot) => {
      batch.delete(documentSnapshot.ref);
    });

    snapshotQuestions.forEach((question) => {
      const reference = doc(
        eventQuestionsCollectionRef<EventQuestion>(eventId),
        question.id,
      );
      batch.set(reference, {
        ...question,
        createdAt: question.createdAt ?? new Date(),
      });
    });

    await batch.commit();
  },
  generateSnapshot: async (eventId: string) => {
    const event = await eventsService.getById(eventId);

    if (!event) {
      throw new Error("Event not found.");
    }

    const sourceQuestions = await questionsService.listActiveForSnapshot(event);
    const snapshotBuild = eventsService.buildSnapshot(event, sourceQuestions);
    await eventsService.writeSnapshot(eventId, snapshotBuild.snapshotQuestions);

    return {
      count: snapshotBuild.snapshotQuestions.length,
      allocation: snapshotBuild.allocation,
    };
  },
};

export const questionsService = {
  listAll: async () => {
    const questions = await listDocuments<Question>("questions", [orderBy("updatedAt", "desc")]);
    return questions.map(normalizeQuestion);
  },
  list: async (filters: QuestionListFilters = {}) => {
    const questions = await questionsService.listAll();
    return questions.filter((question) => matchesQuestionFilters(question, filters));
  },
  listByTeam: async (teamId: string) => {
    const questions = await listDocuments<Question>("questions", [
      where("sourceType", "==", "team"),
      where("teamId", "==", teamId),
      orderBy("updatedAt", "desc"),
    ]);
    return questions.map(normalizeQuestion);
  },
  listByLeague: async (leagueId: string) => {
    const questions = await listDocuments<Question>("questions", [
      where("sourceType", "==", "league"),
      where("leagueId", "==", leagueId),
      orderBy("updatedAt", "desc"),
    ]);
    return questions.map(normalizeQuestion);
  },
  listBySport: async (sportId: string) => {
    const questions = await listDocuments<Question>("questions", [
      where("sourceType", "==", "sport"),
      where("sportId", "==", sportId),
      orderBy("updatedAt", "desc"),
    ]);
    return questions.map(normalizeQuestion);
  },
  listBySource: async (
    sourceType: Question["sourceType"],
    sourceId: string,
    options?: {
      isActive?: boolean;
    },
  ) => {
    const constraints: QueryConstraint[] = [
      where("sourceType", "==", sourceType),
      where("sourceId", "==", sourceId),
    ];

    if (typeof options?.isActive === "boolean") {
      constraints.push(where("isActive", "==", options.isActive));
    }

    const questions = await listDocuments<Question>("questions", constraints);
    return questions.map(normalizeQuestion);
  },
  listActiveForSnapshot: async (
    event: Pick<
      Event,
      | "sportId"
      | "leagueId"
      | "homeTeamId"
      | "awayTeamId"
      | "questionSources"
    >,
  ) => {
    const requests: Array<Promise<Question[]>> = [];

    if (event.questionSources.useHomeTeam) {
      requests.push(questionsService.listBySource("team", event.homeTeamId, { isActive: true }));
    }

    if (event.questionSources.useAwayTeam) {
      requests.push(questionsService.listBySource("team", event.awayTeamId, { isActive: true }));
    }

    if (event.questionSources.useLeaguePool) {
      requests.push(questionsService.listBySource("league", event.leagueId, { isActive: true }));
    }

    if (event.questionSources.useSportPool) {
      requests.push(questionsService.listBySource("sport", event.sportId, { isActive: true }));
    }

    const resultSets = await Promise.all(requests);
    const uniqueQuestions = new Map<string, Question>();

    resultSets.flat().forEach((question) => {
      uniqueQuestions.set(question.id, question);
    });

    return Array.from(uniqueQuestions.values());
  },
  getById: async (questionId: string) => {
    const question = await getDocument<Question>("questions", questionId);
    return question ? normalizeQuestion(question) : null;
  },
  create: async (payload: Omit<Question, "id">) =>
    createDocument("questions", prepareQuestionPayload(payload)),
  bulkCreate: async (payloads: Array<Omit<Question, "id">>) => {
    if (payloads.length === 0) {
      throw new Error("Add at least one question before saving a bulk import.");
    }

    const batch = writeBatch(db);

    payloads.map(prepareQuestionPayload).forEach((payload) => {
      const reference = doc(collectionRef(COLLECTIONS.questions));
      batch.set(reference, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return payloads.length;
  },
  update: (questionId: string, payload: Partial<Question>) =>
    updateDocument("questions", questionId, payload),
  save: async (questionId: string | null, payload: Omit<Question, "id">) => {
    const normalizedPayload = prepareQuestionPayload(payload);

    if (questionId) {
      await questionsService.update(questionId, normalizedPayload);
      return questionId;
    }

    const reference = await questionsService.create(normalizedPayload);
    return reference.id;
  },
  setActive: async (questionId: string, isActive: boolean) =>
    updateDocument("questions", questionId, { isActive }),
};

export const adsService = {
  listActive: () =>
    listDocuments<Ad>("ads", [where("status", "==", "active"), orderBy("startsAt", "desc")]),
  listByEvent: (eventId: string) =>
    listDocuments<Ad>("ads", [where("assignedEventIds", "array-contains", eventId)]),
  getById: (adId: string) => getDocument<Ad>("ads", adId),
  create: (payload: Omit<Ad, "id">) => createDocument("ads", payload),
  update: (adId: string, payload: Partial<Ad>) => updateDocument("ads", adId, payload),
};

export const quizResultsService = {
  listByEvent: async (eventId: string) => {
    const results = await listDocuments<QuizResult>("quizResults", [
      where("eventId", "==", eventId),
      orderBy("completedAt", "desc"),
      limit(100),
    ]);
    return results.map(normalizeQuizResult);
  },
  submit: async (payload: Omit<QuizResult, "id" | "createdAt" | "updatedAt">) => {
    return addDoc(collectionRef(COLLECTIONS.quizResults), {
      ...payload,
      completedAt: payload.completedAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  countByEvent: async (eventId: string) => {
    const snapshot = await getCountFromServer(
      query(collectionRef(COLLECTIONS.quizResults), where("eventId", "==", eventId)),
    );
    return snapshot.data().count;
  },
};

export const leaderboardsService = {
  getByEventId: (eventId: string) => getDocument<Leaderboard>("leaderboards", eventId),
  buildSummary: buildLeaderboardSummary,
  shouldIncludeResult: isResultLeaderboardCandidate,
  mergeEntry: mergeLeaderboardEntries,
  createEntry: createLeaderboardEntry,
  upsertSummary: async () => {
    throw new Error(
      "Client-side leaderboard writes are disabled. Rebuild leaderboards from trusted server infrastructure only.",
    );
  },
};

export const usersService = {
  getByUid: (uid: string) => getDocument<User>("users", uid),
  create: (uid: string, payload: Omit<User, "uid">) =>
    setDoc(documentRef(COLLECTIONS.users, uid), {
      uid,
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  upsertProfile: (uid: string, payload: Partial<User>) =>
    setDoc(
      documentRef(COLLECTIONS.users, uid),
      {
        uid,
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
  listAdmins: () =>
    listDocuments<User>("users", [where("role", "in", ["admin", "superadmin"])]),
};

export const dashboardService = {
  getAdminCounts: async () => {
    const [
      sports,
      leagues,
      teams,
      stadiums,
      events,
      questions,
      ads,
      users,
    ] = await Promise.all([
      getCountFromServer(collectionRef(COLLECTIONS.sports)),
      getCountFromServer(collectionRef(COLLECTIONS.leagues)),
      getCountFromServer(collectionRef(COLLECTIONS.teams)),
      getCountFromServer(collectionRef(COLLECTIONS.stadiums)),
      getCountFromServer(collectionRef(COLLECTIONS.events)),
      getCountFromServer(collectionRef(COLLECTIONS.questions)),
      getCountFromServer(collectionRef(COLLECTIONS.ads)),
      getCountFromServer(collectionRef(COLLECTIONS.users)),
    ]);

    return {
      sports: sports.data().count,
      leagues: leagues.data().count,
      teams: teams.data().count,
      stadiums: stadiums.data().count,
      events: events.data().count,
      questions: questions.data().count,
      ads: ads.data().count,
      users: users.data().count,
      defaultQuestionCount: DEFAULTS.questionCount,
    };
  },
};
