const canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// Obtiene las dimensiones de la pantalla actual
const window_height = window.innerHeight;
const window_width = window.innerWidth;

// Establecer el tamaño del canvas
canvas.height = window_height;
canvas.width = window_width;

// Color de fondo
canvas.style.background = "#ff8";


class Circle {

    // Constructor de la clase Circle
    constructor(x, y, radius, color, text, speed) {

        // Atributos originales
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.color = color;
        this.text = text;
        this.speed = speed;

        // Movimiento del círculo
        this.dx = 1 * this.speed;
        this.dy = 1 * this.speed;

        // Indica si el círculo está en colisión
        this.isColliding = false;
    }


    // Método para dibujar el círculo
    draw(context) {

        context.beginPath();

        // Si está en colisión, cambia a azul
        if (this.isColliding) {

            context.strokeStyle = "#0000FF";

        } else {

            // Si no está en colisión,
            // conserva su color original
            context.strokeStyle = this.color;
        }

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "20px Arial";

        // Mostrar el nombre del círculo
        context.fillText(
            this.text,
            this.posX,
            this.posY
        );

        context.lineWidth = 2;

        // Dibujar el círculo
        context.arc(
            this.posX,
            this.posY,
            this.radius,
            0,
            Math.PI * 2,
            false
        );

        context.stroke();

        context.closePath();
    }


    // Método para actualizar la posición
    update(context) {

        this.draw(context);


        // Actualizar posición X
        this.posX += this.dx;


        // Cambiar dirección al llegar
        // a los bordes izquierdo o derecho
        if (
            this.posX + this.radius > window_width ||
            this.posX - this.radius < 0
        ) {

            this.dx = -this.dx;
        }


        // Actualizar posición Y
        this.posY += this.dy;


        // Cambiar dirección al llegar
        // a los bordes superior o inferior
        if (
            this.posY + this.radius > window_height ||
            this.posY - this.radius < 0
        ) {

            this.dy = -this.dy;
        }
    }


    // Método para detectar colisión
    // con otro círculo
    checkCollision(otherCircle) {

        // Diferencia entre las posiciones X
        const dx =
            this.posX - otherCircle.posX;

        // Diferencia entre las posiciones Y
        const dy =
            this.posY - otherCircle.posY;


        // Fórmula de distancia entre los centros:
        //
        // d = √((x2-x1)² + (y2-y1)²)
        //
        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        // Suma de los radios
        const sumRadius =
            this.radius +
            otherCircle.radius;


        // Si la distancia entre los centros
        // es menor o igual a la suma
        // de los radios, existe colisión
        return distance <= sumRadius;
    }
}


// Array para almacenar los círculos
let circles = [];


// Función para generar círculos
function generateCircles(n) {

    for (let i = 0; i < n; i++) {

        // Radio aleatorio entre 20 y 50
        let radius =
            Math.random() * 30 + 20;


        // Posición X aleatoria
        let x =
            Math.random() *
            (window_width - radius * 2)
            + radius;


        // Posición Y aleatoria
        let y =
            Math.random() *
            (window_height - radius * 2)
            + radius;


        // Generar color aleatorio
        let color =
            `#${Math.floor(
                Math.random() * 16777215
            ).toString(16).padStart(6, "0")}`;


        // Velocidad aleatoria entre 1 y 5
        let speed =
            Math.random() * 4 + 1;


        // Nombre del círculo
        let text =
            `C${i + 1}`;


        // Crear el objeto Circle
        circles.push(
            new Circle(
                x,
                y,
                radius,
                color,
                text,
                speed
            )
        );
    }
}


// Función para detectar las colisiones
function detectCollisions() {

    // Al comenzar cada ciclo,
    // todos los círculos se consideran
    // fuera de una colisión
    circles.forEach(circle => {

        circle.isColliding = false;

    });


    // Comparar todos los círculos
    for (let i = 0; i < circles.length; i++) {

        for (
            let j = i + 1;
            j < circles.length;
            j++
        ) {

            // Obtener los dos círculos
            let circleA = circles[i];
            let circleB = circles[j];


            // Verificar si existe una colisión
            if (
                circleA.checkCollision(circleB)
            ) {

                // Cambiar ambos círculos
                // al estado de colisión
                circleA.isColliding = true;
                circleB.isColliding = true;
            }
        }
    }
}


// Función principal de animación
function animate() {

    // Limpiar el canvas
    ctx.clearRect(
        0,
        0,
        window_width,
        window_height
    );


    // Detectar las colisiones
    detectCollisions();


    // Actualizar todos los círculos
    circles.forEach(circle => {

        circle.update(ctx);

    });


    // Repetir la animación
    requestAnimationFrame(animate);
}


// Crear exactamente 20 círculos
generateCircles(20);


// Iniciar la animación
animate();