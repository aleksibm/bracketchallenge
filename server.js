import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");
const secretPath = path.join(dataDir, "session.secret");
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const MAX_BODY_SIZE = 1_000_000;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PLAYOFF_YEAR = Number.parseInt(process.env.PLAYOFF_YEAR ?? `${new Date().getFullYear()}`, 10);
const PLAYOFF_SYNC_TIME_ZONE = process.env.PLAYOFF_SYNC_TIME_ZONE ?? "Europe/Helsinki";
const PLAYOFF_SYNC_HOUR = 10;
const PLAYOFF_SYNC_MINUTE = 0;
const PLAYOFF_SYNC_CHECK_INTERVAL_MS = 60 * 1000;
const PLAYOFF_BRACKET_URL = `https://api-web.nhle.com/v1/playoff-bracket/${PLAYOFF_YEAR}`;
const PLAYOFF_SUBMISSION_LOCK_AT =
  process.env.PLAYOFF_SUBMISSION_LOCK_AT ?? "2026-04-18T15:00:00-04:00";
const PLAYOFF_SUBMISSION_LOCK_LABEL =
  process.env.PLAYOFF_SUBMISSION_LOCK_LABEL ?? "Ottawa Senators at Carolina Hurricanes Game 1";
const ROUND_ONE_SERIES = ["r1w1", "r1w2", "r1w3", "r1w4", "r1e1", "r1e2", "r1e3", "r1e4"];
const ALL_SERIES = [
  ...ROUND_ONE_SERIES,
  "r2w1",
  "r2w2",
  "r2e1",
  "r2e2",
  "wcf",
  "ecf",
  "final"
];
const SERIES_FLOW = {
  r2w1: ["r1w1", "r1w2"],
  r2w2: ["r1w3", "r1w4"],
  r2e1: ["r1e1", "r1e2"],
  r2e2: ["r1e3", "r1e4"],
  wcf: ["r2w1", "r2w2"],
  ecf: ["r2e1", "r2e2"],
  final: ["wcf", "ecf"]
};
const SERIES_ID_BY_LETTER = {
  A: "r1e1",
  B: "r1e2",
  C: "r1e3",
  D: "r1e4",
  E: "r1w3",
  F: "r1w4",
  G: "r1w1",
  H: "r1w2",
  I: "r2e1",
  J: "r2e2",
  K: "r2w2",
  L: "r2w1",
  M: "ecf",
  N: "wcf",
  O: "final"
};
const SERIES_POINTS = {
  r1w1: 1,
  r1w2: 1,
  r1w3: 1,
  r1w4: 1,
  r1e1: 1,
  r1e2: 1,
  r1e3: 1,
  r1e4: 1,
  r2w1: 2,
  r2w2: 2,
  r2e1: 2,
  r2e2: 2,
  wcf: 4,
  ecf: 4,
  final: 8
};
const SERIES_LABELS = {
  r1w1: "Pacific Series A",
  r1w2: "Pacific Series B",
  r1w3: "Central Series A",
  r1w4: "Central Series B",
  r1e1: "Atlantic Series A",
  r1e2: "Atlantic Series B",
  r1e3: "Metro Series A",
  r1e4: "Metro Series B",
  r2w1: "Western Semifinal 1",
  r2w2: "Western Semifinal 2",
  r2e1: "Eastern Semifinal 1",
  r2e2: "Eastern Semifinal 2",
  wcf: "Western Conference Final",
  ecf: "Eastern Conference Final",
  final: "Stanley Cup Final"
};
const TEAM_IDS = new Set([
  "ANA",
  "BOS",
  "BUF",
  "CAR",
  "CBJ",
  "CGY",
  "CHI",
  "COL",
  "DAL",
  "DET",
  "EDM",
  "FLA",
  "LAK",
  "MIN",
  "MTL",
  "NJD",
  "NSH",
  "NYI",
  "NYR",
  "OTT",
  "PHI",
  "PIT",
  "SEA",
  "SJS",
  "STL",
  "TBL",
  "TOR",
  "UTA",
  "VAN",
  "VGK",
  "WPG",
  "WSH"
]);
const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"]
]);

let sessionSecret = "";
let writeQueue = Promise.resolve();
let playoffSyncPromise = null;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

await bootstrap();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApiRequest(req, res, url);
      return;
    }

    await serveStaticAsset(req, res, url);
  } catch (error) {
    handleError(res, error);
  }
});

