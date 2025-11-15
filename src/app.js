// ────────────────────────────────────────────────────────────────────────
// app.js – entry point, UI wiring, canvas handling (OLLAMA REFACTOR)
// ────────────────────────────────────────────────────────────────────────
import { createConnection, createNode, deleteNode } from "./nodes.js";
import {
  callOllamaApi, // ИЗМЕНЕНО
  updateBaseUrl, // ИЗМЕНЕНО
  updateModel, // ИЗМЕНЕНО
  getDefaultModel, // ИЗМЕНЕНО
  getDefaultBaseUrl, // ИЗМЕНЕНО
} from "./chatllm.js"; // ИЗМЕНЕНО
import {
  parseMarkdown,
  getChatContext,
  redrawConnections,
  fileToGenerativePart,
} from "./utility.js";
import { app } from "./state.js";

// ────── DOM ELEMENTS (ИЗМЕНЕНО) ───────────────────────────────────────
var canvas = document.getElementById("flowchart-canvas");
var content = document.getElementById("content");
var canvasContainer = document.getElementById("canvas-container");
var nodeModal = document.getElementById("node-modal");
var zoomModal = document.getElementById("zoom-modal");
var saveNodeBtn = document.getElementById("save-node-btn");
var cancelNodeBtn = document.getElementById("cancel-node-btn");
var nodeTitleInput = document.getElementById("node-title");
var nodeBodyInput = document.getElementById("node-body");
var zoomTitle = document.getElementById("zoom-title");
var zoomBody = document.getElementById("zoom-body");
var chatInput = document.getElementById("chat-input");
var sendBtn = document.getElementById("send-btn");
// ИЗМЕНЕНЫ ЭЛЕМЕНТЫ НИЖЕ
var baseUrlInput = document.getElementById("ollama-base-url-input");
var modelInput = document.getElementById("model-input");
// КОНЕЦ ИЗМЕНЕНИЙ
var saveGraphBtn = document.getElementById("save-graph-btn");
var loadGraphBtn = document.getElementById("load-graph-btn");
var loadFileInput = document.getElementById("load-file-input");
var fileInput = document.getElementById("file-input");

// ────── UI SYNC (ИЗМЕНЕНО) ────────────────────────────────────────────
baseUrlInput.value = getDefaultBaseUrl();
baseUrlInput.addEventListener("change", function (e) {
  var url = e.target.value.trim();
  updateBaseUrl(url);
  console.log("Ollama Base URL set.");
});

modelInput.value = getDefaultModel();
modelInput.addEventListener("change", function (e) {
  updateModel(e.target.value);
  console.log("Ollama model set.");
});

// ────── SAVE / LOAD GRAPH (без изменений) ────────────────────────────────
saveGraphBtn.addEventListener("click", function () {
  // ... (код без изменений)
  var data = {
    nodes: app.nodes.map(function (n) {
      return {
        id: n.id,
        x: n.x,
        y: n.y,
        title: n.title,
        body: n.body,
      };
    }),
    connections: app.connections.map(function (c) {
      return { start: c.start, end: c.end };
    }),
    panX: app.panX,
    panY: app.panY,
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "flowchart.json";
  a.click();
  URL.revokeObjectURL(url);
});

loadGraphBtn.addEventListener("click", function () {
  // ... (код без изменений)
  loadFileInput.click();
});
loadFileInput.addEventListener("change", function (e) {
  // ... (код без изменений)
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var data = JSON.parse(ev.target.result);
      app.nodes.forEach(function (n) {
        document.getElementById(n.id)?.remove();
      });
      app.connections.forEach(function (c) {
        document.getElementById(c.id)?.remove();
      });
      app.nodes = [];
      app.connections = [];
      app.nodeIdCounter = 0;
      app.panX = data.panX || 0;
      app.panY = data.panY || 0;
      content.style.transform =
        "translate(" + app.panX + "px, " + app.panY + "px)";
      data.nodes?.forEach(function (n) {
        var node = createNode(n.x, n.y, n.title, n.body);
        node.id = n.id;
        var num = parseInt(n.id.split("-")[1]);
        if (num >= app.nodeIdCounter) app.nodeIdCounter = num + 1;
      });
      data.connections?.forEach(function (c) {
        createConnection(c.start, c.end);
      });
      redrawConnections();
    } catch (err) {
      alert("Invalid JSON file");
      console.error(err);
    }
  };
  reader.readAsText(file);
  loadFileInput.value = null;
});

