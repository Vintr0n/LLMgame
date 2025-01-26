
"use strict";

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {


  
    this.load.tilemapTiledJSON("map", "tileset/outsidemap.json");
    this.load.image("outside1", "tileset/outside1.png");
    this.load.image("outside2", "tileset/outside2.png");
    this.load.image("outside3", "tileset/outside3.png");
    
    var url =
      "https://cdn.jsdelivr.net/gh/rexrainbow/phaser3-rex-notes/dist/rexvirtualjoystickplugin.min.js";
    this.load.plugin("rexvirtualjoystickplugin", url, true);

    // Load game assets
    this.load.image("player", "sprites/player1sprite.png");
    this.load.image("npc", "sprites/girl1sprite.png");
    this.load.image("npc2", "sprites/guy1sprite.png");
    this.load.image("guy1", "sprites/guy1.png");
    this.load.image("girl1", "sprites/girl1.png");
  }
  create() {
  

  // Create the map
  const map = this.make.tilemap({ key: "map" });

const tileset1 = map.addTilesetImage("outside1", "outside1");
const tileset2 = map.addTilesetImage("outside2", "outside2");
const tileset3 = map.addTilesetImage("outside3", "outside3");

const groundLayer = map.createLayer("ground", [tileset1, tileset2], 0, 0);
const passibleLayer = map.createLayer("passible", [tileset3], 0, 0);
const collisionLayer = map.createLayer("collision", [tileset3], 0, 0);

groundLayer.setDepth(0);
passibleLayer.setDepth(2); // Passible layer appears above the player
collisionLayer.setDepth(1);

collisionLayer.setCollisionByExclusion([-1]);



console.log("Collision Layer: ", collisionLayer);
if (!collisionLayer) {
    console.error("Collision layer is undefined. Check your map JSON or Phaser initialization.");
    return;
}



    const worldWidth = this.scale.gameSize.width;
    const worldHeight = this.scale.gameSize.height;

    // Add virtual joystick
    this.joyStick = this.plugins.get("rexvirtualjoystickplugin").add(this, {
      x: 100,
      y: worldHeight - 150,
      radius: 50,
      base: this.add.circle(0, 0, 50, 0x888888, 0.8),
      thumb: this.add.circle(0, 0, 20, 0xcccccc, 0.8),
    });

  // Adjust the camera to follow the player
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);


    // Add "Talk" button
    this.talkButton = this.add
      .text(200, worldHeight - 150, "Talk", {
        font: "20px Arial",
        fill: "#ffffff",
        backgroundColor: "#444444",
        padding: { x: 15, y: 5 },
      })
      .setInteractive()
      .setVisible(false)
      .on("pointerdown", () => this.onTalkButtonPressed());
    const sayButton = document.getElementById("say-button");
    const leaveButton = document.getElementById("leave-button");

    // Add "Say" button
    this.sayButton = this.add
      .text(worldWidth / 2, worldHeight - 200, "Say", {
        font: "20px Arial",
        fill: "#ffffff",
        backgroundColor: "#444444",
        padding: { x: 10, y: 5 },
      })
      .setInteractive()
      .setOrigin(0.5)
      .setDepth(10) // Ensure it's above the dialogue overlay
      .setVisible(false)
      .on("pointerdown", () => this.onSayButtonPressed());

    // Add "Leave" button
    this.leaveButton = this.add
      .text(worldWidth - 150, worldHeight - 150, "Leave", {
        font: "20px Arial",
        fill: "#ffffff",
        backgroundColor: "#444444",
        padding: { x: 10, y: 5 },
      })
      .setInteractive()
      .setDepth(10) // Ensure it's above the dialogue overlay
      .setVisible(false)
      .on("pointerdown", () => this.endConversation());

    // Say button triggers sending a message
    sayButton.addEventListener("click", () => this.onSayButtonPressed());

    // Leave button exits the conversation
    leaveButton.addEventListener("click", () => this.endConversation());

    // Set world and camera bounds
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Add player and NPCs
    this.player = this.physics.add.sprite(400, 300, "player").setScale(1.5);
    this.player = this.physics.add
      .sprite(worldWidth / 2, worldHeight / 2, "player")
      .setScale(1.5);
      this.physics.add.collider(this.player, collisionLayer);

      this.physics.add.collider(this.player, collisionLayer);

    const getRandomPosition = (dimension, padding = 50) =>
      Phaser.Math.Between(padding, dimension - padding);

    this.npc = this.physics.add
      .sprite(
        getRandomPosition(worldWidth),
        getRandomPosition(worldHeight),
        "npc",
      )
      .setScale(1.5);

    this.npc2 = this.physics.add
      .sprite(
        getRandomPosition(worldWidth),
        getRandomPosition(worldHeight),
        "npc2",
      )
      .setScale(1.5);

    // Make NPCs immovable and enable collision
    this.npc.setCollideWorldBounds(true).setImmovable(true);
    this.npc2.setCollideWorldBounds(true).setImmovable(true);

    this.player.setCollideWorldBounds(true);

    // Use handleCollision method for player-NPC collisions
    this.physics.add.collider(
      this.player,
      this.npc,
      this.handleCollision,
      null,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.npc2,
      this.handleCollision,
      null,
      this,
    );

    // Prevent NPCs from passing through each other
    this.physics.add.collider(this.npc, this.npc2);

    // DOM elements for dialogue overlay
    this.dialogueOverlay = document.getElementById("dialogue-overlay");
    this.npcDialogue = document.getElementById("npc-dialogue");
    this.playerDialogue = document.getElementById("player-dialogue");
    this.playerInput = document.getElementById("player-input");

    // Center the input box at the bottom
    this.playerInput.style.position = "absolute";
    this.playerInput.style.bottom = "50px";
    this.playerInput.style.left = "50%";
    this.playerInput.style.transform = "translateX(-50%)";
    this.playerInput.style.display = "none";

    document
      .getElementById("player-input")
      .addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          this.onSayButtonPressed();
        }
      });

    // Make overlay full screen
    this.dialogueOverlay.style.width = "100vw";
    this.dialogueOverlay.style.height = "100vh";
    this.dialogueOverlay.style.position = "absolute";
    this.dialogueOverlay.style.top = "0";
    this.dialogueOverlay.style.left = "0";
    this.dialogueOverlay.style.display = "none";

    // NPC Movement Timer
    this.npcMoveTimer = this.time.addEvent({
      delay: 1500,
      callback: this.moveNPCs,
      callbackScope: this,
      loop: true,
    });
  }

  update() {
    const force = this.joyStick.force;
    const angle = this.joyStick.angle;

    if (force > 0) {
      const maxSpeed = 75;
      const radian = Phaser.Math.DegToRad(angle);
      const velocityX = Math.cos(radian) * force * maxSpeed;
      const velocityY = Math.sin(radian) * force * maxSpeed;

      this.player.setVelocityX(
        Phaser.Math.Clamp(velocityX, -maxSpeed, maxSpeed),
      );
      this.player.setVelocityY(
        Phaser.Math.Clamp(velocityY, -maxSpeed, maxSpeed),
      );
    } else {
      this.player.setVelocity(0);
    }

    this.checkProximityToNPCs();
  }

  handleCollision(player, npc) {
    // Stop the player and NPC's velocity on collision
    player.body.setVelocity(0);
    npc.body.setVelocity(0);
  }

  moveNPCs() {
    const randomSpeed = () => Phaser.Math.Between(-50, 50);
    this.npc.setVelocity(randomSpeed(), randomSpeed());
    this.npc2.setVelocity(randomSpeed(), randomSpeed());
  }

  checkProximityToNPCs() {
    const distanceToNPC1 = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.npc.x,
      this.npc.y,
    );
    const distanceToNPC2 = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.npc2.x,
      this.npc2.y,
    );

    if (distanceToNPC1 < 70) {
      this.talkButton.setVisible(true);
      this.showTalkButtonWithNPCImage("girl1");
    } else if (distanceToNPC2 < 70) {
      this.talkButton.setVisible(true);
      this.showTalkButtonWithNPCImage("guy1");
    } else {
      this.talkButton.setVisible(false);
      this.hideNPCImage();
    }
  }

  showTalkButtonWithNPCImage(npcImageKey) {
    const buttonX = this.talkButton.x;
    const buttonY = this.talkButton.y;

    if (!this.npcImage) {
      // Create the NPC image and place it next to the button
      this.npcImage = this.add
        .image(buttonX - 70, buttonY, npcImageKey) // Position the image relative to the button
        .setScale(1)
        .setOrigin(1);
    } else {
      // Update the NPC image texture and position
      this.npcImage.setTexture(npcImageKey);
      this.npcImage.setPosition(buttonX + 65, buttonY); // Dynamically update position
      this.npcImage.setVisible(true);
    }
  }

  hideNPCImage() {
    if (this.npcImage) {
      this.npcImage.setVisible(false);
    }
  }

  onTalkButtonPressed() {
    const closestNPC =
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.npc.x,
        this.npc.y,
      ) <
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.npc2.x,
        this.npc2.y,
      )
        ? this.npc
        : this.npc2;

    const npcType = closestNPC === this.npc ? "charlotte" : "gary";
    this.currentNPCType = npcType; // Set the current NPC type

    const npcImageSrc =
      closestNPC === this.npc ? "sprites/girl1.png" : "sprites/guy1.png";
    const npcDialogueText =
      closestNPC === this.npc ? "Hello there!" : "What's up?";

    this.startConversation(npcImageSrc, npcDialogueText);
  }

  async onSayButtonPressed() {
    const playerInput = this.playerInput.value.trim();
    if (playerInput === "") return;
    this.playerDialogue.innerText = playerInput;
    this.playerInput.value = "";
    this.npcDialogue.innerText = "...";
    await sendChatMessage(playerInput, this.currentNPCType);
  }

  endConversation() {
    this.inConvo = false;

    // Hide dialogue elements
    this.dialogueOverlay.style.display = "none";
    this.npcDialogue.innerText = "";
    this.playerDialogue.innerText = "";
    this.playerInput.value = "";
    this.playerInput.style.display = "none";

    // Enable joystick and hide buttons
    this.joyStick.base.setVisible(true);
    this.joyStick.thumb.setVisible(true);
    this.talkButton.setVisible(true);
  }

  startConversation(npcImageSrc, npcDialogueText) {
    this.inConvo = true;

    // Stop NPC movement
    this.npc.setVelocity(0, 0);
    this.npc2.setVelocity(0, 0);
    this.npcMoveTimer.paused = true;

    // Hide joystick and Talk button
    this.joyStick.base.setVisible(false);
    this.joyStick.thumb.setVisible(false);
    this.talkButton.setVisible(false);

    // Show Say and Leave buttons
    this.sayButton.setVisible(true);
    this.leaveButton.setVisible(true);

    // Display dialogue
    this.dialogueOverlay.style.display = "flex";
    document.getElementById("npc-image").src = npcImageSrc;
    this.npcDialogue.innerText = npcDialogueText;
    this.playerInput.style.display = "block";
    this.playerInput.focus();
  }

  endConversation() {
    this.inConvo = false;

    // Resume NPC movement
    this.npcMoveTimer.paused = false;

    // Hide dialogue elements
    this.dialogueOverlay.style.display = "none";
    this.npcDialogue.innerText = "";
    this.playerDialogue.innerText = "";
    this.playerInput.value = "";
    this.playerInput.style.display = "none";

    // Show joystick and Talk button
    this.joyStick.base.setVisible(true);
    this.joyStick.thumb.setVisible(true);
    this.talkButton.setVisible(true);

    // Hide Say and Leave buttons
    this.sayButton.setVisible(false);
    this.leaveButton.setVisible(false);
  }

  async onSayButtonPressed() {
    const playerInput = this.playerInput.value.trim();
    if (playerInput === "") return;
    this.playerDialogue.innerText = playerInput;
    this.playerInput.value = "";
    this.npcDialogue.innerText = "...";
    await sendChatMessage(playerInput, this.currentNPCType);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: GameScene,
  backgroundColor: "#333333",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};




let secrets = null; // Cache the secrets after fetching

async function fetchSecrets() {
  if (!secrets) {
    const response = await fetch("/secrets");
    if (!response.ok) {
      throw new Error("Failed to fetch secrets");
    }
    secrets = await response.json(); // Parse response as JSON
  }
  return secrets;
}

let sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  sessionId = crypto.randomUUID(); // Generate a unique session ID
  localStorage.setItem("sessionId", sessionId);
}

async function sendChatMessage(playerInput, npcType) {
  try {
    const response = await fetch("https://api-call.stuartvinton.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: playerInput, npc: npcType, sessionId: sessionId }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from the server");
    }

    const data = await response.json();
    const npcContent = data.message || "No response available";

    // Update NPC dialogue
    document.getElementById("npc-dialogue").innerText = npcContent;
  } catch (error) {
    console.error("Error sending chat message:", error);
    document.getElementById("npc-dialogue").innerText =
      "There was an error communicating with the NPC.";
  }
}


const game = new Phaser.Game(config);
