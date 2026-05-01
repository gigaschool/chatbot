const MODEL = "gemini-flash-latest";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const STORAGE_KEYS = {
  apiKey: "geminiChat.apiKey",
  instruction: "geminiChat.customInstruction",
  history: "geminiChat.history",
  logs: "geminiChat.logs",
};

const apiKeyInput = document.querySelector("#apiKeyInput");
const instructionInput = document.querySelector("#instructionInput");
const settingsForm = document.querySelector("#settingsForm");
const toggleKeyButton = document.querySelector("#toggleKeyButton");
const clearChatButton = document.querySelector("#clearChatButton");
const clearAllButton = document.querySelector("#clearAllButton");
const exportLogButton = document.querySelector("#exportLogButton");
const openSettingsButton = document.querySelector("#openSettingsButton");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const settingsOverlay = document.querySelector("#settingsOverlay");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const messages = document.querySelector("#messages");
const statusText = document.querySelector("#statusText");

let conversationHistory = loadJson(STORAGE_KEYS.history, []);
let requestLogs = loadJson(STORAGE_KEYS.logs, []);

init();

function init() {
  syncViewportHeight();
  apiKeyInput.value = localStorage.getItem(STORAGE_KEYS.apiKey) || "";
  instructionInput.value = localStorage.getItem(STORAGE_KEYS.instruction) || "";
  renderMessages();
  updateStatus(`${conversationHistory.length} 件の履歴を読み込み済み`);

  window.addEventListener("resize", syncViewportHeight);
  window.visualViewport?.addEventListener("resize", syncViewportHeight);
  window.visualViewport?.addEventListener("scroll", syncViewportHeight);
  settingsForm.addEventListener("submit", saveSettings);
  toggleKeyButton.addEventListener("click", toggleApiKeyVisibility);
  clearChatButton.addEventListener("click", clearChat);
  clearAllButton.addEventListener("click", clearAllData);
  exportLogButton.addEventListener("click", exportLogs);
  openSettingsButton.addEventListener("click", openSettings);
  closeSettingsButton.addEventListener("click", closeSettings);
  settingsOverlay.addEventListener("click", closeSettings);
  document.addEventListener("keydown", closeSettingsWithEscape);
  chatForm.addEventListener("submit", sendMessage);
  messageInput.addEventListener("focus", scrollMessagesToBottom);
}

function saveSettings(event) {
  event.preventDefault();
  persistSettings();
  updateStatus("設定を保存しました");
  closeSettingsOnSmallScreen();
}

function toggleApiKeyVisibility() {
  const isHidden = apiKeyInput.type === "password";
  apiKeyInput.type = isHidden ? "text" : "password";
  toggleKeyButton.textContent = isHidden ? "非表示" : "表示";
}

async function sendMessage(event) {
  event.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  const text = messageInput.value.trim();

  if (!apiKey) {
    updateStatus("API キーを入力して保存してください");
    apiKeyInput.focus();
    return;
  }

  if (!text) {
    return;
  }

  persistSettings();
  const userTurn = createTurn("user", text);
  conversationHistory.push(userTurn);
  persistHistory();
  renderMessages();
  messageInput.value = "";
  setSending(true);

  const requestBody = buildRequestBody();
  const startedAt = new Date().toISOString();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseBody = await response.json().catch(() => ({}));
    addLog({
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: response.ok,
      status: response.status,
      request: maskApiKeyInRequest(requestBody),
      response: responseBody,
    });

    if (!response.ok) {
      throw new Error(extractApiError(responseBody, response.status));
    }

    const answer = extractText(responseBody);
    if (!answer) {
      throw new Error("Gemini からテキスト応答を取得できませんでした。");
    }

    conversationHistory.push(createTurn("model", answer));
    persistHistory();
    renderMessages();
    updateStatus("応答を受信しました");
  } catch (error) {
    conversationHistory.pop();
    persistHistory();
    renderMessages();
    addErrorMessage(error.message);
    updateStatus("送信に失敗しました");
  } finally {
    setSending(false);
  }
}