// ────── CHAT HANDLER (ИЗМЕНЕНО) ─────────────────────────────
async function handleSendChat() {
  var prompt = chatInput.value.trim();
  var file = fileInput.files[0];

  // --- ВОТ ИЗМЕНЕНИЕ ---
  // Если и промпт, и файл пустые, создаем пустой узел
  if (!prompt && !file) {
    console.log("Empty input, creating a new empty node.");

    var rect = canvasContainer.getBoundingClientRect();
    var x,
      y,
      parentId = null;

    if (app.selectedNode) {
      parentId = app.selectedNode;
      var parentNode = app.nodes.find(function (n) {
        return n.id === parentId;
      });
      if (parentNode) {
        x = parentNode.x + 300; // Размещаем справа от родителя
        y = parentNode.y;
      } else {
        // На случай, если узел не найден (не должно случиться)
        x = -app.panX + rect.width / 2 - 120;
        y = -app.panY + rect.height / 2 - 50;
      }
    } else {
      // Нет выбранного узла, размещаем по центру
      x = -app.panX + rect.width / 2 - 120;
      y = -app.panY + rect.height / 2 - 50;
    }

    var newNode = createNode(x, y, "Empty Node", ""); // Создаем узел

    if (parentId) {
      createConnection(parentId, newNode.id); // Соединяем
    }

    return; // <-- Важно: выходим из функции, чтобы не вызывать API
  }
  // --- КОНЕЦ ИЗМЕНЕНИЯ ---

  // ИЗМЕНЕНА ПРОВЕРКА
  if (!baseUrlInput.value.trim()) {
    alert("Введите ваш Ollama Base URL");
    baseUrlInput.focus();
    return;
  }
  if (!modelInput.value.trim()) {
    alert("Введите имя модели Ollama");
    modelInput.focus();
    return;
  }

  chatInput.disabled = sendBtn.disabled = true;
  sendBtn.textContent = "Processing...";

  var filePart = null;
  if (file) {
    try {
      filePart = await fileToGenerativePart(file);
    } catch (err) {
      alert("Error reading file: " + err.message);
      chatInput.disabled = sendBtn.disabled = false;
      sendBtn.textContent = "Send";
      return;
    }
  }

  var rect = canvasContainer.getBoundingClientRect();
  var x,
    y,
    context = [],
    lastId = null;

  if (app.selectedNode) {
    context = getChatContext(app.selectedNode);
    lastId = app.selectedNode;
    var n = app.nodes.find(function (n) {
      return n.id === lastId;
    });
    x = n.x + 300;
    y = n.y;
    document.getElementById(app.selectedNode).classList.remove("selected");
    app.selectedNode = null;
  } else {
    x = -app.panX + rect.width / 2 - 120;
    y = -app.panY + rect.height / 2 - 50;
  }

  var userNode = createNode(
    x,
    y - 70,
    "User",
    prompt + (file ? " [File Attached]" : ""),
  );
  if (lastId) createConnection(lastId, userNode.id);

  // ИЗМЕНЕН ВЫЗОВ API
  var aiResp = await callOllamaApi(context, prompt, filePart);

  var finalResp = aiResp?.trim()
    ? aiResp
    : "[Failed to generate response]\n\n" +
      (aiResp || "Empty response from Ollama.");

  var aiNode = createNode(
    userNode.x + 300,
    userNode.y + 70,
    "AI Response",
    finalResp,
  );
  createConnection(userNode.id, aiNode.id);

  chatInput.value = "";
  fileInput.value = null;
  sendBtn.textContent = "Send";
  chatInput.disabled = sendBtn.disabled = false;
  redrawConnections();
}

