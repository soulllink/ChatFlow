// ────────────────────────────────────────────────────────────────────────
// state.js – Общее состояние приложения
// ────────────────────────────────────────────────────────────────────────

/**
 * Этот объект содержит все узлы, соединения и состояние UI
 * Он вынесен в отдельный файл, чтобы избежать циклических зависимостей.
 */
export var app = {
  nodes: [],
  connections: [],
  isDragging: false,
  dragNode: null,
  dragOffset: { x: 0, y: 0 },
  isConnecting: false,
  connectStart: null,
  tempLine: null,
  nodeIdCounter: 0,
  editingNode: null,
  selectedNode: null,
  canvasRect: null,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
};