function buildRequestBody() {
  const instruction = instructionInput.value.trim();
  const body = {
    contents: conversationHistory.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    generationConfig: {
      temperature: 0.7,
    },
  };

  if (instruction) {
    body.system_instruction = {
      parts: [{ text: instruction }],
    };
  }

  return body;
}

function createTurn(role, text) {
  return {
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

function renderMessages() {
  messages.innerHTML = "";

  if (conversationHistory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "API キーと必要ならカスタムインストラクションを保存して、最初のメッセージを送信してください。会話履歴は次回アクセス時にも復元されます。";
    messages.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const turn of conversationHistory) {
    fragment.append(createMessageElement(turn.role, turn.text, turn.createdAt));
  }
  messages.append(fragment);
  scrollMessagesToBottom();
}

function createMessageElement(role, text, createdAt) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = `${role === "user" ? "あなた" : "Gemini"} ・ ${formatDate(createdAt)}`;

  const body = document.createElement("div");
  body.textContent = text;

  article.append(meta, body);
  return article;
}

function addErrorMessage(text) {
  const article = document.createElement("article");
  article.className = "message error";

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = "エラー";

  const body = document.createElement("div");
  body.textContent = text;

  article.append(meta, body);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}

function extractText(responseBody) {
  return responseBody?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

function extractApiError(responseBody, status) {
  const apiMessage = responseBody?.error?.message;
  return apiMessage ? `HTTP ${status}: ${apiMessage}` : `HTTP ${status}: Gemini API request failed`;
}

function addLog(entry) {
  requestLogs.push(entry);
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(requestLogs));
}

function exportLogs() {
  const payload = {
    exportedAt: new Date().toISOString(),
    model: MODEL,
    logs: requestLogs,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gemini-chat-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  updateStatus("ログを書き出しました");
}

function clearChat() {
  conversationHistory = [];
  requestLogs = [];
  localStorage.removeItem(STORAGE_KEYS.history);
  localStorage.removeItem(STORAGE_KEYS.logs);
  renderMessages();
  updateStatus("会話とログを消去しました");
  closeSettingsOnSmallScreen();
}

function clearAllData() {
  conversationHistory = [];
  requestLogs = [];
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  apiKeyInput.value = "";
  instructionInput.value = "";
  renderMessages();
  updateStatus("保存データをすべて削除しました");
  closeSettingsOnSmallScreen();
}

function openSettings() {
  document.body.classList.add("settings-open");
  settingsOverlay.hidden = false;
  openSettingsButton.setAttribute("aria-expanded", "true");
}

function closeSettings() {
  document.body.classList.remove("settings-open");
  settingsOverlay.hidden = true;
  openSettingsButton.setAttribute("aria-expanded", "false");
}

function closeSettingsWithEscape(event) {
  if (event.key === "Escape") {
    closeSettings();
  }
}

function closeSettingsOnSmallScreen() {
  if (window.matchMedia("(max-width: 820px)").matches) {
    closeSettings();
  }
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(conversationHistory));
}

function persistSettings() {
  localStorage.setItem(STORAGE_KEYS.apiKey, apiKeyInput.value.trim());
  localStorage.setItem(STORAGE_KEYS.instruction, instructionInput.value.trim());
}

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function maskApiKeyInRequest(request) {
  return JSON.parse(JSON.stringify(request));
}

function setSending(isSending) {
  sendButton.disabled = isSending;
  sendButton.textContent = isSending ? "送信中" : "送信";
  messageInput.disabled = isSending;
  updateStatus(isSending ? "Gemini に送信中..." : statusText.textContent);
}

function updateStatus(text) {
  statusText.textContent = text;
}

function syncViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--viewport-height", `${height}px`);
}

function scrollMessagesToBottom() {
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