sendBtn.addEventListener("click", handleSendChat);
chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendChat();
  }
});

// ────── MODAL HANDLERS (без изменений) ────────────────────────────────
saveNodeBtn.addEventListener("click", function () {
  // ... (код без изменений)
  var title = nodeTitleInput.value.trim() || "Untitled Node";
  var body = nodeBodyInput.value.trim() || "No content";

  if (app.editingNode) {
    app.editingNode.title = title;
    app.editingNode.body = body;

    var nodeElement = document.getElementById(app.editingNode.id);
    nodeElement.querySelector(".node-title").textContent = title;
    nodeElement.querySelector(".node-body").innerHTML = parseMarkdown(
      body.length > 250 ? body.substring(0, 250) + "..." : body,
    );
  }
  nodeModal.style.display = "none";
});
// ... (остальной код modal handlers и global event listeners без изменений)
// ...
// ────── GLOBAL EVENT LISTENERS (без изменений) ───────
// ... (весь оставшийся код в app.js остается без изменений)
// ...
// Делаем wormhole-кнопку отправки
document.getElementById("wormhole-icon").addEventListener("click", () => {
  document.getElementById("send-btn").click();
});

// Опционально: отправка по Enter
document.getElementById("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    document.getElementById("send-btn").click();
  }
});
cancelNodeBtn.addEventListener("click", function () {
  nodeModal.style.display = "none";
});

document.querySelectorAll(".close-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    nodeModal.style.display = "none";
    zoomModal.style.display = "none";
  });
});

window.addEventListener("click", function (e) {
  if (e.target === nodeModal) {
    nodeModal.style.display = "none";
  }
  if (e.target === zoomModal) {
    zoomModal.style.display = "none";
  }
});

// ... (handleCanvasMouseDown, mousemove, mouseup, keydown, click, load)
// ... (Все глобальные слушатели остаются как есть)

/**
 * Обработчик mousedown на канвасе для панорамирования
 */
function handleCanvasMouseDown(e) {
  if (e.button !== 0) return;

  var target = e.target;
  var isOnNode = target.closest && target.closest(".node");
  var isOnConnectionPoint =
    target.classList && target.classList.contains("node-connection-point");

  if (isOnNode || isOnConnectionPoint) return;

  var isOnCanvas =
    target === canvasContainer ||
    target === content ||
    target === canvas ||
    target.tagName.toLowerCase() === "svg";

  if (isOnCanvas) {
    e.preventDefault();
    app.isPanning = true;
    app.panStartX = e.clientX - app.panX;
    app.panStartY = e.clientY - app.panY;
    canvasContainer.style.cursor = "grabbing";
  }
}

/**
 * Глобальный обработчик mousemove для перетаскивания, панорамирования и соединений
 */
document.addEventListener("mousemove", function (e) {
  var containerRect = canvasContainer.getBoundingClientRect();

  if (app.isDragging && app.dragNode) {
    // ИСПРАВЛЕНО: Учитываем panX и panY при перетаскивании
    var x = e.clientX - containerRect.left - app.dragOffset.x - app.panX;
    var y = e.clientY - containerRect.top - app.dragOffset.y - app.panY;

    app.dragNode.style.left = x + "px";
    app.dragNode.style.top = y + "px";

    var node = app.nodes.find(function (n) {
      return n.id === app.dragNode.id;
    });
    if (node) {
      node.x = x;
      node.y = y;
    }

    redrawConnections();
  } else if (app.isConnecting && app.tempLine) {
    var startNode = document.getElementById(app.connectStart.nodeId);
    var startRect = startNode.getBoundingClientRect();
    var canvasRect = canvas.getBoundingClientRect();

    var startX = startRect.right - canvasRect.left;
    var startY = startRect.top + startRect.height / 2 - canvasRect.top;
    var endX = e.clientX - canvasRect.left;
    var endY = e.clientY - canvasRect.top;

    var dx = endX - startX;
    var cx1 = startX + Math.abs(dx) * 0.5;
    var cx2 = endX - Math.abs(dx) * 0.5;

    var d =
      "M " +
      startX +
      " " +
      startY +
      " C " +
      cx1 +
      " " +
      startY +
      ", " +
      cx2 +
      " " +
      endY +
      ", " +
      endX +
      " " +
      endY;
    app.tempLine.setAttribute("d", d);
  } else if (app.isPanning) {
    // Логика панорамирования
    app.panX = e.clientX - app.panStartX;
    app.panY = e.clientY - app.panStartY;
    content.style.transform =
      "translate(" + app.panX + "px, " + app.panY + "px)";
  }
});

