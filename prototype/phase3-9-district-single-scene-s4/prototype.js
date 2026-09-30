(function () {
  "use strict";

  const MANIFEST_URL = "./waterside-s4-aquarium-scene.json";
  const PROJECTS_URL = "../../portfolio-city/data/projects.json";

  const viewport = document.getElementById("district-viewport");
  const scene = document.getElementById("district-scene");
  const image = document.getElementById("district-image");
  const svg = document.getElementById("project-hotspots");
  const preview = document.getElementById("project-preview");
  const title = document.getElementById("project-title");
  const building = document.getElementById("project-building");
  const summary = document.getElementById("project-summary");
  const type = document.getElementById("project-type");
  const route = document.getElementById("project-route");
  const close = document.getElementById("close-preview");
  const status = document.getElementById("status");
  const debugScene = document.getElementById("debug-scene");
  const debugImages = document.getElementById("debug-images");
  const debugHotspots = document.getElementById("debug-hotspots");
  const debugProject = document.getElementById("debug-project");

  const state = {
    manifest: null,
    projects: new Map(),
    activeId: null,
    returnFocus: null
  };

  function polygonPoints(points) {
    return points.map((point) => point[0] + "," + point[1]).join(" ");
  }

  function centroid(points) {
    const total = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
    return [total[0] / points.length, total[1] / points.length];
  }

  function project(id) {
    return state.projects.get(id);
  }

  function clearActive() {
    svg.querySelectorAll("[data-project-hotspot]").forEach((node) => {
      node.dataset.active = "false";
    });
  }

  function openPreview(id, trigger) {
    const item = project(id);
    if (!item) return;
    state.activeId = id;
    state.returnFocus = trigger || null;
    clearActive();
    if (trigger) trigger.dataset.active = "true";

    title.textContent = item.title;
    building.textContent = item.building;
    summary.textContent = item.summary;
    type.textContent = item.type;
    route.href = item.route;
    route.dataset.canonicalRoute = item.route;
    preview.hidden = false;
    debugProject.textContent = id;
    status.textContent = item.title + " のプレビューを開きました。";
    title.focus({ preventScroll: true });
  }

  function closePreview() {
    if (!state.activeId) return;
    const trigger = state.returnFocus;
    state.activeId = null;
    state.returnFocus = null;
    clearActive();
    preview.hidden = true;
    debugProject.textContent = "none";
    status.textContent = "作品プレビューを閉じました。";
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  }

  function buildHotspots() {
    const ns = "http://www.w3.org/2000/svg";
    state.manifest.projects.forEach((entry) => {
      const item = project(entry.id);
      if (!item) throw new Error("Unknown project in S4 manifest: " + entry.id);

      const group = document.createElementNS(ns, "g");
      group.dataset.projectGroup = entry.id;

      const polygon = document.createElementNS(ns, "polygon");
      polygon.classList.add("project-hotspot");
      polygon.dataset.projectHotspot = entry.id;
      polygon.dataset.active = "false";
      polygon.setAttribute("points", polygonPoints(entry.hotspot));
      polygon.setAttribute("tabindex", "0");
      polygon.setAttribute("role", "button");
      polygon.setAttribute("aria-label", item.title + " を選択");
      polygon.addEventListener("click", () => openPreview(entry.id, polygon));
      polygon.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openPreview(entry.id, polygon);
      });

      const center = centroid(entry.hotspot);
      const label = document.createElementNS(ns, "text");
      label.classList.add("project-hotspot-label");
      label.setAttribute("x", String(center[0]));
      label.setAttribute("y", String(center[1]));
      label.setAttribute("dy", ".35em");
      label.setAttribute("aria-hidden", "true");
      label.textContent = item.building;

      group.append(polygon, label);
      svg.append(group);
    });
    debugHotspots.textContent = String(svg.querySelectorAll("[data-project-hotspot]").length);
  }

  function bindEvents() {
    close.addEventListener("click", closePreview);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.activeId) {
        event.preventDefault();
        closePreview();
      }
    });
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load " + url);
    return response.json();
  }

  async function load() {
    const [manifest, projectsData] = await Promise.all([
      loadJson(MANIFEST_URL),
      loadJson(PROJECTS_URL)
    ]);
    state.manifest = manifest;
    projectsData.projects
      .filter((item) => item.district === "waterside-play")
      .forEach((item) => state.projects.set(item.id, item));

    image.addEventListener("load", () => {
      debugScene.textContent = image.naturalWidth + "x" + image.naturalHeight;
      debugImages.textContent = String(scene.querySelectorAll("img").length);
    });
    image.addEventListener("error", () => {
      debugScene.textContent = "load error";
    });
    image.src = manifest.scene.asset;

    buildHotspots();
    bindEvents();
  }

  load().catch((error) => {
    debugScene.textContent = "prototype error";
    status.textContent = error.message;
    console.error(error);
  });
})();