server.listen(PORT, () => {
  console.log(`Bracket Challenge server running at http://localhost:${PORT}`);
});

async function bootstrap() {
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dbPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await fs.writeFile(
      dbPath,
      JSON.stringify({ users: [], challenges: [] }, null, 2),
      "utf8"
    );
  }

  await migrateDb();
  sessionSecret = await loadOrCreateSecret();

  try {
    await syncPlayoffStateIfDue();
  } catch (error) {
    console.error("Unable to sync playoff results during startup.", error);
  }

  startPlayoffSyncScheduler();
}

async function handleApiRequest(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/auth/session") {
    const user = await authenticate(req);
    sendJson(res, 200, { user: user ? publicUser(user) : null });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/playoffs/overview") {
    await syncPlayoffStateIfDue();
    const db = await readDb();
    sendJson(res, 200, publicPlayoffOverview(db));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/leaderboard/")) {
    await syncPlayoffStateIfDue();

    if (!isSubmissionLocked()) {
      throw new HttpError(403, "Leaderboard brackets unlock after the playoff submission deadline.");
    }

    const challengeId = url.pathname.split("/").pop()?.trim();

    if (!challengeId) {
      throw new HttpError(404, "That bracket could not be found.");
    }

    const db = await readDb();
    const challenge = db.challenges.find((entry) => entry.id === challengeId);

    if (!challenge || !hasAssignedPlayoffField(challenge.bracket)) {
      throw new HttpError(404, "That bracket could not be found.");
    }

    sendJson(res, 200, {
      challenge: publicLeaderboardChallenge(challenge, db.users, db.playoffState)
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readJsonBody(req);
    const name = normalizeText(body.name, 80);
    const password = normalizePassword(body.password);

    if (!name) {
      throw new HttpError(400, "Choose a name to sign in with.");
    }

    if (!password) {
      throw new HttpError(400, "Passwords must be at least 8 characters.");
    }

    const db = await readDb();
    const existingUser = findUserByName(db.users, name);

    if (existingUser) {
      throw new HttpError(409, "That name already has an account. Try signing in instead.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const user = {
      id: crypto.randomUUID(),
      name,
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    await writeDb(db);

    sendJson(
      res,
      201,
      { user: publicUser(user) },
      { "Set-Cookie": createSessionCookie(user) }
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJsonBody(req);
    const name = normalizeText(body.name, 80);
    const password = normalizePassword(body.password);

    if (!name || !password) {
      throw new HttpError(400, "Enter your name and password.");
    }

    const db = await readDb();
    const user = findUserByName(db.users, name);

    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      throw new HttpError(401, "That name/password combination did not match.");
    }

    sendJson(
      res,
      200,
      { user: publicUser(user) },
      { "Set-Cookie": createSessionCookie(user) }
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
    return;
  }

  const user = await requireUser(req);

  if (req.method === "GET" && url.pathname === "/api/challenges") {
    await syncPlayoffStateIfDue();
    const db = await readDb();
    const challenges = db.challenges
      .filter((challenge) => challenge.userId === user.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((challenge) => publicChallenge(challenge, db.playoffState));

    sendJson(res, 200, {
      challenges,
      ...publicPlayoffOverview(db)
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/challenges") {
    await syncPlayoffStateIfDue();

    if (isSubmissionLocked()) {
      throw new HttpError(
        403,
        `Bracket submissions locked when ${PLAYOFF_SUBMISSION_LOCK_LABEL} started on April 18, 2026 at 3:00 p.m. ET.`
      );
    }

    const body = await readJsonBody(req);
    const db = await readDb();
    const now = new Date().toISOString();
    const title = normalizeText(body.title, 80) || defaultChallengeTitle();
    const season = normalizeText(body.season, 80) || defaultSeasonLabel();
    const bracket = sanitizeBracket(body.bracket);
    const champion = bracket.series.final.winner;
    const challengeId = typeof body.id === "string" ? body.id.trim() : "";
    const existingChallenge = challengeId
      ? db.challenges.find((challenge) => challenge.id === challengeId && challenge.userId === user.id)
      : null;

    if (challengeId && !existingChallenge) {
      throw new HttpError(404, "That saved challenge could not be found.");
    }

    let challenge;
    let statusCode;

    if (existingChallenge) {
      existingChallenge.title = title;
      existingChallenge.season = season;
      existingChallenge.bracket = bracket;
      existingChallenge.champion = champion;
      existingChallenge.updatedAt = now;
      challenge = existingChallenge;
      statusCode = 200;
    } else {
      challenge = {
        id: crypto.randomUUID(),
        userId: user.id,
        title,
        season,
        bracket,
        champion,
        createdAt: now,
        updatedAt: now
      };
      db.challenges.push(challenge);
      statusCode = 201;
    }

    await writeDb(db);
    sendJson(res, statusCode, {
      challenge: publicChallenge(challenge, db.playoffState),
      ...publicPlayoffOverview(db)
    });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/challenges/")) {
    const challengeId = url.pathname.split("/").pop()?.trim();

    if (!challengeId) {
      throw new HttpError(404, "That saved challenge could not be found.");
    }

    const db = await readDb();
    const index = db.challenges.findIndex(
      (challenge) => challenge.id === challengeId && challenge.userId === user.id
    );

    if (index === -1) {
      throw new HttpError(404, "That saved challenge could not be found.");
    }

    db.challenges.splice(index, 1);
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  throw new HttpError(404, "That endpoint does not exist.");
}

async function serveStaticAsset(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    throw new HttpError(405, "Method not allowed.");
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(path.join(publicDir, requestedPath));
  const relativePath = path.relative(publicDir, safePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new HttpError(403, "Forbidden.");
  }

  try {
    const file = await fs.readFile(safePath);
    const extension = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES.get(extension) ?? "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new HttpError(404, "Not found.");
    }

    throw error;
  }
}

async function authenticate(req) {
  const cookies = parseCookies(req.headers.cookie ?? "");
  const token = cookies.session;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const db = await readDb();
  return db.users.find((user) => user.id === session.userId) ?? null;
}

async function requireUser(req) {
  const user = await authenticate(req);

  if (!user) {
    throw new HttpError(401, "Sign in to save and revisit your brackets.");
  }

  return user;
}

async function loadOrCreateSecret() {
  try {
    const secret = await fs.readFile(secretPath, "utf8");
    return secret.trim();
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    const secret = crypto.randomBytes(32).toString("hex");
    await fs.writeFile(secretPath, secret, "utf8");
    return secret;
  }
}

async function readDb() {
  const raw = await fs.readFile(dbPath, "utf8");
  const parsed = JSON.parse(raw);

  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
    playoffState: sanitizePlayoffState(parsed.playoffState)
  };
}

async function writeDb(nextDb) {
  const content = JSON.stringify(sanitizeDb(nextDb), null, 2);
  writeQueue = writeQueue.then(() => fs.writeFile(dbPath, content, "utf8"));
  await writeQueue;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name
  };
}

function publicPlayoffOverview(db) {
  const playoffState = sanitizePlayoffState(db.playoffState);
  const leaderboard = buildLeaderboard(db.challenges, db.users, playoffState);

  return {
    season: playoffState.season,
    resultsUpdatedAt: playoffState.lastSyncedAt,
    submissionLockAt: PLAYOFF_SUBMISSION_LOCK_AT,
    submissionLockLabel: PLAYOFF_SUBMISSION_LOCK_LABEL,
    isSubmissionLocked: isSubmissionLocked(),
    seriesScores: playoffState.seriesScores,
    leaderboard: leaderboard.currentYear,
    currentYearLeaderboard: leaderboard.currentYear,
    allTimeLeaderboard: leaderboard.allTime
  };
}

function publicChallenge(challenge, playoffState = createEmptyPlayoffState()) {
  const score = scoreChallenge(challenge.bracket, playoffState.officialBracket);

  return {
    id: challenge.id,
    title: challenge.title,
    season: challenge.season,
    bracket: challenge.bracket,
    champion: challenge.champion,
    points: score.points,
    correctPicks: score.correctPicks,
    availablePoints: score.availablePoints,
    scoredSeries: score.scoredSeries,
    resultsUpdatedAt: playoffState.lastSyncedAt,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt
  };
}

function publicLeaderboardChallenge(challenge, users, playoffState = createEmptyPlayoffState()) {
  const owner =
    Array.isArray(users) ? users.find((user) => user?.id === challenge.userId) : null;

  return {
    ...publicChallenge(challenge, playoffState),
    userName: owner?.name ?? "Unknown user"
  };
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizePassword(value) {
  if (typeof value !== "string") {
    return "";
  }

  const password = value.trim();
  return password.length >= 8 ? password : "";
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password, salt, expectedHash) {
  const hash = hashPassword(password, salt);
  return safeCompare(hash, expectedHash);
}

function findUserByName(users, name) {
  const targetName = normalizeNameKey(name);

  if (!targetName) {
    return null;
  }

  return users.find((user) => normalizeNameKey(user.name) === targetName) ?? null;
}

function normalizeNameKey(value) {
  return normalizeText(value, 80).toLowerCase();
}

async function migrateDb() {
  const db = await readDb();
  const sanitizedDb = sanitizeDb(db);

  if (JSON.stringify(db) !== JSON.stringify(sanitizedDb)) {
    await writeDb(sanitizedDb);
  }
}

function sanitizeDb(db) {
  return {
    users: Array.isArray(db.users) ? db.users.map(sanitizeUserRecord) : [],
    challenges: Array.isArray(db.challenges) ? db.challenges : [],
    playoffState: sanitizePlayoffState(db.playoffState)
  };
}

function sanitizeUserRecord(user) {
  if (!user || typeof user !== "object") {
    return {};
  }

  const { email, ...sanitizedUser } = user;
  return sanitizedUser;
}

function createEmptyPlayoffState() {
  return {
    season: PLAYOFF_YEAR,
    sourceUrl: PLAYOFF_BRACKET_URL,
    lastSyncedAt: null,
    lastSyncedLocalDate: null,
    seriesScores: [],
    officialBracket: createEmptyBracket()
  };
}

function isSubmissionLocked(now = new Date()) {
  const lockTime = Date.parse(PLAYOFF_SUBMISSION_LOCK_AT);

  if (!Number.isFinite(lockTime)) {
    return false;
  }

  return now.getTime() >= lockTime;
}

function sanitizePlayoffState(playoffState) {
  if (!playoffState || typeof playoffState !== "object") {
    return createEmptyPlayoffState();
  }

  return {
    season: Number.isInteger(playoffState.season) ? playoffState.season : PLAYOFF_YEAR,
    sourceUrl: typeof playoffState.sourceUrl === "string" ? playoffState.sourceUrl : PLAYOFF_BRACKET_URL,
    lastSyncedAt: typeof playoffState.lastSyncedAt === "string" ? playoffState.lastSyncedAt : null,
    lastSyncedLocalDate:
      typeof playoffState.lastSyncedLocalDate === "string" ? playoffState.lastSyncedLocalDate : null,
    seriesScores: sanitizeSeriesScores(playoffState.seriesScores),
    officialBracket: sanitizeBracket(playoffState.officialBracket)
  };
}

function startPlayoffSyncScheduler() {
  const interval = setInterval(() => {
    void syncPlayoffStateIfDue().catch((error) => {
      console.error("Scheduled playoff sync failed.", error);
    });
  }, PLAYOFF_SYNC_CHECK_INTERVAL_MS);

  if (typeof interval.unref === "function") {
    interval.unref();
  }
}

async function syncPlayoffStateIfDue({ force = false } = {}) {
  if (playoffSyncPromise) {
    return playoffSyncPromise;
  }

  playoffSyncPromise = runPlayoffSync(force).finally(() => {
    playoffSyncPromise = null;
  });

  return playoffSyncPromise;
}

async function runPlayoffSync(force) {
  const db = await readDb();

  if (!force && !isPlayoffSyncDue(db.playoffState)) {
    return db.playoffState;
  }

  try {
    const nextPlayoffState = await fetchLatestPlayoffState();
    db.playoffState = nextPlayoffState;
    await writeDb(db);
    return nextPlayoffState;
  } catch (error) {
    console.error("Unable to sync playoff results.", error);
    return db.playoffState;
  }
}

function isPlayoffSyncDue(playoffState) {
  const currentState = sanitizePlayoffState(playoffState);

  if (!currentState.lastSyncedAt || currentState.seriesScores.length === 0) {
    return true;
  }

  const nowParts = getTimeZoneParts(new Date(), PLAYOFF_SYNC_TIME_ZONE);
  const todayKey = buildDateKey(nowParts);
  const hasReachedSyncWindow =
    nowParts.hour > PLAYOFF_SYNC_HOUR ||
    (nowParts.hour === PLAYOFF_SYNC_HOUR && nowParts.minute >= PLAYOFF_SYNC_MINUTE);

  return hasReachedSyncWindow && currentState.lastSyncedLocalDate !== todayKey;
}

async function fetchLatestPlayoffState() {
  const response = await fetch(PLAYOFF_BRACKET_URL, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`NHL playoff feed returned ${response.status}.`);
  }

  const payload = await response.json();
  const syncedAt = new Date();

  return {
    season: PLAYOFF_YEAR,
    sourceUrl: PLAYOFF_BRACKET_URL,
    lastSyncedAt: syncedAt.toISOString(),
    lastSyncedLocalDate: buildDateKey(getTimeZoneParts(syncedAt, PLAYOFF_SYNC_TIME_ZONE)),
    seriesScores: buildSeriesScores(payload),
    officialBracket: buildOfficialPlayoffBracket(payload)
  };
}

function buildOfficialPlayoffBracket(payload) {
  const officialBracket = createEmptyBracket();
  const sourceSeries = Array.isArray(payload?.series) ? payload.series : [];

  for (const series of sourceSeries) {
    const seriesId = SERIES_ID_BY_LETTER[series?.seriesLetter];

    if (!seriesId) {
      continue;
    }

    const topTeam = normalizeTeamId(series.topSeedTeam?.abbrev);
    const bottomTeam = normalizeTeamId(series.bottomSeedTeam?.abbrev);

    if (ROUND_ONE_SERIES.includes(seriesId) && topTeam && bottomTeam) {
      officialBracket.series[seriesId].teams = [topTeam, bottomTeam];
    }

    const winner = getOfficialSeriesWinner(series, topTeam, bottomTeam);

    if (winner) {
      officialBracket.series[seriesId].winner = winner;
    }
  }

  return sanitizeBracket(officialBracket);
}

function sanitizeSeriesScores(seriesScores) {
  if (!Array.isArray(seriesScores)) {
    return [];
  }

  return seriesScores
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const seriesId = typeof entry.seriesId === "string" && ALL_SERIES.includes(entry.seriesId) ? entry.seriesId : null;
      const topTeam = normalizeTeamId(entry.topTeam);
      const bottomTeam = normalizeTeamId(entry.bottomTeam);

      if (!seriesId || !topTeam || !bottomTeam) {
        return null;
      }

      return {
        seriesId,
        label: typeof entry.label === "string" ? entry.label : SERIES_LABELS[seriesId] ?? seriesId,
        topTeam,
        bottomTeam,
        topWins: normalizeSeriesWins(entry.topWins),
        bottomWins: normalizeSeriesWins(entry.bottomWins),
        winner: normalizeTeamId(entry.winner)
      };
    })
    .filter(Boolean)
    .sort((left, right) => ALL_SERIES.indexOf(left.seriesId) - ALL_SERIES.indexOf(right.seriesId));
}

function buildSeriesScores(payload) {
  const sourceSeries = Array.isArray(payload?.series) ? payload.series : [];

  return sourceSeries
    .map((series) => {
      const seriesId = SERIES_ID_BY_LETTER[series?.seriesLetter];
      const topTeam = normalizeTeamId(series?.topSeedTeam?.abbrev);
      const bottomTeam = normalizeTeamId(series?.bottomSeedTeam?.abbrev);

      if (!seriesId || !topTeam || !bottomTeam) {
        return null;
      }

      return {
        seriesId,
        label: SERIES_LABELS[seriesId] ?? seriesId,
        topTeam,
        bottomTeam,
        topWins: normalizeSeriesWins(series?.topSeedWins),
        bottomWins: normalizeSeriesWins(series?.bottomSeedWins),
        winner: getOfficialSeriesWinner(series, topTeam, bottomTeam)
      };
    })
    .filter(Boolean)
    .sort((left, right) => ALL_SERIES.indexOf(left.seriesId) - ALL_SERIES.indexOf(right.seriesId));
}

function getOfficialSeriesWinner(series, topTeam, bottomTeam) {
  if (series?.winningTeamId && series?.topSeedTeam?.id === series.winningTeamId) {
    return topTeam;
  }

  if (series?.winningTeamId && series?.bottomSeedTeam?.id === series.winningTeamId) {
    return bottomTeam;
  }

  if (Number(series?.topSeedWins) >= 4) {
    return topTeam;
  }

  if (Number(series?.bottomSeedWins) >= 4) {
    return bottomTeam;
  }

  return null;
}

function normalizeSeriesWins(value) {
  const wins = Number.parseInt(value ?? 0, 10);
  return Number.isFinite(wins) && wins >= 0 ? wins : 0;
}

function buildLeaderboard(challenges, users, playoffState = createEmptyPlayoffState()) {
  const userById = new Map(
    Array.isArray(users) ? users.map((user) => [user?.id, publicUser(user)]) : []
  );
  const season = Number.isFinite(playoffState.season) ? playoffState.season : PLAYOFF_YEAR;
  const allTimeByUserId = new Map();

  const scoredChallenges = (Array.isArray(challenges) ? challenges : [])
    .filter((challenge) => hasAssignedPlayoffField(challenge?.bracket))
    .map((challenge) => {
      const score = scoreChallenge(challenge.bracket, playoffState.officialBracket);
      const owner = userById.get(challenge.userId);

      return {
        id: challenge.id,
        userId: challenge.userId,
        title: challenge.title,
        season: challenge.season,
        userName: owner?.name ?? "Unknown user",
        points: score.points,
        correctPicks: score.correctPicks,
        availablePoints: score.availablePoints,
        updatedAt: challenge.updatedAt,
        champion: challenge.champion ?? null
      };
    });

  for (const entry of scoredChallenges) {
    const accountId = entry.userId ?? entry.userName;
    const current = allTimeByUserId.get(accountId) ?? {
      id: accountId,
      userName: entry.userName,
      points: 0,
      correctPicks: 0,
      availablePoints: 0,
      bracketCount: 0,
      updatedAt: entry.updatedAt
    };

    current.points += entry.points;
    current.correctPicks += entry.correctPicks;
    current.availablePoints += entry.availablePoints;
    current.bracketCount += 1;

    if (String(entry.updatedAt ?? "").localeCompare(String(current.updatedAt ?? "")) > 0) {
      current.updatedAt = entry.updatedAt;
    }

    allTimeByUserId.set(accountId, current);
  }

  const currentYear = scoredChallenges
    .filter((entry) => getChallengeSeasonYear(entry) === season)
    .sort(compareLeaderboardEntries)
    .slice(0, 5);
  const allTime = [...allTimeByUserId.values()]
    .sort(compareAllTimeLeaderboardEntries)
    .slice(0, 5);

  return {
    currentYear,
    allTime
  };
}

function compareLeaderboardEntries(left, right) {
  if (right.points !== left.points) {
    return right.points - left.points;
  }

  if (right.correctPicks !== left.correctPicks) {
    return right.correctPicks - left.correctPicks;
  }

  return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
}

function compareAllTimeLeaderboardEntries(left, right) {
  if (right.points !== left.points) {
    return right.points - left.points;
  }

  if (right.correctPicks !== left.correctPicks) {
    return right.correctPicks - left.correctPicks;
  }

  if (right.bracketCount !== left.bracketCount) {
    return right.bracketCount - left.bracketCount;
  }

  return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
}

function getChallengeSeasonYear(challenge) {
  for (const value of [challenge?.season, challenge?.title, challenge?.createdAt]) {
    if (typeof value !== "string") {
      continue;
    }

    const match = value.match(/\b(20\d{2})\b/);

    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  return PLAYOFF_YEAR;
}

function hasAssignedPlayoffField(bracket) {
  const cleanBracket = sanitizeBracket(bracket);
  return ROUND_ONE_SERIES.some((seriesId) => cleanBracket.series[seriesId].teams.some(Boolean));
}

function getTimeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function buildDateKey(parts) {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

function scoreChallenge(challengeBracket, officialBracket) {
  const prediction = sanitizeBracket(challengeBracket);
  const results = sanitizeBracket(officialBracket);
  let points = 0;
  let correctPicks = 0;
  let availablePoints = 0;
  const scoredSeries = [];

  for (const seriesId of ALL_SERIES) {
    const officialWinner = results.series[seriesId].winner;

    if (!officialWinner) {
      continue;
    }

    const seriesPoints = SERIES_POINTS[seriesId] ?? 0;
    availablePoints += seriesPoints;

    if (prediction.series[seriesId].winner === officialWinner) {
      points += seriesPoints;
      correctPicks += 1;
      scoredSeries.push(seriesId);
    }
  }

  return {
    points,
    correctPicks,
    availablePoints,
    scoredSeries
  };
}

function createSessionCookie(user) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
    })
  ).toString("base64url");
  const signature = signValue(payload);
  const token = `${payload}.${signature}`;

  return serializeCookie("session", token, {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "Lax"
  });
}

function clearSessionCookie() {
  return serializeCookie("session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "Lax"
  });
}

