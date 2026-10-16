const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", { alpha: false }); // 👈 sin alpha = más rápido

const window_height = window.innerHeight;
const window_width = window.innerWidth;
canvas.height = window_height;
canvas.width = window_width;

// ============================================================
// 🎨 PRE-RENDERIZADO DEL FONDO (una sola vez)
// ============================================================
const bgCanvas = document.createElement("canvas");
bgCanvas.width = window_width;
bgCanvas.height = window_height;
const bgCtx = bgCanvas.getContext("2d");

(function buildBackground() {
    // Degradado vertical
    let grad = bgCtx.createLinearGradient(0, 0, 0, window_height);
    grad.addColorStop(0, "rgb(244, 145, 250)");
    grad.addColorStop(0.5, "rgb(255, 0, 238)");
    grad.addColorStop(1, "rgb(240, 146, 233)");
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, window_width, window_height);

    // Estrellas (una sola vez)
    bgCtx.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 120; i++) {
        let x = (i * 137.508) % window_width;
        let y = (i * 91.531) % window_height;
        let r = (i % 3) + 0.5;
        bgCtx.beginPath();
        bgCtx.arc(x, y, r, 0, Math.PI * 2);
        bgCtx.fill();
    }

    // Suelo brillante
    let groundGrad = bgCtx.createLinearGradient(0, window_height - 60, 0, window_height);
    groundGrad.addColorStop(0, "rgba(0,255,200,0)");
    groundGrad.addColorStop(1, "rgba(255, 0, 166, 0.98)");
    bgCtx.fillStyle = groundGrad;
    bgCtx.fillRect(0, window_height - 60, window_width, 60);
})();

// ============================================================
// 🎯 PRE-RENDERIZADO DE LOS "SPRITES" (objetos)
// Se dibuja cada emoji+halo UNA VEZ en un canvas pequeño.
// ============================================================
const EMOJIS = ["🔥", "💎", "⭐", "🍎", "⚽", "🎈", "🍀", "🌟", "🧊", "🍇"];