/**
 * Глобальный обработчик mouseup для завершения всех действий
 */
document.addEventListener("mouseup", function (e) {
  if (app.isDragging && app.dragNode) {
    app.dragNode.classList.remove("dragging");
    app.isDragging = false;
    app.dragNode = null;
    redrawConnections();
  } else if (app.isConnecting) {
    var target = document.elementFromPoint(e.clientX, e.clientY);

    if (
      target &&
      target.classList.contains("node-connection-point") &&
      target.dataset.type === "input" &&
      target.dataset.nodeId !== app.connectStart.nodeId
    ) {
      createConnection(app.connectStart.nodeId, target.dataset.nodeId);
    }

    if (app.tempLine) {
      app.tempLine.remove();
      app.tempLine = null;
    }

    var startPoint = document.querySelector(
      '.node-connection-point[data-node-id="' +
        app.connectStart.nodeId +
        '"][data-type="output"]',
    );
    if (startPoint) {
      startPoint.classList.remove("connecting");
    }

    app.isConnecting = false;
    app.connectStart = null;
    redrawConnections();
  } else if (app.isPanning) {
    // Завершение панорамирования
    app.isPanning = false;
    canvasContainer.style.cursor = "default";
  }
});

/**
 * Глобальный обработчик keydown для Delete и Escape
 */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (app.isConnecting) {
      if (app.tempLine) {
        app.tempLine.remove();
        app.tempLine = null;
      }

      var startPoint = document.querySelector(
        '.node-connection-point[data-node-id="' +
          app.connectStart.nodeId +
          '"][data-type="output"]',
      );
      if (startPoint) {
        startPoint.classList.remove("connecting");
      }

      app.isConnecting = false;
      app.connectStart = null;
    }

    nodeModal.style.display = "none";
    zoomModal.style.display = "none";
  }

  // Удаление узла
  if (e.key === "Delete" && app.selectedNode) {
    // Убедимся, что фокус не в поле ввода
    if (
      document.activeElement === chatInput ||
      // document.activeElement === apiKeyInput || // <-- УДАЛЕНО
      document.activeElement === baseUrlInput || // <-- ДОБАВЛЕНО
      document.activeElement === modelInput || // <-- ДОБАВЛЕНО
      document.activeElement === nodeTitleInput ||
      document.activeElement === nodeBodyInput
    ) {
      return;
    }
    deleteNode(app.selectedNode);
    app.selectedNode = null;
  }
});

/**
 * Обработчик клика по канвасу для снятия выделения
 */
canvasContainer.addEventListener("click", function (e) {
  var target = e.target;
  var isOnNode = target.closest && target.closest(".node");
  // Если клик не по узлу и есть выделенный узел - снимаем выделение
  if (!isOnNode && app.selectedNode) {
    var prev = document.getElementById(app.selectedNode);
    if (prev) prev.classList.remove("selected");
    app.selectedNode = null;
  }
});

// Добавляем слушатель mousedown для панорамирования
canvasContainer.addEventListener("mousedown", handleCanvasMouseDown);

// Устанавливаем canvasRect при загрузке
window.addEventListener("load", function () {
  app.canvasRect = canvasContainer.getBoundingClientRect();
});
