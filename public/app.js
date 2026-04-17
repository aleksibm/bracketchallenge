const TEAMS = [
  { id: "ANA", name: "Anaheim Ducks", division: "Pacific", primary: "#b9975b", secondary: "#111111" },
  { id: "BOS", name: "Boston Bruins", division: "Atlantic", primary: "#ffb81c", secondary: "#111111" },
  { id: "BUF", name: "Buffalo Sabres", division: "Atlantic", primary: "#003087", secondary: "#fcb514" },
  { id: "CAR", name: "Carolina Hurricanes", division: "Metropolitan", primary: "#cc0000", secondary: "#111111" },
  { id: "CBJ", name: "Columbus Blue Jackets", division: "Metropolitan", primary: "#002654", secondary: "#ce1126" },
  { id: "CGY", name: "Calgary Flames", division: "Pacific", primary: "#c8102e", secondary: "#f1be48" },
  { id: "CHI", name: "Chicago Blackhawks", division: "Central", primary: "#cf0a2c", secondary: "#111111" },
  { id: "COL", name: "Colorado Avalanche", division: "Central", primary: "#6f263d", secondary: "#236192" },
  { id: "DAL", name: "Dallas Stars", division: "Central", primary: "#006847", secondary: "#8f8f8c" },
  { id: "DET", name: "Detroit Red Wings", division: "Atlantic", primary: "#ce1126", secondary: "#f5f7fb" },
  { id: "EDM", name: "Edmonton Oilers", division: "Pacific", primary: "#041e42", secondary: "#ff4c00" },
  { id: "FLA", name: "Florida Panthers", division: "Atlantic", primary: "#041e42", secondary: "#c8102e" },
  { id: "LAK", name: "Los Angeles Kings", division: "Pacific", primary: "#111111", secondary: "#a2aaad" },
  { id: "MIN", name: "Minnesota Wild", division: "Central", primary: "#154734", secondary: "#a6192e" },
  { id: "MTL", name: "Montreal Canadiens", division: "Atlantic", primary: "#af1e2d", secondary: "#192168" },
  { id: "NJD", name: "New Jersey Devils", division: "Metropolitan", primary: "#ce1126", secondary: "#111111" },
  { id: "NSH", name: "Nashville Predators", division: "Central", primary: "#ffb81c", secondary: "#041e42" },
  { id: "NYI", name: "New York Islanders", division: "Metropolitan", primary: "#00539b", secondary: "#f47d30" },
  { id: "NYR", name: "New York Rangers", division: "Metropolitan", primary: "#0038a8", secondary: "#ce1126" },
  { id: "OTT", name: "Ottawa Senators", division: "Atlantic", primary: "#c52032", secondary: "#111111" },
  { id: "PHI", name: "Philadelphia Flyers", division: "Metropolitan", primary: "#f74902", secondary: "#111111" },
  { id: "PIT", name: "Pittsburgh Penguins", division: "Metropolitan", primary: "#111111", secondary: "#fcb514" },
  { id: "SEA", name: "Seattle Kraken", division: "Pacific", primary: "#001628", secondary: "#6a8388" },
  { id: "SJS", name: "San Jose Sharks", division: "Pacific", primary: "#006d75", secondary: "#ea7200" },
  { id: "STL", name: "St. Louis Blues", division: "Central", primary: "#002f87", secondary: "#fcb514" },
  { id: "TBL", name: "Tampa Bay Lightning", division: "Atlantic", primary: "#002868", secondary: "#f5f7fb" },
  { id: "TOR", name: "Toronto Maple Leafs", division: "Atlantic", primary: "#00205b", secondary: "#f5f7fb" },
  { id: "UTA", name: "Utah Mammoth", division: "Central", primary: "#5b6c83", secondary: "#a7c6ed" },
  { id: "VAN", name: "Vancouver Canucks", division: "Pacific", primary: "#00205b", secondary: "#00843d" },
  { id: "VGK", name: "Vegas Golden Knights", division: "Pacific", primary: "#b4975a", secondary: "#333f48" },
  { id: "WPG", name: "Winnipeg Jets", division: "Central", primary: "#041e42", secondary: "#7b303e" },
  { id: "WSH", name: "Washington Capitals", division: "Metropolitan", primary: "#041e42", secondary: "#c8102e" }
];