function createSprite(emoji, color, size) {
    const pad = 8; // espacio para el halo
    const total = size * 2 + pad * 2;

    const c = document.createElement("canvas");
    c.width = total;
    c.height = total;
    const g = c.getContext("2d");

    const cx = total / 2;
    const cy = total / 2;

    // Halo (una sola vez)
    g.shadowBlur = 14;
    g.shadowColor = color;

    // Círculo con degradado (una sola vez)
    let grad = g.createRadialGradient(
        cx - size * 0.3, cy - size * 0.3, size * 0.2,
        cx, cy, size
    );
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, "rgba(252, 248, 248, 0.12)");

    g.beginPath();
    g.arc(cx, cy, size, 0, Math.PI * 2);
    g.fillStyle = grad;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = "rgba(255,255,255,0.7)";
    g.stroke();

    // Emoji (una sola vez)
    g.shadowBlur = 0;
    g.font = `${size * 1.4}px serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(emoji, cx, cy);

    return { canvas: c, halfSize: total / 2, radius: size };
}

// ============================================================
// ⚙️ CONFIGURACIÓN
// ============================================================
const NUM_OBJECTS = 25;
let destroyedCount = 0;

function getSpeedMultiplier() {
    if (destroyedCount > 20) return 1.8;
    if (destroyedCount > 10) return 1.35;
    return 1.0;
}

// ============================================================
// 🧱 CLASE OBJETO (versión ligera)
// ============================================================
class FallingObject {
    constructor() {
        // Sprite aleatorio pre-renderizado
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 90%, 60%)`;
        const size = 20 + Math.random() * 8;
        this.sprite = createSprite(emoji, color, size);

        this.radius = size;
        this.reset(true);
    }

    reset(firstTime = false) {
        this.posX = this.radius + Math.random() * (window_width - this.radius * 2);
        this.posY = firstTime
            ? -this.radius - Math.random() * window_height * 0.5
            : -this.radius - Math.random() * 100;

        this.baseSpeedY = 1.5 + Math.random() * 2.5;
        this.dx = (Math.random() - 0.5) * 1.2;
        this.dy = this.baseSpeedY;

        this.restitution = 0.55 + Math.random() * 0.2;
        this.bounces = 0;
        this.maxBounces = 4 + Math.floor(Math.random() * 3);

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.15;
    }

    update(context, speedMult) {
        // Física
        this.dy += 0.12;
        this.posX += this.dx * speedMult;
        this.posY += this.dy * speedMult;
        this.rotation += this.rotationSpeed * speedMult;

        // Rebote lateral
        if (this.posX + this.radius > window_width) {
            this.posX = window_width - this.radius;
            this.dx = -this.dx;
        }
        if (this.posX - this.radius < 0) {
            this.posX = this.radius;
            this.dx = -this.dx;
        }

        // Rebote en el suelo
        if (this.posY + this.radius >= window_height) {
            this.posY = window_height - this.radius;

            if (Math.abs(this.dy) > 1.2) {
                this.dy = -this.dy * this.restitution;
                this.bounces++;
                this.dx += (Math.random() - 0.5) * 0.6;

                if (this.bounces >= this.maxBounces) this.reset(false);
            } else {
                this.reset(false);
            }
        }
    }

    // 🚀 Dibujo ultrarrápido (solo drawImage con rotación)
    draw(context) {
        const s = this.sprite;
        context.save();
        context.translate(this.posX, this.posY);
        context.rotate(this.rotation);
        // drawImage es MUCHO más rápido que redibujar círculo+emoji+sombra
        context.drawImage(s.canvas, -s.halfSize, -s.halfSize);
        context.restore();
    }

    containsPoint(x, y) {
        const dx = x - this.posX;
        const dy = y - this.posY;
        return dx * dx + dy * dy <= this.radius * this.radius; // sin sqrt
    }
}

// ============================================================
// 🎮 OBJETOS
// ============================================================
const objects = [];
for (let i = 0; i < NUM_OBJECTS; i++) {
    objects.push(new FallingObject());
}

// ============================================================
// 📊 HUD (contador + nivel)
// ============================================================
function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
}

function drawHUD() {
    const panelW = 260, panelH = 90;
    const panelX = window_width - panelW - 20;
    const panelY = 20;

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.lineWidth = 2;
    roundRect(ctx, panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Objetos eliminados:", panelX + 15, panelY + 25);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.fillText(destroyedCount, panelX + 15, panelY + 60);

    let level = "INICIO", color = "#ffffff";
    if (destroyedCount > 20) { level = "ALTA"; color = "#ff4d4d"; }
    else if (destroyedCount > 10) { level = "MEDIA"; color = "#ffd23f"; }

    ctx.fillStyle = color;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Velocidad: " + level, panelX + panelW - 15, panelY + 45);
}

// ============================================================
// 🔁 LOOP PRINCIPAL
// ============================================================
function animate() {
    // Fondo: un solo drawImage (rapidísimo)
    ctx.drawImage(bgCanvas, 0, 0);

    const speedMult = getSpeedMultiplier();

    // Actualizar + dibujar
    for (let i = 0; i < objects.length; i++) {
        objects[i].update(ctx, speedMult);
        objects[i].draw(ctx);
    }

    drawHUD();

    requestAnimationFrame(animate);
}

// ============================================================
// 🖱️ MOUSE
// ============================================================
canvas.addEventListener("click", function (event) {
    if (event.button !== 0) return;

    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    for (let i = objects.length - 1; i >= 0; i--) {
        if (objects[i].containsPoint(mx, my)) {
            objects[i].reset(false);
            destroyedCount++;
            break;
        }
    }
});

// ============================================================
// ▶️ INICIO
// ============================================================
animate();