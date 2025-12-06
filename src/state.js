// ────────────────────────────────────────────────────────────────────────
// state.js – Общее состояние приложения
// ────────────────────────────────────────────────────────────────────────

/**
 * This object contains all the nodes, connections, and UI state.
 * It is separated into its own file to avoid circular dependencies.
 * @property {Array<Object>} nodes The nodes in the flowchart.
 * @property {Array<Object>} connections The connections between nodes.
 * @property {boolean} isDragging Whether a node is being dragged.
 * @property {HTMLElement} dragNode The node being dragged.
 * @property {{x: number, y: number}} dragOffset The offset of the mouse from the top-left corner of the dragged node.
 * @property {boolean} isConnecting Whether a connection is being made.
 * @property {Object} connectStart The starting point of the connection.
 * @property {SVGPathElement} tempLine The temporary line drawn when making a connection.
 * @property {number} nodeIdCounter The counter for generating unique node IDs.
 * @property {Object} editingNode The node being edited.
 * @property {string} selectedNode The ID of the selected node.
 * @property {DOMRect} canvasRect The bounding rectangle of the canvas.
 * @property {number} panX The x-panning of the canvas.
 * @property {number} panY The y-panning of the canvas.
 * @property {boolean} isPanning Whether the canvas is being panned.
 * @property {number} panStartX The starting x-coordinate of the pan.
 * @property {number} panStartY The starting y-coordinate of the pan.
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
