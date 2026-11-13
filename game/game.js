(() => {
  const canvas = document.querySelector("#resume-game");
  const context = canvas.getContext("2d");
  const status = document.querySelector("#game-status");
  const title = document.querySelector("#milestone-title");
  const description = document.querySelector("#milestone-description");
  const restartButton = document.querySelector("#restart-game");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const world = {
    width: 5200,
    height: 440,
    groundY: 368
  };

  const missions = [
    {
      x: 420,
      title: "Mission 1: My ADA University Journey",
      description: "Enter ADA University and begin exploring student life."
    },
    {
      x: 1270,
      title: "Mission 2: My Projects Journey",
      description: "Explore my university projects. Project 1: Logic Gates used a breadboard to build AND, OR, XOR, and NOT gates."
    },
    {
      x: 2150,
      title: "Mission 3: Sports Club Security",
      description: "I was part of the university sports club security team and helped manage crowds during football games. This experience involved responsibility, teamwork, communication, and working under pressure."
    },
    {
      x: 3030,
      title: "Mission 4: Model United Nations",
      description: "I participated in the MUN club. Relevant skills include public speaking, research, diplomacy, critical thinking, and understanding international affairs."
    },
    {
      x: 3910,
      title: "Mission 5: Technology and Academic Development",
      description: "I study Mathematics at ADA University, enjoy learning and problem-solving, and am interested in technology and cybersecurity."
    },
    {
      x: 4720,
      title: "Mission 6: My Future",
      description: "I want to keep developing my technical knowledge and professional abilities, especially in cybersecurity."
    }
  ];

  const projectPortal = {
    x: 1510,
    title: "Project exhibition",
    description: "This display features Project 1: Logic Gates. Interact to open the Projects page for the full description and video."
  };
  const interactiveObjects = [
    ...missions.map((mission, missionIndex) => ({
      ...mission,
      type: "mission",
      missionIndex
    })),
    {
      ...projectPortal,
      type: "portal"
    }
  ];
  const missionZones = [
    { start: 0, end: 850 },
    { start: 850, end: 1750 },
    { start: 1750, end: 2650 },
    { start: 2650, end: 3550 },
    { start: 3550, end: 4450 },
    { start: 4450, end: world.width }
  ];
  const completedMissions = missions.map(() => false);
  const platforms = [
    { x: 0, y: world.groundY, width: world.width, height: 100 },
    { x: 590, y: 326, width: 180, height: 18 },
    { x: 1120, y: 306, width: 210, height: 18 },
    { x: 1810, y: 326, width: 190, height: 18 },
    { x: 2700, y: 306, width: 210, height: 18 },
    { x: 3600, y: 326, width: 190, height: 18 },
    { x: 4470, y: 306, width: 210, height: 18 }
  ];

  const player = {
    x: 72,
    y: world.groundY - 38,
    width: 28,
    height: 38,
    velocityX: 0,
    velocityY: 0,
    speed: 3.7,
    jump: -10.8,
    grounded: false
  };

  const keys = new Set();
  const touchState = { left: false, right: false };
  let cameraX = 0;
  let lastTime = 0;
  let nearbyObject = null;
  let currentMission = -1;
  let projectPortalUnlocked = false;
  let animationFrame = 0;
  const missionProgressItems = [...document.querySelectorAll("[data-mission]")];
  const interactButton = document.querySelector("#interact-button");
  const projectPortalLink = document.querySelector("#project-portal-link");
  const stateStorageKey = "atilla-university-journey-v1";

  const resizeCanvas = () => {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const updateMissionIndicators = () => {
    missionProgressItems.forEach((item, index) => {
      item.classList.toggle("is-current", index === currentMission);
      item.classList.toggle("is-complete", completedMissions[index]);
      item.querySelector("span").textContent = completedMissions[index] ? "✓" : String(index + 1);
    });
  };

  const setCurrentMission = (index) => {
    if (index === currentMission) return;
    currentMission = index;
    updateMissionIndicators();
    title.textContent = missions[index].title;
    description.textContent = missions[index].description;
    status.textContent = `Mission ${index + 1} of ${missions.length}. Explore this area and interact with its checkpoint.`;
  };

  const setNearbyObject = (object) => {
    if (object === nearbyObject) return;
    nearbyObject = object;
    interactButton.hidden = !object;

    if (!object) {
      title.textContent = missions[currentMission].title;
      description.textContent = missions[currentMission].description;
      status.textContent = `Mission ${currentMission + 1} of ${missions.length}. Explore this area and interact with its checkpoint.`;
      return;
    }

    title.textContent = object.title;
    description.textContent = object.description;
    status.textContent = object.type === "portal"
      ? "Project display nearby. Press E or tap Interact to reveal the Projects link."
      : `Checkpoint nearby. Press E or tap Interact to complete ${object.title}.`;
  };

  const interactWithNearbyObject = () => {
    if (!nearbyObject) return;

    if (nearbyObject.type === "portal") {
      projectPortalUnlocked = true;
      projectPortalLink.hidden = false;
      status.textContent = "Projects portal opened. Use the link to visit the Projects page; your game position will be saved.";
      saveGameState();
      return;
    }

    const missionIndex = nearbyObject.missionIndex;
    completedMissions[missionIndex] = true;
    updateMissionIndicators();
    status.textContent = `Mission ${missionIndex + 1} complete. Continue exploring the campus.`;
    saveGameState();
  };

  const saveGameState = () => {
    try {
      sessionStorage.setItem(stateStorageKey, JSON.stringify({
        x: player.x,
        y: player.y,
        completedMissions,
        projectPortalUnlocked
      }));
    } catch (error) {
      status.textContent = "Your game progress could not be saved in this browser session.";
      console.error("Unable to save university journey progress.", error);
    }
  };

  const restoreGameState = () => {
    try {
      const savedState = sessionStorage.getItem(stateStorageKey);
      if (!savedState) return;

      const state = JSON.parse(savedState);
      const validState = state
        && Number.isFinite(state.x)
        && Number.isFinite(state.y)
        && Array.isArray(state.completedMissions)
        && state.completedMissions.length === missions.length
        && state.completedMissions.every((value) => typeof value === "boolean")
        && typeof state.projectPortalUnlocked === "boolean";

      if (!validState) {
        status.textContent = "Saved game progress was not recognized; starting a new journey.";
        return;
      }

      player.x = Math.max(0, Math.min(world.width - player.width, state.x));
      player.y = Math.max(0, Math.min(world.groundY - player.height, state.y));
      completedMissions.splice(0, completedMissions.length, ...state.completedMissions);
      projectPortalUnlocked = state.projectPortalUnlocked;
      projectPortalLink.hidden = !projectPortalUnlocked;
      currentMission = -1;
      setCurrentMission(missionZones.findIndex((zone) => player.x >= zone.start && player.x < zone.end));
      status.textContent = "Your university journey has been restored for this browser session.";
    } catch (error) {
      status.textContent = "Saved game progress could not be read; starting a new journey.";
      console.error("Unable to restore university journey progress.", error);
    }
  };

  const resetGame = () => {
    player.x = 72;
    player.y = world.groundY - player.height;
    player.velocityX = 0;
    player.velocityY = 0;
    player.grounded = false;
    cameraX = 0;
    completedMissions.fill(false);
    projectPortalUnlocked = false;
    projectPortalLink.hidden = true;
    nearbyObject = null;
    currentMission = -1;
    setCurrentMission(0);
    setNearbyObject(null);
    try {
      sessionStorage.removeItem(stateStorageKey);
    } catch (error) {
      status.textContent = "The game restarted, but saved progress could not be cleared.";
      console.error("Unable to clear saved university journey progress.", error);
    }
    canvas.focus();
  };

  const roundedRect = (x, y, width, height, radius) => {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
  };

  const drawCloud = (x, y, scale) => {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    context.fillStyle = "rgba(255, 255, 255, 0.58)";
    context.beginPath();
    context.ellipse(0, 8, 36, 10, 0, 0, Math.PI * 2);
    context.ellipse(-18, 3, 18, 13, 0, 0, Math.PI * 2);
    context.ellipse(1, -3, 23, 18, 0, 0, Math.PI * 2);
    context.ellipse(22, 4, 17, 12, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawDistantCampus = (viewWidth, viewHeight) => {
    const sky = context.createLinearGradient(0, 0, 0, viewHeight);
    sky.addColorStop(0, "#b8d2df");
    sky.addColorStop(0.58, "#e4e6df");
    sky.addColorStop(1, "#f2e8d7");
    context.fillStyle = sky;
    context.fillRect(0, 0, viewWidth, viewHeight);

    drawCloud(((170 - cameraX * 0.08) % (viewWidth + 140) + viewWidth + 140) % (viewWidth + 140) - 60, 65, 1);
    drawCloud(((570 - cameraX * 0.06) % (viewWidth + 170) + viewWidth + 170) % (viewWidth + 170) - 70, 105, 0.75);

    context.save();
    context.translate(-cameraX * 0.14, 0);
    for (let x = -130, index = 0; x < world.width; x += 260, index += 1) {
      const y = 152 + (index % 3) * 17;
      const width = index % 2 ? 210 : 185;
      const height = 216 - (index % 3) * 16;
      context.fillStyle = index % 2 ? "#9baeb3" : "#a8b7b7";
      context.fillRect(x, y, width, height);
      context.fillStyle = "rgba(231, 239, 237, 0.45)";
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          context.fillRect(x + 16 + col * 40, y + 22 + row * 34, 20, 13);
        }
      }
    }
    context.restore();
  };

  const drawWindowInterior = (x, y, width, height, style, seed) => {
    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
    const glass = context.createLinearGradient(x, y, x + width, y + height);
    glass.addColorStop(0, "#c8dce2");
    glass.addColorStop(1, "#9cb8c0");
    context.fillStyle = glass;
    context.fillRect(x, y, width, height);
    context.fillStyle = "rgba(255, 240, 207, 0.23)";
    context.fillRect(x + width * 0.08, y, width * 0.25, height);

    if (style === "classroom") {
      context.fillStyle = "#e4e0d4";
      context.fillRect(x + 5, y + height * 0.26, width - 10, 3);
      context.fillStyle = "#8b7864";
      for (let i = 0; i < 2; i += 1) {
        const deskX = x + 7 + i * (width * 0.45);
        context.fillRect(deskX, y + height * 0.65, width * 0.3, 4);
        context.fillRect(deskX + 4, y + height * 0.69, 3, height * 0.17);
        context.fillRect(deskX + width * 0.25, y + height * 0.69, 3, height * 0.17);
      }
      context.fillStyle = "#586875";
      context.beginPath();
      context.arc(x + width * 0.54, y + height * 0.5, 5, 0, Math.PI * 2);
      context.fill();
      context.fillRect(x + width * 0.49, y + height * 0.55, 10, height * 0.18);
    } else if (style === "lab") {
      for (let i = 0; i < 2; i += 1) {
        const deskX = x + 7 + i * (width * 0.47);
        context.fillStyle = "#667982";
        context.fillRect(deskX, y + height * 0.45, width * 0.29, height * 0.26);
        context.fillStyle = "#263b4b";
        context.fillRect(deskX + 3, y + height * 0.48, width * 0.23, height * 0.17);
        context.fillStyle = "#6b594b";
        context.fillRect(deskX + 3, y + height * 0.74, width * 0.29, 3);
        context.fillRect(deskX + 7, y + height * 0.77, 3, height * 0.1);
        context.fillRect(deskX + width * 0.24, y + height * 0.77, 3, height * 0.1);
      }
    } else if (style === "library") {
      context.fillStyle = "#786c5e";
      context.fillRect(x + 4, y + height * 0.27, width - 8, 3);
      context.fillRect(x + 4, y + height * 0.59, width - 8, 3);
      const bookColors = ["#73858a", "#b48a68", "#d0bd9b", "#657a82", "#9d7770"];
      for (let row = 0; row < 2; row += 1) {
        for (let i = 0; i < 5; i += 1) {
          context.fillStyle = bookColors[(i + row + seed) % bookColors.length];
          context.fillRect(x + 7 + i * (width - 18) / 5, y + 7 + row * height * 0.34, 6, height * 0.17);
        }
      }
    } else if (style === "conference") {
      context.fillStyle = "#897961";
      context.fillRect(x + 4, y + height * 0.3, width - 8, 3);
      for (let i = 0; i < 2; i += 1) {
        const deskX = x + 7 + i * (width * 0.46);
        context.fillRect(deskX, y + height * 0.63, width * 0.32, 5);
        context.fillStyle = "#586a70";
        context.fillRect(deskX + 5, y + height * 0.37, 3, height * 0.19);
        context.fillStyle = "#897961";
        context.fillRect(deskX + 4, y + height * 0.68, 3, height * 0.15);
        context.fillRect(deskX + width * 0.26, y + height * 0.68, 3, height * 0.15);
      }
      context.fillStyle = "#4f6269";
      context.fillRect(x + width * 0.48, y + height * 0.38, 2, height * 0.19);
    } else {
      context.fillStyle = "#806d58";
      for (let i = 0; i < 2; i += 1) {
        const tableX = x + 8 + i * (width * 0.46);
        context.fillRect(tableX, y + height * 0.58, width * 0.27, 4);
        context.fillRect(tableX + 4, y + height * 0.62, 3, height * 0.17);
        context.fillRect(tableX + width * 0.23, y + height * 0.62, 3, height * 0.17);
      }
      context.fillStyle = "#536877";
      context.beginPath();
      context.arc(x + width * 0.53, y + height * 0.43, 4, 0, Math.PI * 2);
      context.fill();
      context.fillRect(x + width * 0.49, y + height * 0.48, 8, height * 0.15);
    }

    context.restore();
    context.strokeStyle = "#82949a";
    context.lineWidth = 3;
    context.strokeRect(x, y, width, height);
    context.strokeStyle = "rgba(248, 250, 252, 0.5)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x + width * 0.5, y);
    context.lineTo(x + width * 0.5, y + height);
    context.stroke();
  };

  const drawCampusBuilding = (x, style, label, width = 300, top = 112) => {
    const height = world.groundY - top + 8;
    context.save();
    context.shadowColor = "rgba(54, 68, 72, 0.22)";
    context.shadowBlur = 16;
    context.shadowOffsetY = 8;
    const facade = context.createLinearGradient(x, top, x + width, world.groundY);
    facade.addColorStop(0, "#e8e4da");
    facade.addColorStop(0.52, "#d5d9d5");
    facade.addColorStop(1, "#c5cfce");
    context.fillStyle = facade;
    context.fillRect(x, top, width, height);
    context.restore();

    context.fillStyle = "rgba(255, 255, 255, 0.7)";
    context.fillRect(x, top, width, 9);
    context.fillStyle = "#9ca9a5";
    context.fillRect(x, top + height - 8, width, 8);

    const windowWidth = 48;
    const windowHeight = 72;
    const windowGap = 18;
    const columns = Math.max(3, Math.floor((width - 36) / (windowWidth + windowGap)));
    const firstX = x + (width - (columns * windowWidth + (columns - 1) * windowGap)) / 2;
    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < 2; row += 1) {
        drawWindowInterior(firstX + col * (windowWidth + windowGap), top + 40 + row * 88, windowWidth, windowHeight, style, col + row);
      }
    }

    const doorX = x + width / 2 - 25;
    const doorY = world.groundY - 86;
    context.fillStyle = "#536a75";
    context.fillRect(doorX, doorY, 50, 86);
    context.fillStyle = "#c8d7d8";
    context.fillRect(doorX + 6, doorY + 9, 38, 42);
    context.fillStyle = "#d9c9a7";
    context.beginPath();
    context.arc(doorX + 39, doorY + 61, 2, 0, Math.PI * 2);
    context.fill();

    roundedRect(x + width / 2 - 86, top - 28, 172, 25, 5);
    context.fillStyle = "#f4f1e9";
    context.fill();
    context.strokeStyle = "#b7c1bd";
    context.lineWidth = 1;
    context.stroke();
    context.fillStyle = "#41535c";
    context.font = "700 10px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText(label, x + width / 2, top - 11);
    context.textAlign = "left";
  };

  const drawCampusEntrance = () => {
    const stone = context.createLinearGradient(22, 240, 42, world.groundY);
    stone.addColorStop(0, "#e5e2d8");
    stone.addColorStop(1, "#9fa9a2");

    [[22, 238], [166, 238]].forEach(([x, y]) => {
      context.fillStyle = "rgba(45, 59, 57, 0.18)";
      context.fillRect(x + 5, y + 7, 25, world.groundY - y);
      context.fillStyle = stone;
      context.fillRect(x, y, 26, world.groundY - y);
      context.fillStyle = "#f4f1e8";
      context.fillRect(x - 4, y, 34, 8);
      context.fillStyle = "#87958f";
      context.fillRect(x - 2, world.groundY - 12, 30, 12);
      context.fillStyle = "rgba(255,255,255,0.42)";
      context.fillRect(x + 4, y + 10, 3, world.groundY - y - 25);
    });

    context.save();
    context.shadowColor = "rgba(43, 55, 51, 0.22)";
    context.shadowBlur = 10;
    context.shadowOffsetY = 4;
    roundedRect(28, 222, 158, 37, 5);
    const sign = context.createLinearGradient(28, 222, 186, 259);
    sign.addColorStop(0, "#536a6b");
    sign.addColorStop(1, "#344b50");
    context.fillStyle = sign;
    context.fill();
    context.restore();

    context.strokeStyle = "rgba(237, 236, 224, 0.7)";
    context.lineWidth = 1;
    roundedRect(33, 227, 148, 27, 3);
    context.stroke();
    context.fillStyle = "#f4f1e8";
    context.font = "700 9px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText("UNIVERSITY CAMPUS", 107, 244);
    context.textAlign = "left";

    context.strokeStyle = "#40565a";
    context.lineWidth = 3;
    for (let x = 56; x <= 82; x += 13) {
      context.beginPath();
      context.moveTo(x, 265);
      context.lineTo(x, world.groundY - 3);
      context.stroke();
    }
    for (let x = 132; x <= 158; x += 13) {
      context.beginPath();
      context.moveTo(x, 265);
      context.lineTo(x, world.groundY - 3);
      context.stroke();
    }
    context.strokeStyle = "#74847d";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(52, 270);
    context.lineTo(85, 270);
    context.moveTo(129, 270);
    context.lineTo(162, 270);
    context.stroke();

    context.fillStyle = "#bbc4b8";
    context.fillRect(97, 261, 20, 3);
  };

  const drawTree = (x, baseY, scale = 1) => {
    context.save();
    context.translate(x, baseY);
    context.scale(scale, scale);
    context.fillStyle = "rgba(48, 67, 59, 0.16)";
    context.beginPath();
    context.ellipse(0, 2, 35, 7, 0, 0, Math.PI * 2);
    context.fill();
    const trunk = context.createLinearGradient(-7, 0, 8, 0);
    trunk.addColorStop(0, "#7b6957");
    trunk.addColorStop(1, "#aa8a6c");
    context.fillStyle = trunk;
    context.fillRect(-6, -72, 12, 74);
    context.fillRect(-3, -95, 7, 33);
    const leaves = ["#748b79", "#8ba08a", "#9cab8b", "#6e8577", "#a9b49a"];
    const clusters = [
      [-18, -95, 24], [8, -110, 26], [-3, -132, 25],
      [23, -96, 20], [-29, -117, 18], [13, -137, 17]
    ];
    clusters.forEach(([cx, cy, radius], index) => {
      context.fillStyle = leaves[index % leaves.length];
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255, 255, 255, 0.12)";
      context.beginPath();
      context.arc(cx - radius * 0.25, cy - radius * 0.28, radius * 0.42, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  };

  const drawBench = (x, y) => {
    context.fillStyle = "rgba(52, 62, 58, 0.15)";
    context.beginPath();
    context.ellipse(x + 30, y + 31, 40, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#796852";
    context.fillRect(x, y, 62, 7);
    context.fillRect(x + 1, y + 10, 60, 7);
    context.fillStyle = "#53636a";
    context.fillRect(x + 7, y + 18, 5, 16);
    context.fillRect(x + 50, y + 18, 5, 16);
  };

  const drawBackgroundStudent = (x, floorY, scale = 1, phase = 0) => {
    const sway = reducedMotion ? 0 : Math.sin(animationFrame / 17 + phase) * 1.5;
    context.save();
    context.translate(x, floorY + sway);
    context.scale(scale, scale);
    context.fillStyle = "rgba(45, 59, 59, 0.13)";
    context.beginPath();
    context.ellipse(0, 2, 12, 3, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = phase % 2 ? "#6d7f86" : "#8a7567";
    context.fillRect(-7, -27, 14, 18);
    context.fillStyle = "#d6b49b";
    context.beginPath();
    context.arc(0, -34, 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = phase % 2 ? "#443f39" : "#6f5747";
    context.beginPath();
    context.arc(0, -37, 6, Math.PI, Math.PI * 2);
    context.fill();
    context.fillStyle = "#53626a";
    context.fillRect(-5, -9, 4, 9);
    context.fillRect(1, -9, 4, 9);
    context.restore();
  };

  const drawPathAndCampusFurniture = () => {
    context.fillStyle = "#a9b39f";
    context.fillRect(0, world.groundY - 12, world.width, 12);
    context.fillStyle = "#c8c8ba";
    context.fillRect(0, world.groundY - 10, world.width, 10);
    for (let x = 0; x < world.width; x += 74) {
      context.strokeStyle = "rgba(102, 111, 105, 0.2)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, world.groundY - 9);
      context.lineTo(x + 25, world.groundY);
      context.stroke();
    }
    context.fillStyle = "#aeb9a3";
    context.fillRect(0, world.groundY, world.width, 18);
    context.fillStyle = "#7e8d79";
    context.fillRect(0, world.groundY + 17, world.width, 5);

    [170, 670, 1180, 1660, 2040].forEach((x, index) => drawTree(x, world.groundY - 5, index % 2 ? 0.82 : 1));
    drawBench(515, world.groundY - 34);
    drawBench(1368, world.groundY - 34);
    drawBench(1780, world.groundY - 34);
    [760, 1530, 1815].forEach((x) => {
      roundedRect(x, world.groundY - 22, 44, 18, 4);
      context.fillStyle = "#9aa98f";
      context.fill();
      context.fillStyle = "#788b78";
      context.fillRect(x + 5, world.groundY - 24, 34, 4);
    });
  };

  const drawWalkwayPlatform = (platform) => {
    context.fillStyle = "rgba(50, 63, 61, 0.15)";
    context.fillRect(platform.x + 3, platform.y + 5, platform.width, platform.height);
    context.fillStyle = "#a8b39f";
    context.fillRect(platform.x, platform.y, platform.width, platform.height);
    context.fillStyle = "#c9c9bc";
    context.fillRect(platform.x, platform.y, platform.width, 9);
    context.fillStyle = "#f0eee6";
    context.fillRect(platform.x, platform.y, platform.width, 3);
    context.fillStyle = "#84927f";
    context.fillRect(platform.x, platform.y + 9, platform.width, 5);
    for (let x = platform.x + 44; x < platform.x + platform.width; x += 82) {
      context.strokeStyle = "rgba(87, 100, 91, 0.22)";
      context.beginPath();
      context.moveTo(x, platform.y + 1);
      context.lineTo(x + 18, platform.y + 9);
      context.stroke();
    }
  };

  const drawStadium = (x) => {
    context.save();
    context.shadowColor = "rgba(36, 48, 47, 0.2)";
    context.shadowBlur = 12;
    context.shadowOffsetY = 5;
    context.fillStyle = "#73847f";
    context.beginPath();
    context.moveTo(x, 309);
    context.lineTo(x + 54, 138);
    context.lineTo(x + 774, 138);
    context.lineTo(x + 830, 309);
    context.closePath();
    context.fill();
    context.restore();

    const standRows = ["#9b9b8a", "#777f79", "#aaa58f", "#727d79"];
    for (let row = 0; row < 5; row += 1) {
      const y = 174 + row * 25;
      context.fillStyle = standRows[row % standRows.length];
      context.fillRect(x + 38 + row * 12, y, 754 - row * 24, 13);
      for (let seat = 0; seat < 18; seat += 1) {
        const seatX = x + 54 + row * 12 + seat * 39;
        const colors = ["#5d6e71", "#9d806c", "#718187", "#d0b38e"];
        context.fillStyle = colors[(seat + row) % colors.length];
        context.beginPath();
        context.arc(seatX, y - 3, 4, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.fillStyle = "#52625e";
    context.fillRect(x + 28, 300, 774, 17);
    context.fillStyle = "#d4d7cc";
    context.fillRect(x + 40, 298, 750, 3);
    context.fillStyle = "#657670";
    context.fillRect(x + 391, 116, 48, 22);
    context.fillStyle = "#f3f0e7";
    context.font = "700 10px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText("UNIVERSITY SPORTS CLUB", x + 415, 131);
    context.textAlign = "left";
  };

  const drawProjectExhibition = () => {
    [1005, 1180, 1355].forEach((x, index) => {
      const top = world.groundY - 62;
      context.fillStyle = "rgba(45, 59, 57, 0.16)";
      context.fillRect(x + 5, top + 44, 138, 8);
      context.fillStyle = "#8b806d";
      context.fillRect(x, top + 32, 140, 8);
      context.fillRect(x + 12, top + 40, 5, 28);
      context.fillRect(x + 122, top + 40, 5, 28);
      roundedRect(x + 24, top - 48, 91, 48, 4);
      context.fillStyle = "#253941";
      context.fill();
      context.fillStyle = index === 1 ? "#d9e3dc" : "#c5d5d4";
      context.fillRect(x + 29, top - 43, 81, 37);
      context.fillStyle = "#526a69";
      context.font = "700 6px Inter, Segoe UI, sans-serif";
      context.textAlign = "center";
      context.fillText(index === 1 ? "PROJECT 1: LOGIC GATES" : "PROJECT EXHIBITION", x + 69, top - 32);
      if (index === 1) {
        ["AND", "OR", "XOR", "NOT"].forEach((label, gateIndex) => {
          const gateX = x + 34 + gateIndex * 19;
          context.fillStyle = "#e9ede5";
          roundedRect(gateX, top - 26, 16, 13, 2);
          context.fill();
          context.fillStyle = "#435c61";
          context.font = "600 5px Inter, Segoe UI, sans-serif";
          context.fillText(label, gateX + 8, top - 17);
        });
      } else {
        context.fillStyle = "#9caa9e";
        context.fillRect(x + 37, top - 24, 64, 3);
        context.fillRect(x + 37, top - 17, 52, 3);
      }
    });

    context.textAlign = "left";
    roundedRect(1450, world.groundY - 112, 120, 45, 5);
    context.fillStyle = "#344b50";
    context.fill();
    context.strokeStyle = "#d6dfd8";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#f4f1e8";
    context.font = "700 8px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText("EXPLORE MY", 1510, world.groundY - 94);
    context.fillText("PROJECTS", 1510, world.groundY - 81);
    context.textAlign = "left";
    context.fillStyle = "#64766e";
    context.fillRect(1506, world.groundY - 67, 8, 24);
  };

  const drawCafeteria = () => {
    const x = 1620;
    const y = world.groundY - 66;
    context.fillStyle = "rgba(45, 59, 57, 0.16)";
    context.fillRect(x + 4, y + 54, 106, 7);
    context.fillStyle = "#87765f";
    context.fillRect(x, y + 8, 110, 47);
    context.fillStyle = "#b5b5a2";
    context.beginPath();
    context.moveTo(x - 7, y + 10);
    context.lineTo(x + 55, y - 10);
    context.lineTo(x + 117, y + 10);
    context.closePath();
    context.fill();
    context.fillStyle = "#d6dfd8";
    context.fillRect(x + 12, y + 19, 86, 23);
    context.fillStyle = "#536a69";
    context.font = "700 7px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText("CAFETERIA", x + 55, y + 54);
    context.textAlign = "left";
  };

  const drawFootballArea = () => {
    const left = 1770;
    const width = 870;
    const top = world.groundY - 12;
    const turf = context.createLinearGradient(0, top, 0, top + 30);
    turf.addColorStop(0, "#6f8b70");
    turf.addColorStop(1, "#536f5c");
    context.fillStyle = turf;
    context.fillRect(left, top, width, 35);
    context.strokeStyle = "rgba(244, 244, 231, 0.78)";
    context.lineWidth = 2;
    context.strokeRect(left + 18, top + 5, width - 36, 23);
    context.beginPath();
    context.moveTo(left + width / 2, top + 5);
    context.lineTo(left + width / 2, top + 28);
    context.stroke();
    context.beginPath();
    context.arc(left + width / 2, top + 17, 7, 0, Math.PI * 2);
    context.stroke();

    [left + 30, left + width - 46].forEach((goalX) => {
      context.strokeStyle = "#eceee4";
      context.lineWidth = 3;
      context.strokeRect(goalX, top + 7, 16, 17);
      context.strokeStyle = "rgba(239, 241, 231, 0.45)";
      context.lineWidth = 1;
      for (let net = 1; net < 4; net += 1) {
        context.beginPath();
        context.moveTo(goalX + net * 4, top + 7);
        context.lineTo(goalX + net * 4, top + 24);
        context.stroke();
      }
    });

    drawBackgroundStudent(left + 230, world.groundY - 9, 0.56, 1);
    drawBackgroundStudent(left + 645, world.groundY - 9, 0.56, 2);
  };

  const drawFlag = (x, y, colors) => {
    context.fillStyle = "#718078";
    context.fillRect(x, y, 2, 31);
    colors.forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(x + 2, y + index * 6, 18, 6);
    });
  };

  const drawMUNArea = () => {
    const top = world.groundY - 76;
    [2760, 2905, 3050, 3195, 3340].forEach((x, index) => {
      context.fillStyle = "rgba(48, 57, 52, 0.16)";
      context.fillRect(x + 4, top + 35, 122, 7);
      context.fillStyle = index % 2 ? "#87765f" : "#95836b";
      context.fillRect(x, top + 23, 126, 8);
      context.fillRect(x + 10, top + 31, 4, 38);
      context.fillRect(x + 112, top + 31, 4, 38);
      drawFlag(x + 18, top - 45, index % 2 ? ["#87998e", "#d7d2be", "#788990"] : ["#a17e70", "#e0d1b3", "#71827f"]);
      context.fillStyle = "#536773";
      context.fillRect(x + 57, top + 2, 3, 21);
      context.beginPath();
      context.arc(x + 58, top, 4, 0, Math.PI * 2);
      context.fillStyle = "#d0b895";
      context.fill();
      drawBackgroundStudent(x + 75, top + 22, 0.65, index + 1);
    });

    roundedRect(2990, 190, 170, 72, 4);
    context.fillStyle = "#465a60";
    context.fill();
    context.fillStyle = "#d9e1d8";
    context.fillRect(2997, 197, 156, 58);
    context.fillStyle = "#627a79";
    context.font = "700 10px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText("MODEL UNITED NATIONS", 3075, 221);
    context.fillRect(3020, 231, 110, 3);
    context.textAlign = "left";
  };

  const drawComputerLab = () => {
    const top = world.groundY - 69;
    [3650, 3805, 3960, 4115].forEach((x, index) => {
      context.fillStyle = "rgba(48, 57, 52, 0.17)";
      context.fillRect(x + 4, top + 51, 132, 8);
      context.fillStyle = "#776c5d";
      context.fillRect(x, top + 40, 138, 8);
      context.fillRect(x + 12, top + 48, 5, 25);
      context.fillRect(x + 121, top + 48, 5, 25);
      roundedRect(x + 32, top - 9, 72, 45, 4);
      context.fillStyle = "#34464d";
      context.fill();
      context.fillStyle = index % 2 ? "#b9d1cf" : "#d1d9cb";
      context.fillRect(x + 37, top - 4, 62, 33);
      context.fillStyle = "#536c70";
      context.fillRect(x + 61, top + 29, 13, 8);
      context.fillRect(x + 52, top + 36, 31, 3);
      context.fillStyle = "#788b7e";
      context.fillRect(x + 48, top + 3, 4, 2);
      context.fillRect(x + 57, top + 3, 11, 2);
      context.fillRect(x + 48, top + 9, 27, 2);
    });
  };

  const drawFutureArea = () => {
    const x = 4505;
    context.fillStyle = "rgba(38, 55, 60, 0.2)";
    context.fillRect(x + 16, 119, 420, 240);
    const glass = context.createLinearGradient(x, 105, x + 400, world.groundY);
    glass.addColorStop(0, "#dce7e2");
    glass.addColorStop(0.52, "#b8cece");
    glass.addColorStop(1, "#78959a");
    context.fillStyle = glass;
    context.fillRect(x, 110, 410, world.groundY - 110);
    context.fillStyle = "rgba(248, 250, 244, 0.52)";
    for (let pane = 1; pane < 6; pane += 1) {
      context.fillRect(x + pane * 58, 110, 4, world.groundY - 110);
    }
    context.fillStyle = "#43585e";
    context.fillRect(x - 24, 126, 458, 12);
    context.fillStyle = "#f4f1e8";
    context.font = "700 11px Inter, Segoe UI, sans-serif";
    context.textAlign = "center";
    context.fillText("KEEP LEARNING", x + 205, 101);
    context.textAlign = "left";
    context.fillStyle = "#c8c8ba";
    context.fillRect(x - 28, world.groundY - 3, 466, 8);
  };

  const drawCampusWorld = (viewWidth, viewHeight) => {
    drawDistantCampus(viewWidth, viewHeight);
    context.save();
    context.translate(-cameraX * 0.35, 0);
    drawCampusEntrance();
    const buildings = [
      [215, "classroom", "UNIVERSITY CLASSROOMS", 315, 132],
      [545, "library", "LIBRARY", 270, 126],
      [895, "lab", "PROJECT EXHIBITION", 360, 112],
      [2650, "conference", "MUN CONFERENCE HALL", 390, 118],
      [3545, "lab", "COMPUTER LAB", 350, 112]
    ];
    buildings.forEach(([x, style, label, width, top]) => {
      if (x + width >= cameraX * 0.35 - 350 && x <= cameraX * 0.35 + viewWidth + 350) {
        drawCampusBuilding(x, style, label, width, top);
      }
    });
    if (cameraX * 0.35 < 1940 && cameraX * 0.35 + viewWidth > 1550) drawCafeteria();
    if (cameraX * 0.35 < 4900 && cameraX * 0.35 + viewWidth > 4250) drawFutureArea();
    if (cameraX * 0.35 < 2630 && cameraX * 0.35 + viewWidth > 1700) drawStadium(1740);
    context.restore();

    context.save();
    context.translate(-cameraX * 0.67, 0);
    for (let x = 135, index = 0; x < world.width; x += 430, index += 1) {
      if (x < 1700 || x > 2630) drawTree(x, world.groundY - 6, index % 2 ? 0.72 : 0.9);
    }
    [470, 1030, 1100, 1560, 1610, 1840, 2410, 2700, 2820, 3370, 3690, 4200, 4560, 4930]
      .forEach((x, index) => drawBackgroundStudent(x, world.groundY - 5, index % 2 ? 0.68 : 0.74, index + 1));
    drawBench(515, world.groundY - 34);
    drawBench(1368, world.groundY - 34);
    drawBench(4340, world.groundY - 34);
    context.restore();
  };

  const drawPlayer = () => {
    const centerX = player.x + player.width / 2;
    const feetY = player.y + player.height;
    const moving = Math.abs(player.velocityX) > 0;
    const airborne = !player.grounded;
    const direction = player.velocityX < 0 ? -1 : 1;
    const runCycle = moving && !reducedMotion ? Math.sin(animationFrame / 3.2) : 0;
    const idleSway = !moving && !airborne && !reducedMotion ? Math.sin(animationFrame / 18) * 1.2 : 0;
    const jumpTuck = airborne ? 3 : 0;
    const securityUniform = player.x >= missionZones[2].start && player.x < missionZones[2].end;

    context.save();
    context.translate(centerX, feetY + idleSway);
    context.scale(direction, 1);
    context.fillStyle = "rgba(39, 49, 48, 0.2)";
    context.beginPath();
    context.ellipse(0, 1, airborne ? 11 : 15, airborne ? 3 : 4, 0, 0, Math.PI * 2);
    context.fill();

    const legSwing = airborne ? 4 : runCycle * 5;
    context.strokeStyle = "#344453";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-4, -15);
    context.lineTo(-5 - legSwing, -6);
    context.lineTo(-6 - legSwing, -1);
    context.moveTo(4, -15);
    context.lineTo(5 + legSwing, -6);
    context.lineTo(7 + legSwing, -1);
    context.stroke();
    context.strokeStyle = "#eef0ed";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-10 - legSwing, 0);
    context.lineTo(-3 - legSwing, 0);
    context.moveTo(3 + legSwing, 0);
    context.lineTo(10 + legSwing, 0);
    context.stroke();

    context.fillStyle = securityUniform ? "#253941" : "#34495b";
    context.beginPath();
    context.moveTo(-10, -33 + jumpTuck);
    context.lineTo(9, -33 + jumpTuck);
    context.lineTo(11, -16);
    context.quadraticCurveTo(0, -12, -11, -16);
    context.closePath();
    context.fill();
    if (securityUniform) {
      context.fillStyle = "#8b896c";
      context.fillRect(-5, -29, 11, 8);
      context.fillStyle = "#f4f1e8";
      context.font = "700 3px Inter, Segoe UI, sans-serif";
      context.textAlign = "center";
      context.fillText("SECURITY", 0, -24);
      context.textAlign = "left";
    }
    context.fillStyle = "#536879";
    context.beginPath();
    context.moveTo(-9, -31 + jumpTuck);
    context.lineTo(-15, -20 + jumpTuck + runCycle * 2);
    context.lineTo(-10, -18 + jumpTuck + runCycle * 2);
    context.lineTo(-5, -27 + jumpTuck);
    context.fill();
    context.beginPath();
    context.moveTo(8, -31 + jumpTuck);
    context.lineTo(14, -20 + jumpTuck - runCycle * 2);
    context.lineTo(9, -18 + jumpTuck - runCycle * 2);
    context.lineTo(5, -27 + jumpTuck);
    context.fill();

    context.fillStyle = "#d7ad8e";
    context.beginPath();
    context.ellipse(0, -39 + jumpTuck, 8, 9, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#d9b552";
    context.beginPath();
    context.moveTo(-9, -41 + jumpTuck);
    context.quadraticCurveTo(-9, -54 + jumpTuck, 1, -53 + jumpTuck);
    context.quadraticCurveTo(10, -52 + jumpTuck, 9, -42 + jumpTuck);
    context.lineTo(6, -46 + jumpTuck);
    context.quadraticCurveTo(0, -43 + jumpTuck, -5, -46 + jumpTuck);
    context.lineTo(-7, -39 + jumpTuck);
    context.closePath();
    context.fill();
    context.fillStyle = "#c99f43";
    context.beginPath();
    context.ellipse(-6, -43 + jumpTuck, 3.2, 7, -0.3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#263746";
    context.beginPath();
    context.arc(3, -40 + jumpTuck, 1, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#9a6f5c";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(1, -35 + jumpTuck);
    context.quadraticCurveTo(3, -34 + jumpTuck, 5, -35 + jumpTuck);
    context.stroke();

    context.fillStyle = "#b87950";
    roundedRect(-13, -32 + jumpTuck, 5, 15, 2);
    context.fill();
    context.strokeStyle = "#d7ad8e";
    context.lineWidth = 3.5;
    context.beginPath();
    context.moveTo(-12, -20 + jumpTuck);
    context.lineTo(-13 - runCycle * 2, -15 + jumpTuck);
    context.moveTo(11, -20 + jumpTuck);
    context.lineTo(12 + runCycle * 2, -15 + jumpTuck);
    context.stroke();

    context.restore();
  };

  const drawWorld = (viewWidth, viewHeight) => {
    const verticalScale = Math.min(1, viewHeight / world.height);
    context.save();
    context.scale(1, verticalScale);
    drawCampusWorld(viewWidth, viewHeight / verticalScale);

    context.save();
    context.translate(-cameraX, 0);
    drawPathAndCampusFurniture();

    platforms.forEach(drawWalkwayPlatform);

    drawProjectExhibition();
    drawFootballArea();
    drawMUNArea();
    drawComputerLab();

    interactiveObjects.forEach((object, index) => {
      const pulse = reducedMotion ? 0 : Math.sin(animationFrame / 18 + index) * 2;
      context.fillStyle = "rgba(69, 91, 91, 0.24)";
      context.fillRect(object.x - 1, world.groundY - 43, 2, 40);
      context.fillStyle = "#f4f1e8";
      const label = object.type === "portal" ? "PROJECTS" : `MISSION ${object.missionIndex + 1}`;
      const labelWidth = object.type === "portal" ? 64 : 72;
      roundedRect(object.x - labelWidth / 2, world.groundY - 69, labelWidth, 20, 5);
      context.fill();
      context.strokeStyle = "#97a59b";
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = "#56686a";
      context.font = "700 7px Inter, Segoe UI, sans-serif";
      context.textAlign = "center";
      context.fillText(label, object.x, world.groundY - 56);
      context.beginPath();
      context.arc(object.x, world.groundY - 31, 5 + pulse, 0, Math.PI * 2);
      const isComplete = object.type === "mission" && completedMissions[object.missionIndex];
      context.fillStyle = isComplete ? "#526d5d" : object === nearbyObject ? "#405a5b" : "#82958a";
      context.fill();
    });
    context.textAlign = "left";

    drawPlayer();
    context.restore();

    roundedRect(14, 13, Math.min(300, viewWidth - 28), 36, 9);
    context.fillStyle = "rgba(248, 247, 241, 0.92)";
    context.fill();
    context.strokeStyle = "rgba(86, 104, 100, 0.25)";
    context.lineWidth = 1;
    context.stroke();
    context.fillStyle = "#40545b";
    context.font = "600 12px Inter, Segoe UI, sans-serif";
    context.fillText(`MISSION ${currentMission + 1} / ${missions.length}  ·  ADA UNIVERSITY`, 25, 36);
    context.restore();
  };

  const resolvePlatformCollision = (previousBottom) => {
    player.grounded = false;
    platforms.forEach((platform) => {
      const overlapsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
      const crossedTop = previousBottom <= platform.y && player.y + player.height >= platform.y;
      if (overlapsX && crossedTop && player.velocityY >= 0) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.grounded = true;
      }
    });
  };

  const updatePlayer = (delta) => {
    const left = keys.has("ArrowLeft") || keys.has("KeyA") || touchState.left;
    const right = keys.has("ArrowRight") || keys.has("KeyD") || touchState.right;
    const frameScale = Math.min(delta / 16.67, 2);

    player.velocityX = (right ? 1 : 0) - (left ? 1 : 0);
    player.x += player.velocityX * player.speed * frameScale;
    player.x = Math.max(0, Math.min(world.width - player.width, player.x));

    const previousBottom = player.y + player.height;
    player.velocityY += 0.48 * frameScale;
    player.y += player.velocityY * frameScale;
    resolvePlatformCollision(previousBottom);

    if (player.y > world.height + 80) {
      player.x = Math.max(30, player.x - 100);
      player.y = 100;
      player.velocityY = 0;
    }

    const viewWidth = canvas.clientWidth;
    cameraX = Math.max(0, Math.min(world.width - viewWidth, player.x - viewWidth * 0.35));

    const missionIndex = missionZones.findIndex((zone) => player.x >= zone.start && player.x < zone.end);
    setCurrentMission(missionIndex);

    const nearby = interactiveObjects
      .filter((object) => Math.abs(player.x + player.width / 2 - object.x) < 68
        && Math.abs(player.y + player.height - world.groundY) < 65)
      .sort((first, second) => Math.abs(player.x - first.x) - Math.abs(player.x - second.x))[0] || null;
    setNearbyObject(nearby);
  };

  const render = (time) => {
    const delta = lastTime ? time - lastTime : 16.67;
    lastTime = time;
    animationFrame += 1;
    updatePlayer(delta);
    drawWorld(canvas.clientWidth, canvas.clientHeight);
    animationFrame = animationFrame % 10000;
    requestAnimationFrame(render);
  };

  const isJumpKey = (event) => ["ArrowUp", "KeyW", "Space"].includes(event.code);

  document.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === "KeyE") {
      event.preventDefault();
      interactWithNearbyObject();
    }
    if (isJumpKey(event) && player.grounded) {
      player.velocityY = player.jump;
      player.grounded = false;
    }
  });

  document.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => keys.clear());
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", saveGameState);
  restartButton.addEventListener("click", resetGame);
  interactButton.addEventListener("click", interactWithNearbyObject);
  projectPortalLink.addEventListener("click", saveGameState);

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const press = (event) => {
      event.preventDefault();
      if (control === "jump") {
        if (player.grounded) {
          player.velocityY = player.jump;
          player.grounded = false;
        }
      } else {
        touchState[control] = true;
      }
    };
    const release = () => {
      if (control !== "jump") touchState[control] = false;
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });

  restoreGameState();
  resizeCanvas();
  animationFrame = requestAnimationFrame(render);
})();