const TEAM_BY_ID = Object.fromEntries(TEAMS.map((team) => [team.id, team]));
const TEAM_IDS = new Set(TEAMS.map((team) => team.id));
const NHL_LOGO_BASE_URL = "https://assets.nhle.com/logos/nhl/svg";
const ROUND_ONE_SERIES = ["r1w1", "r1w2", "r1w3", "r1w4", "r1e1", "r1e2", "r1e3", "r1e4"];
const SERIES = {
  r1w1: { label: "Pacific Series A", slotHints: ["Top Pacific seed", "Wild card challenger"] },
  r1w2: { label: "Pacific Series B", slotHints: ["Pacific matchup", "Pacific matchup"] },
  r1w3: { label: "Central Series A", slotHints: ["Top Central seed", "Wild card challenger"] },
  r1w4: { label: "Central Series B", slotHints: ["Central matchup", "Central matchup"] },
  r1e1: { label: "Atlantic Series A", slotHints: ["Top Atlantic seed", "Wild card challenger"] },
  r1e2: { label: "Atlantic Series B", slotHints: ["Atlantic matchup", "Atlantic matchup"] },
  r1e3: { label: "Metro Series A", slotHints: ["Top Metro seed", "Wild card challenger"] },
  r1e4: { label: "Metro Series B", slotHints: ["Metro matchup", "Metro matchup"] },
  r2w1: { label: "Western Semifinal 1", sources: ["r1w1", "r1w2"] },
  r2w2: { label: "Western Semifinal 2", sources: ["r1w3", "r1w4"] },
  r2e1: { label: "Eastern Semifinal 1", sources: ["r1e1", "r1e2"] },
  r2e2: { label: "Eastern Semifinal 2", sources: ["r1e3", "r1e4"] },
  wcf: { label: "Western Conference Final", sources: ["r2w1", "r2w2"] },
  ecf: { label: "Eastern Conference Final", sources: ["r2e1", "r2e2"] },
  final: { label: "Stanley Cup Final", sources: ["wcf", "ecf"] }
};
const PLAYOFF_FIELD_2026 = {
  r1w1: ["VGK", "UTA"],
  r1w2: ["EDM", "ANA"],
  r1w3: ["COL", "LAK"],
  r1w4: ["DAL", "MIN"],
  r1e1: ["BUF", "BOS"],
  r1e2: ["TBL", "MTL"],
  r1e3: ["CAR", "OTT"],
  r1e4: ["PIT", "PHI"]
};
const BRACKET_TREE_LAYOUT = [
  { id: "r1w1", column: 1, row: 1, stage: "round-one" },
  { id: "r2w1", column: 2, row: 2, stage: "round-two" },
  { id: "r1w2", column: 1, row: 3, stage: "round-one" },
  { id: "wcf", column: 3, row: 5, stage: "conference-final" },
  { id: "r1w3", column: 1, row: 7, stage: "round-one" },
  { id: "r2w2", column: 2, row: 8, stage: "round-two" },
  { id: "r1w4", column: 1, row: 9, stage: "round-one" },
  { id: "final", column: 4, row: 5, stage: "final" },
  { id: "r1e1", column: 7, row: 1, stage: "round-one" },
  { id: "r2e1", column: 6, row: 2, stage: "round-two" },
  { id: "r1e2", column: 7, row: 3, stage: "round-one" },
  { id: "ecf", column: 5, row: 5, stage: "conference-final" },
  { id: "r1e3", column: 7, row: 7, stage: "round-one" },
  { id: "r2e2", column: 6, row: 8, stage: "round-two" },
  { id: "r1e4", column: 7, row: 9, stage: "round-one" }
];
const BRACKET_STAGE_LABELS = [
  { column: 1, label: "Round 1" },
  { column: 2, label: "Round 2" },
  { column: 3, label: "WCF" },
  { column: 4, label: "Final" },
  { column: 5, label: "ECF" },
  { column: 6, label: "Round 2" },
  { column: 7, label: "Round 1" }
];
const SERIES_STAGE_LABELS = {
  "round-one": "Round 1",
  "round-two": "Round 2",
  "conference-final": "Conference Final",
  final: "Stanley Cup Final"
};
const ALL_SERIES = Object.keys(SERIES);
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});
const deadlineFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "short"
});
let bracketLineFrame = 0;

const state = {
  authMode: "register",
  session: null,
  challenges: [],
  overview: createOverviewState(),
  leaderboardViewer: createBracketViewerState(),
  current: createChallengeDraft(),
  message: null
};

const refs = {
  authPanel: document.querySelector("#auth-panel"),
  authHeading: document.querySelector("#auth-heading"),
  authForm: document.querySelector("#auth-form"),
  authName: document.querySelector("#auth-name"),
  authPassword: document.querySelector("#auth-password"),
  authSubmit: document.querySelector("#auth-submit"),
  leaderboardViewer: document.querySelector("#leaderboard-viewer"),
  leaderboardViewerClose: document.querySelector("#leaderboard-viewer-close"),
  leaderboardViewerTitle: document.querySelector("#leaderboard-viewer-title"),
  leaderboardViewerSummary: document.querySelector("#leaderboard-viewer-summary"),
  leaderboardViewerBoard: document.querySelector("#leaderboard-viewer-board"),
  submissionLockBanner: document.querySelector("#submission-lock-banner"),
  submissionLockCountdown: document.querySelector("#submission-lock-countdown"),
  submissionLockCopy: document.querySelector("#submission-lock-copy"),
  overviewUpdated: document.querySelector("#overview-updated"),
  seriesScoreList: document.querySelector("#series-score-list"),
  leaderboardList: document.querySelector("#leaderboard-list"),
  appPanel: document.querySelector("#app-panel"),
  userName: document.querySelector("#user-name"),
  challengeSummary: document.querySelector("#challenge-summary"),
  challengeTitle: document.querySelector("#challenge-title"),
  challengeSeason: document.querySelector("#challenge-season"),
  championCard: document.querySelector("#champion-card"),
  championName: document.querySelector("#champion-name"),
  championCopy: document.querySelector("#champion-copy"),
  bracketColumns: document.querySelector("#bracket-columns"),
  historyList: document.querySelector("#history-list"),
  messageBanner: document.querySelector("#message-banner"),
  saveChallengeBtn: document.querySelector("#save-challenge-btn"),
  saveBracketBoardBtn: document.querySelector("#save-bracket-board-btn"),
  newChallengeBtn: document.querySelector("#new-challenge-btn"),
  demoFieldBtn: document.querySelector("#demo-field-btn"),
  clearFieldBtn: document.querySelector("#clear-field-btn"),
  logoutBtn: document.querySelector("#logout-btn")
};

initialize();

function initialize() {
  bindEvents();
  window.addEventListener("resize", queueBracketLineRender);
  document.addEventListener("keydown", handleGlobalKeydown);
  window.setInterval(() => {
    renderSubmissionLock();
    applySubmissionLockState();
  }, 1000);
  render();
  void loadOverview();
  void loadSession();
}

function bindEvents() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.dataset.authMode;
      refs.authForm.reset();
      clearMessage();
      renderAuthMode();
    });
  });

  refs.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitAuth();
  });

  refs.leaderboardList.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-view-bracket]") : null;

    if (!target) {
      return;
    }

    const challengeId = target.getAttribute("data-view-bracket");

    if (!challengeId) {
      return;
    }

    void openLeaderboardBracket(challengeId);
  });

  refs.challengeTitle.addEventListener("input", () => {
    state.current.title = refs.challengeTitle.value;
    renderChallengeSummary();
  });

  refs.challengeSeason.addEventListener("input", () => {
    state.current.season = refs.challengeSeason.value;
    renderChallengeSummary();
  });

  refs.saveChallengeBtn.addEventListener("click", () => {
    void saveChallenge();
  });

  refs.saveBracketBoardBtn.addEventListener("click", () => {
    void saveChallenge();
  });

  refs.newChallengeBtn.addEventListener("click", () => {
    if (!ensureSubmissionOpen()) {
      return;
    }

    state.current = createChallengeDraft();
    setMessage("Started a fresh bracket.", "success");
    render();
  });

  refs.demoFieldBtn.addEventListener("click", () => {
    if (!ensureSubmissionOpen()) {
      return;
    }

    applyDemoField();
    setMessage("Reloaded the official 2026 Stanley Cup Playoffs field.", "success");
    render();
  });

  refs.clearFieldBtn.addEventListener("click", () => {
    if (!ensureSubmissionOpen()) {
      return;
    }

    state.current.bracket = createPlayoffBracket();
    invalidateCurrentScore();
    setMessage("Cleared all picks and kept the official 2026 matchups in place.", "success");
    render();
  });

  refs.logoutBtn.addEventListener("click", () => {
    void logout();
  });

  refs.bracketColumns.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-pick]") : null;

    if (!target) {
      return;
    }

    const series = target.getAttribute("data-series");
    const teamId = target.getAttribute("data-pick");

    if (!series || !teamId) {
      return;
    }

    toggleWinner(series, teamId);
  });

  refs.historyList.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("button") : null;

    if (!target) {
      return;
    }

    const loadId = target.getAttribute("data-load-id");
    const deleteId = target.getAttribute("data-delete-id");

    if (loadId) {
      loadChallenge(loadId);
      return;
    }

    if (deleteId) {
      void deleteChallenge(deleteId);
    }
  });

  refs.leaderboardViewer.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-close-viewer]") : null;

    if (target) {
      closeLeaderboardViewer();
    }
  });

  refs.leaderboardViewerClose.addEventListener("click", () => {
    closeLeaderboardViewer();
  });
}

