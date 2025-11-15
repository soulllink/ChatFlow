// ────────────────────────────────────────────────────────────────────────
// nodes.js – node lifecycle & connections
// ────────────────────────────────────────────────────────────────────────
import { app } from "./state.js";
import { parseMarkdown, getChatContext, redrawConnections } from "./utility.js";
import { callOllamaApi } from "./chatllm.js"; // ИЗМЕНЕНО

// ────── NODE CREATION ─────────────────────────────────────────────────
function createNode(x, y, title = "New Node", body = "") {
  // ... (код без изменений)
  var nodeId = "node-" + app.nodeIdCounter++;
  var node = { id: nodeId, x, y, title, body };
  app.nodes.push(node);

  var el = document.createElement("div");
  el.className = "node";
  el.id = nodeId;
  el.style.left = x + "px";
  el.style.top = y + "px";

  var t = document.createElement("div");
  t.className = "node-title";
  t.textContent = title;

  var b = document.createElement("div");
  b.className = "node-body";
  b.innerHTML = parseMarkdown(
    body.length > 250 ? body.slice(0, 250) + "..." : body,
  );

  var inP = document.createElement("div");
  inP.className = "node-connection-point input";
  inP.dataset.nodeId = nodeId;
  inP.dataset.type = "input";

  var outP = document.createElement("div");
  outP.className = "node-connection-point output";
  outP.dataset.nodeId = nodeId;
  outP.dataset.type = "output";

  // Resend button (Blue "R")
  var resendBtn = document.createElement("button");
  resendBtn.className = "resend-btn";
  resendBtn.innerHTML = "R";
  resendBtn.title = "Resend merged input";
  resendBtn.addEventListener("click", handleResend);

  // Delete button (Red "X")
  var deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "X";
  deleteBtn.title = "Delete node";
  deleteBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    deleteNode(nodeId);
  });

  el.append(t, b, inP, outP, resendBtn, deleteBtn);
  document.getElementById("content").appendChild(el);

  el.addEventListener("mousedown", handleNodeMouseDown);
  el.addEventListener("dblclick", handleNodeDoubleClick);
  el.addEventListener("contextmenu", handleNodeRightClick);
  el.addEventListener("click", handleNodeClick);
  inP.addEventListener("mousedown", handleConnectionPointMouseDown);
  outP.addEventListener("mousedown", handleConnectionPointMouseDown);

  return node;
}

// ────── RESEND HANDLER (ИЗМЕНЕНО) ─────────────────────
function handleResend(e) {
  e.stopPropagation();
  var el = e.currentTarget.parentNode;
  var nodeId = el.id;

  var context = getChatContext(nodeId); // Full history
  var lastUserMessage =
    context.findLast(function (m) {
      return m.role === "User";
    })?.content || "";

  if (!lastUserMessage) {
    alert("No user message found in context.");
    return;
  }

  (async function () {
    // ИЗМЕНЕН ВЫЗОВ API (и добавлен null для filePart)
    var resp = await callOllamaApi(context.slice(0, -1), lastUserMessage, null);
    var currentNode = app.nodes.find(function (n) {
      return n.id === nodeId;
    });
    var newX = currentNode.x + 300;
    var newY = currentNode.y + 70;
    var newNode = createNode(newX, newY, "AI Response (Resend)", resp);
    createConnection(nodeId, newNode.id);
    redrawConnections();
  })();
}

// ────── CONNECTION DRAWING (без изменений) ────────────────────────────
// ... (остальной код в nodes.js остается без изменений)
// ...
function drawConnection(c) {
  var s = document.getElementById(c.start);
  var e = document.getElementById(c.end);
  if (!s || !e) return;

  var sr = s.getBoundingClientRect();
  var er = e.getBoundingClientRect();
  var cr = document.getElementById("flowchart-canvas").getBoundingClientRect();

  var sx = sr.right - cr.left;
  var sy = sr.top + sr.height / 2 - cr.top;
  var ex = er.left - cr.left;
  var ey = er.top + er.height / 2 - cr.top;
  var dx = ex - sx;
  var cx1 = sx + Math.abs(dx) * 0.5;
  var cx2 = ex - Math.abs(dx) * 0.5;

  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.id = c.id;
  path.setAttribute("class", "connection-line");
  path.setAttribute(
    "d",
    "M " +
      sx +
      " " +
      sy +
      " C " +
      cx1 +
      " " +
      sy +
      ", " +
      cx2 +
      " " +
      ey +
      ", " +
      ex +
      " " +
      ey,
  );
  path.addEventListener("click", function (e) {
    e.stopPropagation();
    deleteConnection(c.id);
  });
  document.getElementById("flowchart-canvas").appendChild(path);
}

