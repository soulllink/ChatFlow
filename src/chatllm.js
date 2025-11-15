// ────────────────────────────────────────────────────────────────────────
// chatllm.js – Ollama API handler (via OpenAI SDK)
// ────────────────────────────────────────────────────────────────────────
import OpenAI from "openai";

// ────── ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ─────────────────────────────────────────
let OLLAMA_BASE_URL = "http://localhost:11434/v1";
let CURRENT_MODEL = "granite4:tiny-h"; // Установите модель по умолчанию
let ollamaClient = null;

// ────── ИНИЦИАЛИЗАЦИЯ КЛИЕНТА ─────────────────────────────────────────
function getClient() {
  // Пересоздаем клиент, только если URL изменился
  if (!ollamaClient || ollamaClient.baseURL !== OLLAMA_BASE_URL) {
    if (!OLLAMA_BASE_URL) {
      console.warn("Ollama Base URL is not set.");
      return null;
    }
    try {
      ollamaClient = new OpenAI({
        baseURL: OLLAMA_BASE_URL,
        apiKey: "ollama", // Требуется, но не используется Ollama
        dangerouslyAllowBrowser: true, // Необходимо для использования в браузере
      });
      console.log("Ollama client initialized for:", OLLAMA_BASE_URL);
    } catch (err) {
      console.error("Failed to initialize Ollama client:", err);
      return null;
    }
  }
  return ollamaClient;
}

// ────── ОСНОВНАЯ ФУНКЦИЯ ──────────────────────────────────────────────
async function callOllamaApi(history = [], prompt, filePart = null) {
  var ai = getClient();
  if (!ai) return "Error: Установите действующий Ollama Base URL";

  // 1. Конвертируем историю в формат OpenAI
  var messages = history.map(function (msg) {
    return {
      role: msg.role.toLowerCase().includes("user") ? "user" : "assistant",
      content: msg.content.replace(/<br\s*\/?>/gi, "\n").trim(),
    };
  });

  // 2. Создаем сообщение пользователя (может быть мультимодальным)
  var userMessage = { role: "user", content: [] };

  if (prompt) {
    userMessage.content.push({ type: "text", text: prompt.trim() });
  }

  if (filePart) {
    try {
      // filePart имеет формат { inlineData: { data: base64Data, mimeType: mimeType } }
      // Восстанавливаем data URL для OpenAI API
      var dataUrl =
        "data:" +
        filePart.inlineData.mimeType +
        ";base64," +
        filePart.inlineData.data;

      userMessage.content.push({
        type: "image_url",
        image_url: {
          url: dataUrl,
        },
      });

      // Добавляем текстовый запрос по умолчанию, если есть только изображение
      if (!prompt) {
        userMessage.content.push({
          type: "text",
          text: "Describe this image.",
        });
      }
    } catch (e) {
      console.error("Error processing file part for Ollama:", e);
      return "Error: Could not process image file.";
    }
  }

  // Если контент - это просто текст, упрощаем его до строки
  if (
    userMessage.content.length === 1 &&
    userMessage.content[0].type === "text"
  ) {
    userMessage.content = userMessage.content[0].text;
  } else if (userMessage.content.length === 0) {
    return "Error: No prompt provided.";
  }

  messages.push(userMessage);

  // 3. Вызываем API
  try {
    var response = await ai.chat.completions.create({
      model: CURRENT_MODEL,
      messages: messages,
    });

    var fullResponse = response?.choices?.[0]?.message?.content || "";
    return fullResponse.trim() || "[Пустой ответ от Ollama]";
  } catch (err) {
    console.error("Ollama API Error:", err);
    return `API Error: ${err.message?.split("\n")[0] || "Неизвестная ошибка"}`;
  }
}

// ────── УПРАВЛЕНИЕ НАСТРОЙКАМИ ───────────────────────────────────
function updateBaseUrl(url) {
  OLLAMA_BASE_URL = url.trim() || "http://localhost:11434/v1";
  ollamaClient = null; // Принудительная ре-инициализация
  console.log("Ollama Base URL обновлён:", OLLAMA_BASE_URL);
}

function updateModel(model) {
  CURRENT_MODEL = model.trim() || "llama3"; // Используем llama3 по умолчанию
  console.log("Модель изменена на:", model);
}

function getDefaultModel() {
  return CURRENT_MODEL;
}

function getDefaultBaseUrl() {
  return OLLAMA_BASE_URL;
}

// ────── ЭКСПОРТ ───────────────────────────────────────────────────────
export {
  callOllamaApi,
  updateBaseUrl,
  updateModel,
  getDefaultModel,
  getDefaultBaseUrl,
};