async function loadSession() {
  try {
    const payload = await api("/api/auth/session");

    if (payload.user) {
      state.session = payload.user;
      await refreshChallenges(true);
      setMessage("Your saved brackets are ready.", "success");
    }
  } catch (error) {
    setMessage(error.message, "error");
  }

  render();
}

async function loadOverview() {
  try {
    const payload = await api("/api/playoffs/overview");
    state.overview = normalizeOverviewPayload(payload);
    renderOverview();
  } catch (error) {
    state.overview.error = error.message;
    state.overview.loading = false;
    renderOverview();
  }
}

async function submitAuth() {
  const payload = {
    name: refs.authName.value,
    password: refs.authPassword.value
  };
  const endpoint = state.authMode === "register" ? "/api/auth/register" : "/api/auth/login";

  try {
    const response = await api(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    state.session = response.user;
    refs.authForm.reset();
    await refreshChallenges(true);
    setMessage(
      state.authMode === "register"
        ? "Account created. Your bracket archive is ready."
        : "Signed in and ready to pick.",
      "success"
    );
    render();
  } catch (error) {
    setMessage(error.message, "error");
    renderMessage();
  }
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
    state.session = null;
    state.challenges = [];
    state.leaderboardViewer = createBracketViewerState();
    state.current = createChallengeDraft();
    setMessage("Logged out. Your saved brackets are still waiting the next time you sign in.", "success");
    render();
  } catch (error) {
    setMessage(error.message, "error");
    renderMessage();
  }
}

async function refreshChallenges(autoload = false) {
  if (!state.session) {
    return;
  }

  const payload = await api("/api/challenges");
  state.challenges = Array.isArray(payload.challenges) ? payload.challenges.map(normalizeChallenge) : [];
  state.overview = normalizeOverviewPayload(payload);

  if (autoload) {
    const latestChallenge = state.challenges[0];
    state.current =
      latestChallenge && hasAssignedPlayoffField(latestChallenge.bracket)
        ? normalizeChallenge(latestChallenge)
        : createChallengeDraft();
  }
}

async function saveChallenge() {
  if (!state.session) {
    setMessage("Sign in first so the server can remember your bracket history.", "error");
    renderMessage();
    return;
  }

  if (!ensureSubmissionOpen()) {
    return;
  }

  try {
    const response = await api("/api/challenges", {
      method: "POST",
      body: JSON.stringify({
        id: state.current.id,
        title: state.current.title,
        season: state.current.season,
        bracket: state.current.bracket
      })
    });

    const savedChallenge = normalizeChallenge(response.challenge);
    state.current = savedChallenge;
    state.overview = normalizeOverviewPayload(response);
    state.challenges = [
      savedChallenge,
      ...state.challenges.filter((challenge) => challenge.id !== savedChallenge.id)
    ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    setMessage("Bracket saved to your history.", "success");
    render();
  } catch (error) {
    setMessage(error.message, "error");
    renderMessage();
  }
}

function loadChallenge(challengeId) {
  const challenge = state.challenges.find((entry) => entry.id === challengeId);

  if (!challenge) {
    setMessage("That saved bracket is no longer available.", "error");
    renderMessage();
    return;
  }

  state.current = normalizeChallenge(challenge);
  setMessage(`Loaded "${challenge.title}".`, "success");
  render();
}

async function deleteChallenge(challengeId) {
  const challenge = state.challenges.find((entry) => entry.id === challengeId);

  if (!challenge) {
    return;
  }

  const shouldDelete = window.confirm(`Delete "${challenge.title}" from your saved history?`);

  if (!shouldDelete) {
    return;
  }

  try {
    await api(`/api/challenges/${challengeId}`, { method: "DELETE" });
    state.challenges = state.challenges.filter((entry) => entry.id !== challengeId);
    await loadOverview();

    if (state.current.id === challengeId) {
      state.current = state.challenges.length > 0 ? normalizeChallenge(state.challenges[0]) : createChallengeDraft();
    }

    setMessage("Saved bracket removed from history.", "success");
    render();
  } catch (error) {
    setMessage(error.message, "error");
    renderMessage();
  }
}

function applyDemoField() {
  if (isSubmissionLocked()) {
    return;
  }

  state.current.bracket = createPlayoffBracket();
  invalidateCurrentScore();
}

function toggleWinner(seriesId, teamId) {
  if (!ensureSubmissionOpen()) {
    return;
  }

  const nextBracket = structuredClone(state.current.bracket);
  const series = nextBracket.series[seriesId];

  if (!series) {
    return;
  }

  series.winner = series.winner === teamId ? null : teamId;
  state.current.bracket = sanitizeBracket(nextBracket);
  invalidateCurrentScore();
  render();
}

function render() {
  renderAuthMode();
  renderOverview();
  renderSubmissionLock();
  renderLeaderboardViewer();
  applySubmissionLockState();
  refs.authPanel.hidden = Boolean(state.session);
  refs.appPanel.hidden = !state.session;

  if (state.session) {
    refs.userName.textContent = state.session.name;
    refs.challengeTitle.value = state.current.title;
    refs.challengeSeason.value = state.current.season;
    renderChallengeSummary();
    renderChampion();
    renderBracket();
    renderHistory();
  }

  renderMessage();
}

function renderAuthMode() {
  const registerMode = state.authMode === "register";

  refs.authHeading.textContent = registerMode ? "Create your account" : "Sign back in";
  refs.authSubmit.textContent = registerMode ? "Create account" : "Sign in";
  refs.authName.placeholder = registerMode ? "Bracket boss" : "Your account name";
  refs.authPassword.autocomplete = registerMode ? "new-password" : "current-password";

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authMode === state.authMode);
  });
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && state.leaderboardViewer.open) {
    closeLeaderboardViewer();
  }
}