// ────── CONNECTION CREATION ───────────────────────────────────────────
function createConnection(startId, endId) {
  if (
    app.connections.some(function (c) {
      return c.start === startId && c.end === endId;
    })
  )
    return null;
  var conn = {
    id: "conn-" + startId + "-" + endId,
    start: startId,
    end: endId,
  };
  app.connections.push(conn);
  drawConnection(conn);
  return conn;
}

// ────── DELETE HELPERS ────────────────────────────────────────────────
function deleteConnection(id) {
  // Эта функция теперь УДАЛЯЕТ ТОЛЬКО ИЗ СОСТОЯНИЯ.
  app.connections = app.connections.filter(function (c) {
    return c.id !== id;
  });
  // Мы больше не пытаемся удалить DOM-элемент отсюда,
  // так как redrawConnections() позаботится об этом.
  // document.getElementById(id)?.remove(); // <-- ЭТА ЛИНИЯ БЫЛА ИСТОЧНИКОМ ОШИБКИ
}

function deleteNode(id) {
  // Находим все ID соединений, которые нужно удалить
  var connectionsToUpdate = app.connections.filter(function (c) {
    return c.start === id || c.end === id;
  });

  // Удаляем их из состояния
  connectionsToUpdate.forEach(function (c) {
    deleteConnection(c.id);
  });

  // Удаляем узел из состояния
  app.nodes = app.nodes.filter(function (n) {
    return n.id !== id;
  });

  // Удаляем DOM-элемент узла
  document.getElementById(id)?.remove();

  if (app.selectedNode === id) {
    app.selectedNode = null;
  }

  // <-- ИСПРАВЛЕНИЕ:
  // Принудительно перерисовываем все "веревки".
  // Он сотрет все старые линии и нарисует только те,
  // что остались в app.connections.
  redrawConnections();
}

// ────── EVENT HANDLERS ────────────────────────────────────────────────
function handleNodeMouseDown(e) {
  if (e.button !== 0) return;
  e.preventDefault();
  var el = e.currentTarget;
  app.dragNode = el;
  var r = el.getBoundingClientRect();
  app.dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
  app.isDragging = true;
  el.classList.add("dragging");
}
function handleNodeDoubleClick(e) {
  var el = e.currentTarget;
  var node = app.nodes.find(function (n) {
    return n.id === el.id;
  });
  if (!node) return;
  document.getElementById("zoom-title").textContent = node.title;
  document.getElementById("zoom-body").innerHTML = parseMarkdown(node.body);
  document.getElementById("zoom-modal").style.display = "flex";
}
function handleNodeRightClick(e) {
  e.preventDefault();
  var el = e.currentTarget;
  var node = app.nodes.find(function (n) {
    return n.id === el.id;
  });
  if (!node) return;
  app.editingNode = node;
  document.getElementById("node-title").value = node.title;
  document.getElementById("node-body").value = node.body;
  document.getElementById("node-modal").style.display = "flex";
}
function handleNodeClick(e) {
  e.stopPropagation();
  var el = e.currentTarget;
  var id = el.id;
  if (app.selectedNode)
    document.getElementById(app.selectedNode).classList.remove("selected");
  app.selectedNode = id;
  el.classList.add("selected");
}
function handleConnectionPointMouseDown(e) {
  e.stopPropagation();
  e.preventDefault();
  var p = e.target;
  if (p.dataset.type !== "output") return;
  app.isConnecting = true;
  app.connectStart = { nodeId: p.dataset.nodeId };
  p.classList.add("connecting");

  var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.id = "temp-line";
  line.setAttribute("class", "temp-connection-line");
  document.getElementById("flowchart-canvas").appendChild(line);
  app.tempLine = line;
}

// ────── EXPORTS ───────────────────────────────────────────────────────
export {
  createNode,
  createConnection,
  drawConnection,
  deleteNode,
  deleteConnection,
  handleNodeMouseDown,
  handleNodeDoubleClick,
  handleNodeRightClick,
  handleNodeClick,
  handleConnectionPointMouseDown,
  handleResend,
};