function verifySessionToken(token) {
  if (typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expectedSignature = signValue(payload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (typeof parsed.userId !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    if (parsed.expiresAt < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function signValue(value) {
  return crypto.createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left ?? "");
  const rightBuffer = Buffer.from(right ?? "");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function serializeCookie(name, value, options) {
  const parts = [`${name}=${value}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  return parts.join("; ");
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(";").reduce((cookies, entry) => {
    const [name, ...valueParts] = entry.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = valueParts.join("=");
    return cookies;
  }, {});
}

async function readJsonBody(req) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;

    if (totalSize > MAX_BODY_SIZE) {
      throw new HttpError(413, "That payload is too large.");
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "That request body is not valid JSON.");
  }
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function handleError(res, error) {
  const statusCode = error instanceof HttpError ? error.status : 500;
  const message =
    error instanceof HttpError ? error.message : "The server hit an unexpected error.";

  if (!(error instanceof HttpError)) {
    console.error(error);
  }

  sendJson(res, statusCode, { error: message });
}

function createEmptyBracket() {
  const series = {};

  for (const seriesId of ROUND_ONE_SERIES) {
    series[seriesId] = {
      teams: [null, null],
      winner: null
    };
  }

  for (const seriesId of ALL_SERIES.filter((id) => !ROUND_ONE_SERIES.includes(id))) {
    series[seriesId] = { winner: null };
  }

  return {
    version: 1,
    series
  };
}

function sanitizeBracket(input) {
  const cleanBracket = createEmptyBracket();
  const sourceSeries =
    input && typeof input === "object" && input.series && typeof input.series === "object"
      ? input.series
      : {};

  for (const seriesId of ROUND_ONE_SERIES) {
    const nextSeries = sourceSeries[seriesId] ?? {};
    const teamA = normalizeTeamId(nextSeries.teams?.[0]);
    let teamB = normalizeTeamId(nextSeries.teams?.[1]);

    if (teamA && teamA === teamB) {
      teamB = null;
    }

    cleanBracket.series[seriesId].teams = [teamA, teamB];
    cleanBracket.series[seriesId].winner = normalizeTeamId(nextSeries.winner);
  }

  for (const seriesId of ALL_SERIES.filter((id) => !ROUND_ONE_SERIES.includes(id))) {
    cleanBracket.series[seriesId].winner = normalizeTeamId(sourceSeries[seriesId]?.winner);
  }

  return cascadeBracket(cleanBracket);
}

function normalizeTeamId(value) {
  if (typeof value !== "string") {
    return null;
  }

  const nextValue = value.trim().toUpperCase();
  return TEAM_IDS.has(nextValue) ? nextValue : null;
}

function cascadeBracket(bracket) {
  for (const seriesId of ROUND_ONE_SERIES) {
    const series = bracket.series[seriesId];
    const teams = series.teams.filter(Boolean);

    if (teams.length !== 2 || !teams.includes(series.winner)) {
      series.winner = null;
    }
  }

  for (const seriesId of ALL_SERIES.filter((id) => !ROUND_ONE_SERIES.includes(id))) {
    const validOptions = getSeriesCandidates(bracket, seriesId);

    if (validOptions.length !== 2 || !validOptions.includes(bracket.series[seriesId].winner)) {
      bracket.series[seriesId].winner = null;
    }
  }

  return bracket;
}

function getSeriesCandidates(bracket, seriesId) {
  if (ROUND_ONE_SERIES.includes(seriesId)) {
    return bracket.series[seriesId].teams.filter(Boolean);
  }

  return (SERIES_FLOW[seriesId] ?? [])
    .map((sourceSeriesId) => bracket.series[sourceSeriesId].winner)
    .filter(Boolean);
}

function defaultChallengeTitle() {
  const year = new Date().getFullYear();
  return `My ${year} NHL Bracket`;
}

function defaultSeasonLabel() {
  const year = new Date().getFullYear();
  return `${year} Stanley Cup Playoffs`;
}