function renderOverview() {
  if (state.overview.loading) {
    refs.overviewUpdated.textContent = "Loading live playoff data";
    refs.seriesScoreList.innerHTML = `<div class="hero-empty">Loading playoff series scores...</div>`;
    refs.leaderboardList.innerHTML = `<div class="hero-empty">Loading leaderboard...</div>`;
    return;
  }

  const updatedAt = state.overview.resultsUpdatedAt
    ? `Updated ${dateFormatter.format(new Date(state.overview.resultsUpdatedAt))}`
    : "Waiting for the latest sync";

  refs.overviewUpdated.textContent = updatedAt;

  if (state.overview.error) {
    refs.seriesScoreList.innerHTML = `<div class="hero-empty">${escapeHtml(state.overview.error)}</div>`;
    refs.leaderboardList.innerHTML = `<div class="hero-empty">Leaderboard unavailable right now.</div>`;
    return;
  }

  if (state.overview.seriesScores.length === 0) {
    refs.seriesScoreList.innerHTML = `<div class="hero-empty">No playoff series scores are available yet.</div>`;
  } else {
    refs.seriesScoreList.innerHTML = state.overview.seriesScores.map(renderSeriesScoreRow).join("");
  }

  if (state.overview.leaderboard.length === 0) {
    refs.leaderboardList.innerHTML = `<div class="hero-empty">No saved brackets on the board yet.</div>`;
  } else {
    refs.leaderboardList.innerHTML = state.overview.leaderboard.map(renderLeaderboardRow).join("");
  }
}

async function openLeaderboardBracket(challengeId) {
  if (!isSubmissionLocked()) {
    setMessage("Leaderboard brackets unlock after submissions close.", "error");
    renderMessage();
    return;
  }

  state.leaderboardViewer = {
    open: true,
    loading: true,
    challenge: null,
    error: null
  };
  renderLeaderboardViewer();

  try {
    const payload = await api(`/api/leaderboard/${challengeId}`);
    state.leaderboardViewer.challenge = normalizeLeaderboardBracketChallenge(payload.challenge);
    state.leaderboardViewer.loading = false;
    renderLeaderboardViewer();
  } catch (error) {
    state.leaderboardViewer.loading = false;
    state.leaderboardViewer.error = error.message;
    renderLeaderboardViewer();
  }
}

function closeLeaderboardViewer() {
  state.leaderboardViewer = createBracketViewerState();
  renderLeaderboardViewer();
}

function renderLeaderboardViewer() {
  const viewer = state.leaderboardViewer;
  refs.leaderboardViewer.hidden = !viewer.open;

  if (!viewer.open) {
    refs.leaderboardViewerBoard.innerHTML = "";
    return;
  }

  if (viewer.loading) {
    refs.leaderboardViewerTitle.textContent = "Loading bracket";
    refs.leaderboardViewerSummary.textContent = "Pulling the submitted bracket from the locked leaderboard.";
    refs.leaderboardViewerBoard.innerHTML =
      '<div class="hero-empty">Loading bracket...</div>';
    return;
  }

  if (viewer.error) {
    refs.leaderboardViewerTitle.textContent = "Bracket unavailable";
    refs.leaderboardViewerSummary.textContent = viewer.error;
    refs.leaderboardViewerBoard.innerHTML =
      '<div class="hero-empty">That bracket could not be opened right now.</div>';
    return;
  }

  if (!viewer.challenge) {
    refs.leaderboardViewerTitle.textContent = "Submitted bracket";
    refs.leaderboardViewerSummary.textContent = "Open a locked-in leaderboard bracket to see the full tree here.";
    refs.leaderboardViewerBoard.innerHTML = "";
    return;
  }

  const challenge = viewer.challenge;
  const summaryParts = [
    `${challenge.userName} submitted "${challenge.title}"`,
    formatChallengeScore(challenge)
  ];

  if (challenge.availablePoints > 0) {
    summaryParts.push(formatCorrectPickCount(challenge.correctPicks));
  }

  refs.leaderboardViewerTitle.textContent = challenge.title;
  refs.leaderboardViewerSummary.textContent = summaryParts.join(" • ");
  refs.leaderboardViewerBoard.innerHTML = renderBracketBoard(challenge.bracket, {
    interactive: false,
    winnerLabel: "Submitted Winner",
    pendingWinnerCopy: "Champion not selected in this bracket."
  });
  queueBracketLineRender();
}

function renderSubmissionLock() {
  if (state.overview.loading) {
    refs.submissionLockBanner.classList.remove("is-locked");
    refs.submissionLockCountdown.textContent = "Loading deadline...";
    refs.submissionLockCopy.textContent = "Checking when bracket submissions lock.";
    return;
  }

  const lockDate = getSubmissionLockDate();

  if (!lockDate) {
    refs.submissionLockBanner.classList.remove("is-locked");
    refs.submissionLockCountdown.textContent = "Deadline unavailable";
    refs.submissionLockCopy.textContent = "The playoff submission deadline could not be loaded.";
    return;
  }

  const locked = state.overview.loading || isSubmissionLocked();
  refs.submissionLockBanner.classList.toggle("is-locked", locked);

  if (locked) {
    refs.submissionLockCountdown.textContent = "Bracket submissions are locked";
    refs.submissionLockCopy.textContent = `${
      state.overview.submissionLockLabel
    } started ${deadlineFormatter.format(lockDate)}.`;
    return;
  }

  refs.submissionLockCountdown.textContent = `${formatCountdown(lockDate.getTime() - Date.now())} left to submit`;
  refs.submissionLockCopy.textContent = `${
    state.overview.submissionLockLabel
  } starts ${deadlineFormatter.format(lockDate)}.`;
}

