import { app } from "./state.js";

function parseMarkdown(text) {
  var imageRegex =
    /!\[(.*?)\]\((https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(\?[^\s]*)?)\)/gi;
  text = text.replace(imageRegex, function (match, alt, url) {
    return (
      '<div class="image-container" style="margin:8px 0;">' +
      '<a href="' +
      url +
      '" download target="_blank" title="Click to download ' +
      (alt || "image") +
      '">' +
      '<img src="' +
      url +
      '" alt="' +
      alt +
      '" style="max-width:100%;border-radius:5px;display:block;">' +
      "</a>" +
      "</div>"
    );
  });

  var rawImage =
    /^(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(\?[^\s]*)?)$/gim;
  text = text.replace(rawImage, function (url) {
    return (
      '<div class="image-container" style="margin:8px 0;">' +
      '<a href="' +
      url +
      '" download target="_blank" title="Click to download image">' +
      '<img src="' +
      url +
      '" alt="AI-generated image" style="max-width:100%;border-radius:5px;display:block;">' +
      "</a>" +
      "</div>"
    );
  });

  var rawDataImage =
    /^(data:image\/(?:png|jpg|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+)$/gim;
  text = text.replace(rawDataImage, function (url) {
    return (
      '<div class="image-container" style="margin:8px 0;">' +
      '<a href="' +
      url +
      '" download="generated-image.png" target="_blank" title="Click to download image">' +
      '<img src="' +
      url +
      '" alt="AI-generated image" style="max-width:100%;border-radius:5px;display:block;">' +
      "</a>" +
      "</div>"
    );
  });

  text = text.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  text = text.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  text = text.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/^\* (.+)$/gim, "<li>$1</li>");
  text = text.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  text = text.replace(
    /`(.+?)`/g,
    '<code style="background:#f4f4f4;padding:2px 4px;border-radius:3px;">$1</code>',
  );
  text = text.replace(/\n/g, "<br>");
  return text;
}

function getChatContext(id) {
  var msgs = [];
  var seen = new Set();
  var cur = id;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    var n = app.nodes.find(function (n) {
      return n.id === cur;
    });
    if (!n) break;
    msgs.unshift({
      role: n.title.includes("User") ? "User" : "AI",
      content: n.body.replace(/<br\s*\/?>/g, " "),
    });
    var inc = app.connections.find(function (c) {
      return c.end === cur;
    });
    cur = inc?.start;
  }
  return msgs;
}

function redrawConnections() {
  // Удаляем старые
  document
    .querySelectorAll(".connection-line, .temp-connection-line")
    .forEach((el) => el.remove());

  app.connections.forEach((c) => {
    const startEl = document.getElementById(c.start);
    const endEl = document.getElementById(c.end);
    if (!startEl || !endEl) return;

    // Важно: используем offsetLeft/offsetTop — они уже учитывают panX/panY!
    const startX = startEl.offsetLeft + startEl.offsetWidth;
    const startY = startEl.offsetTop + startEl.offsetHeight / 2;
    const endX = endEl.offsetLeft;
    const endY = endEl.offsetTop + endEl.offsetHeight / 2;

    const dx = endX - startX;
    const controlOffset = Math.abs(dx) * 0.5;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = c.id;
    path.classList.add("connection-line");
    path.setAttribute(
      "d",
      `M ${startX} ${startY}
       C ${startX + controlOffset} ${startY},
         ${endX - controlOffset} ${endY},
         ${endX} ${endY}`,
    );

    // Делаем линию легко кликабельной
    path.style.stroke = "var(--connection-color, #4d6dff)";
    path.style.strokeWidth = "4";
    path.style.fill = "none";
    path.style.pointerEvents = "stroke";
    path.style.cursor = "pointer";

    // Невидимая толстая копия только для клика
    const hitPath = path.cloneNode();
    hitPath.style.stroke = "transparent";
    hitPath.style.strokeWidth = "20";
    hitPath.addEventListener("click", (e) => {
      e.stopPropagation();
      app.connections = app.connections.filter((conn) => conn.id !== c.id);
      redrawConnections(); // или просто ничего — следующее действие само перерисует
    });

    const svg = document.getElementById("flowchart-canvas");
    svg.appendChild(hitPath);
    svg.appendChild(path);

    // Hover-эффект
    [path, hitPath].forEach((p) => {
      p.addEventListener("mouseenter", () => (path.style.stroke = "#ff4444"));
      p.addEventListener(
        "mouseleave",
        () => (path.style.stroke = "var(--connection-color, #666)"),
      );
    });
  });
}

function fileToGenerativePart(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var parts = dataUrl.split(";base64,");
      if (parts.length < 2) {
        return reject(new Error("Invalid file format."));
      }
      var mimeType = parts[0].split(":")[1];
      var base64Data = parts[1];

      resolve({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    };
    reader.onerror = function (err) {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}

export {
  parseMarkdown,
  getChatContext,
  redrawConnections,
  fileToGenerativePart,
};