function applySubmissionLockState() {
  const locked = state.overview.loading || isSubmissionLocked();

  refs.saveChallengeBtn.disabled = locked;
  refs.saveBracketBoardBtn.disabled = locked;
  refs.newChallengeBtn.disabled = locked;
  refs.demoFieldBtn.disabled = locked;
  refs.clearFieldBtn.disabled = locked;
  refs.challengeTitle.disabled = locked;
  refs.challengeSeason.disabled = locked;
}

function getSubmissionLockDate() {
  const lockAt = typeof state.overview.submissionLockAt === "string" ? new Date(state.overview.submissionLockAt) : null;
  return lockAt && !Number.isNaN(lockAt.getTime()) ? lockAt : null;
}

function isSubmissionLocked() {
  const lockDate = getSubmissionLockDate();
  return Boolean(lockDate && Date.now() >= lockDate.getTime());
}

function ensureSubmissionOpen() {
  if (state.overview.loading) {
    setMessage("Checking the playoff submission deadline. Try again in a second.", "error");
    renderMessage();
    return false;
  }

  if (!isSubmissionLocked()) {
    return true;
  }

  const lockDate = getSubmissionLockDate();
  const lockCopy = lockDate ? deadlineFormatter.format(lockDate) : "the playoff opener";
  setMessage(
    `Bracket submissions locked when ${state.overview.submissionLockLabel ?? "Ottawa at Carolina Game 1"} began on ${lockCopy}.`,
    "error"
  );
  renderMessage();
  return false;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  parts.push(`${String(hours).padStart(days > 0 ? 2 : 1, "0")}h`);
  parts.push(`${String(minutes).padStart(2, "0")}m`);
  parts.push(`${String(seconds).padStart(2, "0")}s`);

  return parts.join(" ");
}

function renderSeriesScoreRow(series) {
  const statusCopy = series.winner ? `${series.winner} clinched the series` : "Series in progress";

  return `
    <article class="series-score-row${series.winner ? " is-complete" : ""}">
      <div class="series-score-copy">
        <span class="series-score-label">${escapeHtml(series.label)}</span>
        <strong class="series-score-line">
          ${escapeHtml(`${series.topTeam} - ${series.bottomTeam} ${series.topWins}-${series.bottomWins}`)}
        </strong>
      </div>
      <span class="series-score-status">${escapeHtml(statusCopy)}</span>
    </article>
  `;
}

function renderLeaderboardRow(entry, index) {
  const isCurrentUser = state.session && entry.userName === state.session.name;
  const scoreCopy =
    entry.availablePoints > 0
      ? `${entry.points}/${entry.availablePoints} pts`
      : `${entry.points} pts`;

  const rowClasses = `leaderboard-row${isCurrentUser ? " is-current-user" : ""}${isSubmissionLocked() ? " is-viewable" : ""}`;
  const rowMarkup = `
      <div class="leaderboard-rank">${index + 1}</div>
      <div class="leaderboard-copy">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(entry.userName)}</span>
      </div>
      <div class="leaderboard-points">
        <strong>${escapeHtml(scoreCopy)}</strong>
        <span>${escapeHtml(formatCorrectPickCount(entry.correctPicks))}</span>
      </div>
  `;

  if (isSubmissionLocked()) {
    return `
      <button class="${rowClasses}" type="button" data-view-bracket="${entry.id}">
        ${rowMarkup}
      </button>
    `;
  }

  return `
    <article class="${rowClasses}">
      ${rowMarkup}
    </article>
  `;
}

function renderChallengeSummary() {
  const seriesWins = countCompletedSeries(state.current.bracket);
  const champion = TEAM_BY_ID[state.current.bracket.series.final.winner];
  const parts = [`${seriesWins}/15 series picked`];

  if (state.current.scoreIsSaved) {
    parts.push(formatChallengeScore(state.current));

    if (state.current.availablePoints > 0) {
      parts.push(formatCorrectPickCount(state.current.correctPicks));
    }
  } else if (state.current.id) {
    parts.push("Save to refresh points");
  }

  parts.push(state.current.season || `${new Date().getFullYear()} Stanley Cup Playoffs`);

  if (champion) {
    parts.push(`${champion.name} winning the Cup`);
  }

  refs.challengeSummary.textContent = parts.join(" • ");
}

function renderChampion() {
  const champion = TEAM_BY_ID[state.current.bracket.series.final.winner];

  if (!champion) {
    refs.championCard.style.setProperty("--champion-primary", "rgba(135, 208, 255, 0.22)");
    refs.championCard.style.setProperty("--champion-secondary", "rgba(13, 29, 52, 0.7)");
    refs.championName.textContent = "No champion picked yet";
    refs.championCopy.textContent = "Finish the bracket and your projected Stanley Cup winner lands here.";
    return;
  }

  refs.championCard.style.setProperty("--champion-primary", champion.primary);
  refs.championCard.style.setProperty("--champion-secondary", champion.secondary);
  refs.championName.textContent = champion.name;
  refs.championCopy.textContent = `This bracket projects ${champion.name} to lift the Cup.`;
}

function renderBracket() {
  refs.bracketColumns.innerHTML = renderBracketBoard(state.current.bracket, {
    interactive: !isSubmissionLocked()
  });
  queueBracketLineRender();
}

function renderBracketBoard(bracket, options = {}) {
  const currentBracket = sanitizeBracket(bracket);
  const champion = TEAM_BY_ID[currentBracket.series.final.winner];
  const winnerLabel = options.winnerLabel ?? "Projected Winner";
  const pendingWinnerCopy = options.pendingWinnerCopy ?? "Champion pending";
  const winnerMarkup = champion
    ? `
      <div class="tree-winner-card" aria-label="${escapeHtml(`${champion.name} ${winnerLabel.toLowerCase()}`)}">
        <span class="tree-winner-label">${escapeHtml(winnerLabel)}</span>
        <div class="winner-logo-wrap">
          ${renderTeamLogo(champion, "winner-logo")}
        </div>
        <strong class="tree-winner-code">${champion.id}</strong>
      </div>
    `
    : `
      <div class="tree-winner-card is-pending">
        <span class="tree-winner-label">${escapeHtml(winnerLabel)}</span>
        <strong>${escapeHtml(pendingWinnerCopy)}</strong>
      </div>
    `;

  return `
    <div class="bracket-tree-board">
      <div class="tree-stage-labels" aria-hidden="true">
        ${BRACKET_STAGE_LABELS.map(renderTreeStageLabel).join("")}
      </div>
      <div class="bracket-tree-canvas">
        <svg class="bracket-tree-lines" aria-hidden="true"></svg>
        <div class="bracket-tree-grid">
          ${BRACKET_TREE_LAYOUT.map((item) => renderTreeSlot(item, currentBracket, options)).join("")}
          <div class="tree-slot tree-slot--winner" style="--tree-col:4; --tree-row:8;">
            ${winnerMarkup}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTreeStageLabel(item) {
  return `
    <span class="tree-stage-label" style="--tree-col:${item.column};">
      ${escapeHtml(item.label)}
    </span>
  `;
}

function renderTreeSlot(item, bracket, options = {}) {
  return `
    <div
      class="tree-slot tree-slot--${item.stage}"
      style="--tree-col:${item.column}; --tree-row:${item.row};"
    >
      ${renderSeriesCard(item.id, { ...options, bracket, variant: "tree", stage: item.stage })}
    </div>
  `;
}

function renderSeriesCard(seriesId, options = {}) {
  const meta = SERIES[seriesId];
  const bracket = options.bracket ?? state.current.bracket;
  const interactive = options.interactive ?? false;
  const series = bracket.series[seriesId];
  const participants = getParticipants(seriesId, bracket);
  const stage = options.stage ?? "series";
  const cardClasses = [
    "series-card",
    options.variant === "tree" ? "series-card--tree" : "",
    stage ? `series-card--${stage}` : ""
  ]
    .filter(Boolean)
    .join(" ");
  const seriesMeta = ROUND_ONE_SERIES.includes(seriesId)
    ? '<p class="series-meta">Official 2026 first-round matchup</p>'
    : `<p class="series-meta">${meta.sources.map((sourceId) => `Winner of ${SERIES[sourceId].label}`).join(" vs. ")}</p>`;
  const picks = participants
    .map((teamId, index) =>
      renderPickTile(seriesId, teamId, series.winner, buildFallbackLabel(seriesId, index), { interactive })
    )
    .join("");

  return `
    <article class="${cardClasses}" data-series-id="${seriesId}">
      <div class="series-head">
        <p class="eyebrow">${escapeHtml(SERIES_STAGE_LABELS[stage] ?? "Series")}</p>
        <h3>${escapeHtml(meta.label)}</h3>
      </div>
      ${seriesMeta}
      <div class="series-picks">${picks}</div>
    </article>
  `;
}

function queueBracketLineRender() {
  if (bracketLineFrame) {
    cancelAnimationFrame(bracketLineFrame);
  }

  bracketLineFrame = requestAnimationFrame(() => {
    bracketLineFrame = 0;
    document.querySelectorAll(".bracket-tree-canvas").forEach((canvas) => {
      drawBracketLines(canvas);
    });
  });
}

function drawBracketLines(canvas) {
  const svg = canvas.querySelector(".bracket-tree-lines");
  const grid = canvas.querySelector(".bracket-tree-grid");

  if (!svg || !grid) {
    return;
  }

  if (window.matchMedia("(max-width: 980px)").matches) {
    svg.innerHTML = "";
    return;
  }

  const gridRect = grid.getBoundingClientRect();
  const paths = [];

  for (const [seriesId, meta] of Object.entries(SERIES)) {
    if (!Array.isArray(meta.sources)) {
      continue;
    }

    const targetRect = getTreeNodeRect(grid, gridRect, seriesId);

    if (!targetRect) {
      continue;
    }

    const leftSources = [];
    const rightSources = [];

    for (const sourceId of meta.sources) {
      const sourceRect = getTreeNodeRect(grid, gridRect, sourceId);

      if (!sourceRect) {
        continue;
      }

      if (sourceRect.centerX < targetRect.centerX) {
        leftSources.push(sourceRect);
      } else {
        rightSources.push(sourceRect);
      }
    }

    paths.push(...buildConnectorGroup(leftSources, targetRect, "right"));
    paths.push(...buildConnectorGroup(rightSources, targetRect, "left"));
  }

  const finalRect = getTreeNodeRect(grid, gridRect, "final");
  const winnerCard = canvas.querySelector(".tree-winner-card");

  if (finalRect && winnerCard) {
    const winnerRect = getElementRect(winnerCard, gridRect);
    const finalX = finalRect.centerX;
    const finalY = finalRect.bottom;
    const winnerY = winnerRect.top;
    const midY = finalY + (winnerY - finalY) / 2;

    paths.push(`
      <path
        class="bracket-tree-path"
        d="M ${finalX} ${finalY} L ${finalX} ${midY} L ${winnerRect.centerX} ${midY} L ${winnerRect.centerX} ${winnerY}"
      />
    `);
  }

  svg.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
  svg.innerHTML = paths.join("");
}

function buildConnectorGroup(sourceRects, targetRect, direction) {
  if (sourceRects.length === 0) {
    return [];
  }

  const sourceEdge =
    direction === "right"
      ? Math.max(...sourceRects.map((rect) => rect.right))
      : Math.min(...sourceRects.map((rect) => rect.left));
  const targetEdge = direction === "right" ? targetRect.left : targetRect.right;
  const elbowX = sourceEdge + (targetEdge - sourceEdge) / 2;

  return sourceRects.map((sourceRect) => buildConnectorPath(sourceRect, targetRect, direction, elbowX));
}

function buildConnectorPath(sourceRect, targetRect, direction, elbowX) {
  const sourceX = direction === "right" ? sourceRect.right : sourceRect.left;
  const targetX = direction === "right" ? targetRect.left : targetRect.right;

  return `
    <path
      class="bracket-tree-path"
      d="M ${sourceX} ${sourceRect.centerY} L ${elbowX} ${sourceRect.centerY} L ${elbowX} ${targetRect.centerY} L ${targetX} ${targetRect.centerY}"
    />
  `;
}

function getTreeNodeRect(grid, gridRect, seriesId) {
  const node = grid.querySelector(`.series-card[data-series-id="${seriesId}"]`);
  return node ? getElementRect(node, gridRect) : null;
}

function getElementRect(element, gridRect) {
  const rect = element.getBoundingClientRect();

  return {
    left: rect.left - gridRect.left,
    right: rect.right - gridRect.left,
    top: rect.top - gridRect.top,
    bottom: rect.bottom - gridRect.top,
    centerX: rect.left - gridRect.left + rect.width / 2,
    centerY: rect.top - gridRect.top + rect.height / 2
  };
}

function renderPickTile(seriesId, teamId, winnerId, fallbackLabel, options = {}) {
  if (!teamId) {
    return `
      <div class="pick-tile is-empty">
        <span class="team-abbr">TBD</span>
        <span class="pick-name">${escapeHtml(fallbackLabel)}</span>
        <span class="pick-helper">Advance a previous winner to unlock this slot.</span>
      </div>
    `;
  }

  const team = TEAM_BY_ID[teamId];
  const interactive = Boolean(options.interactive);
  const locked = !interactive;
  const helperText = interactive
    ? winnerId === teamId
      ? "Selected to advance"
      : "Click to advance"
    : winnerId === teamId
      ? "Submitted pick"
      : "Bracket locked";

  return `
    <button
      type="button"
      class="pick-tile${winnerId === teamId ? " is-selected" : ""}${locked ? " is-locked" : ""}"
      data-series="${seriesId}"
      data-pick="${team.id}"
      aria-label="${escapeHtml(`${team.name}. ${helperText}`)}"
      style="--team-primary:${team.primary}; --team-secondary:${team.secondary};"
      ${locked ? "disabled" : ""}
    >
      <span class="pick-logo-wrap">
        ${renderTeamLogo(team)}
      </span>
      <span class="team-code">${team.id}</span>
      <span class="pick-helper">${helperText}</span>
    </button>
  `;
}

function renderTeamLogo(team, className = "team-logo") {
  return `
    <img
      class="${className}"
      src="${getTeamLogoUrl(team.id)}"
      alt="${escapeHtml(team.name)} logo"
      loading="lazy"
      decoding="async"
    />
  `;
}

function getTeamLogoUrl(teamId) {
  return `${NHL_LOGO_BASE_URL}/${teamId}_light.svg`;
}

function renderHistory() {
  if (state.challenges.length === 0) {
    refs.historyList.innerHTML = `
      <div class="history-empty">
        Save your current bracket and it will show up here as part of your personal challenge archive.
      </div>
    `;
    return;
  }

  refs.historyList.innerHTML = state.challenges
    .map((challenge) => {
      const champion = TEAM_BY_ID[challenge.champion]?.name ?? "Still in progress";
      const currentClass = challenge.id === state.current.id ? " is-current" : "";
      const completedSeries = countCompletedSeries(challenge.bracket);
      const scoreSummary = formatChallengeScore(challenge);
      const correctPickCopy = challenge.availablePoints > 0 ? formatCorrectPickCount(challenge.correctPicks) : null;
      const resultsStatus = formatResultsStatus(challenge);

      return `
        <article class="history-card${currentClass}">
          <div class="history-copy">
            <p class="eyebrow">Saved bracket</p>
            <h3>${escapeHtml(challenge.title)}</h3>
            <p>${escapeHtml(challenge.season)}</p>
            <div class="history-stats">
              <span>${completedSeries}/15 picks made</span>
              <span class="history-stat--score">${escapeHtml(scoreSummary)}</span>
              ${correctPickCopy ? `<span>${escapeHtml(correctPickCopy)}</span>` : ""}
              <span>${escapeHtml(champion)}</span>
              <span>${escapeHtml(resultsStatus)}</span>
              <span>Updated ${escapeHtml(dateFormatter.format(new Date(challenge.updatedAt)))}</span>
            </div>
          </div>
          <div class="history-actions">
            <button class="button" type="button" data-load-id="${challenge.id}">Load</button>
            <button class="button button-ghost" type="button" data-delete-id="${challenge.id}">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMessage() {
  if (!state.message) {
    refs.messageBanner.hidden = true;
    refs.messageBanner.textContent = "";
    refs.messageBanner.removeAttribute("data-tone");
    return;
  }

  refs.messageBanner.hidden = false;
  refs.messageBanner.dataset.tone = state.message.tone;
  refs.messageBanner.textContent = state.message.text;
}

function setMessage(text, tone = "info") {
  state.message = { text, tone };
}

function clearMessage() {
  state.message = null;
}

function createOverviewState() {
  return {
    season: new Date().getFullYear(),
    resultsUpdatedAt: null,
    submissionLockAt: null,
    submissionLockLabel: "Ottawa Senators at Carolina Hurricanes Game 1",
    isSubmissionLocked: false,
    seriesScores: [],
    leaderboard: [],
    error: null,
    loading: true
  };
}

function createBracketViewerState() {
  return {
    open: false,
    loading: false,
    challenge: null,
    error: null
  };
}

function normalizeOverviewPayload(payload) {
  const current = createOverviewState();

  return {
    season: Number.isFinite(payload?.season) ? payload.season : current.season,
    resultsUpdatedAt: typeof payload?.resultsUpdatedAt === "string" ? payload.resultsUpdatedAt : null,
    submissionLockAt: typeof payload?.submissionLockAt === "string" ? payload.submissionLockAt : null,
    submissionLockLabel:
      typeof payload?.submissionLockLabel === "string" ? payload.submissionLockLabel : current.submissionLockLabel,
    isSubmissionLocked: Boolean(payload?.isSubmissionLocked),
    seriesScores: Array.isArray(payload?.seriesScores)
      ? payload.seriesScores
          .map((series) => ({
            seriesId: typeof series?.seriesId === "string" ? series.seriesId : "",
            label: typeof series?.label === "string" ? series.label : "Series",
            topTeam: normalizeTeamId(series?.topTeam) ?? "TBD",
            bottomTeam: normalizeTeamId(series?.bottomTeam) ?? "TBD",
            topWins: Number.isFinite(series?.topWins) ? series.topWins : 0,
            bottomWins: Number.isFinite(series?.bottomWins) ? series.bottomWins : 0,
            winner: normalizeTeamId(series?.winner)
          }))
          .filter((series) => series.seriesId && series.topTeam && series.bottomTeam)
      : current.seriesScores,
    leaderboard: Array.isArray(payload?.leaderboard)
      ? payload.leaderboard.map((entry) => ({
          id: typeof entry?.id === "string" ? entry.id : "",
          title: typeof entry?.title === "string" ? entry.title : "Saved bracket",
          userName: typeof entry?.userName === "string" ? entry.userName : "Unknown user",
          points: Number.isFinite(entry?.points) ? entry.points : 0,
          correctPicks: Number.isFinite(entry?.correctPicks) ? entry.correctPicks : 0,
          availablePoints: Number.isFinite(entry?.availablePoints) ? entry.availablePoints : 0
        }))
      : current.leaderboard,
    error: null,
    loading: false
  };
}

function createChallengeDraft() {
  const year = new Date().getFullYear();

  return {
    id: null,
    title: `${year} Stanley Cup Bracket`,
    season: `${year} Stanley Cup Playoffs`,
    champion: null,
    createdAt: null,
    updatedAt: null,
    points: 0,
    correctPicks: 0,
    availablePoints: 0,
    scoredSeries: [],
    resultsUpdatedAt: null,
    scoreIsSaved: false,
    bracket: createPlayoffBracket()
  };
}

function normalizeChallenge(challenge) {
  const draft = createChallengeDraft();

  return {
    id: challenge.id ?? null,
    title: challenge.title ?? draft.title,
    season: challenge.season ?? draft.season,
    champion: challenge.champion ?? null,
    createdAt: challenge.createdAt ?? null,
    updatedAt: challenge.updatedAt ?? null,
    points: Number.isFinite(challenge.points) ? challenge.points : 0,
    correctPicks: Number.isFinite(challenge.correctPicks) ? challenge.correctPicks : 0,
    availablePoints: Number.isFinite(challenge.availablePoints) ? challenge.availablePoints : 0,
    scoredSeries: Array.isArray(challenge.scoredSeries) ? [...challenge.scoredSeries] : [],
    resultsUpdatedAt: typeof challenge.resultsUpdatedAt === "string" ? challenge.resultsUpdatedAt : null,
    scoreIsSaved: Boolean(challenge.id),
    bracket: sanitizeBracket(challenge.bracket)
  };
}

function normalizeLeaderboardBracketChallenge(challenge) {
  const normalized = normalizeChallenge(challenge ?? {});

  return {
    ...normalized,
    userName: typeof challenge?.userName === "string" ? challenge.userName : "Unknown user"
  };
}

function invalidateCurrentScore() {
  state.current.points = 0;
  state.current.correctPicks = 0;
  state.current.availablePoints = 0;
  state.current.scoredSeries = [];
  state.current.scoreIsSaved = false;
}

function formatChallengeScore(challenge) {
  if ((challenge.availablePoints ?? 0) > 0) {
    return `${challenge.points}/${challenge.availablePoints} pts`;
  }

  if (challenge.resultsUpdatedAt) {
    return "No clinched series scored yet";
  }

  return "Results sync pending";
}

function formatCorrectPickCount(correctPicks) {
  return `${correctPicks} correct ${correctPicks === 1 ? "pick" : "picks"}`;
}

function formatResultsStatus(challenge) {
  if (!challenge.resultsUpdatedAt) {
    return "Results sync pending";
  }

  return `Results synced ${dateFormatter.format(new Date(challenge.resultsUpdatedAt))}`;
}

function hasAssignedPlayoffField(bracket) {
  return ROUND_ONE_SERIES.some((seriesId) => {
    const teams = bracket?.series?.[seriesId]?.teams;
    return Array.isArray(teams) && teams.some(Boolean);
  });
}

function createPlayoffBracket() {
  const bracket = createEmptyBracket();

  for (const [seriesId, teams] of Object.entries(PLAYOFF_FIELD_2026)) {
    bracket.series[seriesId].teams = [...teams];
  }

  return sanitizeBracket(bracket);
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

  return { version: 1, series };
}

function sanitizeBracket(bracket) {
  const clean = createEmptyBracket();
  const sourceSeries =
    bracket && typeof bracket === "object" && bracket.series && typeof bracket.series === "object"
      ? bracket.series
      : {};

  for (const seriesId of ROUND_ONE_SERIES) {
    const nextSeries = sourceSeries[seriesId] ?? {};
    const teamA = normalizeTeamId(nextSeries.teams?.[0]);
    let teamB = normalizeTeamId(nextSeries.teams?.[1]);

    if (teamA && teamA === teamB) {
      teamB = null;
    }

    clean.series[seriesId].teams = [teamA, teamB];
    clean.series[seriesId].winner = normalizeTeamId(nextSeries.winner);
  }

  for (const seriesId of ALL_SERIES.filter((id) => !ROUND_ONE_SERIES.includes(id))) {
    clean.series[seriesId].winner = normalizeTeamId(sourceSeries[seriesId]?.winner);
  }

  for (const seriesId of ROUND_ONE_SERIES) {
    const series = clean.series[seriesId];
    const validTeams = series.teams.filter(Boolean);

    if (validTeams.length !== 2 || !validTeams.includes(series.winner)) {
      series.winner = null;
    }
  }

  for (const seriesId of ALL_SERIES.filter((id) => !ROUND_ONE_SERIES.includes(id))) {
    const validTeams = getParticipants(seriesId, clean).filter(Boolean);

    if (validTeams.length !== 2 || !validTeams.includes(clean.series[seriesId].winner)) {
      clean.series[seriesId].winner = null;
    }
  }

  return clean;
}

function getParticipants(seriesId, bracket = state.current.bracket) {
  if (ROUND_ONE_SERIES.includes(seriesId)) {
    return bracket.series[seriesId].teams;
  }

  return SERIES[seriesId].sources.map((sourceSeriesId) => bracket.series[sourceSeriesId].winner ?? null);
}

function buildFallbackLabel(seriesId, slotIndex) {
  if (ROUND_ONE_SERIES.includes(seriesId)) {
    return SERIES[seriesId].slotHints[slotIndex];
  }

  const sourceSeriesId = SERIES[seriesId].sources[slotIndex];
  return `Winner of ${SERIES[sourceSeriesId].label}`;
}

function countCompletedSeries(bracket) {
  return ALL_SERIES.reduce((total, seriesId) => total + (bracket.series[seriesId].winner ? 1 : 0), 0);
}

function normalizeTeamId(value) {
  if (typeof value !== "string") {
    return null;
  }

  const teamId = value.trim().toUpperCase();
  return TEAM_IDS.has(teamId) ? teamId : null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error ?? "Something went wrong.");
  }

  return payload;
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
