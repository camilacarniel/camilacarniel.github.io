//CONFIGURAÇÕES DO FUNDO DA TELA INICIAL

const background = document.getElementById("background");
const particlesCanvas = document.getElementById("particles");
const ctx = particlesCanvas.getContext("2d");

//Tamanho do fundo
particlesCanvas.width = window.innerWidth;
particlesCanvas.height = window.innerHeight;

//Imagem do fundo - gradiente
background.style.backgroundImage = "url('fundo_grad.jpg')";

//Configurações das particulas
const particles_n = 350;
const speedX_mul = 0.4;
const speedY_mul = 0.2;
const particle_color = "rgba(255,255,255)";
const weight_color = "rgba(60, 190, 190, 0.05)";
const mouseAvoidance = 50;
const neighbors_n = 10;

const particles = [];

function getDist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function init() {
  for (let i = 0; i < particles_n; i++) {
    const x = Math.floor(Math.random() * particlesCanvas.width);
    const y = Math.floor(Math.random() * particlesCanvas.height);
    const speedX = Math.random() * speedX_mul;
    const speedY = Math.random() * speedY_mul;
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;

    particles.push({
      x,
      y,
      speedX: dirX * speedX,
      speedY: dirY * speedY,
      neighbors: [],
    });
  }
  requestAnimationFrame(draw);
}

let mouseX;
let mouseY;

function draw() {
  ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

  ctx.fillStyle = particle_color;
  for (let i = 0; i < particles.length; i++) {
    let x = particles[i].x + particles[i].speedX;
    let y = particles[i].y + particles[i].speedY;
    if (x < 0 || x > particlesCanvas.width || y < 0 || y > particlesCanvas.height) {
      x = Math.floor(Math.random() * particlesCanvas.width);
      y = Math.floor(Math.random() * particlesCanvas.height);
    }

    const x1 = mouseX || 2000;
    const y1 = mouseY || 2000;
    const dist = getDist(x, y, x1, y1);
    if (dist < mouseAvoidance) {
      if (x < x1) {
        x -= 2;
      } else {
        x += 2;
      }
      if (y < y1) {
        y -= 2;
      } else {
        y += 2;
      }
    }

    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    particles[i].x = x;
    particles[i].y = y;
  }

  ctx.strokeStyle = weight_color;
  for (let i = 0; i < particles.length; i++) {
    const x = particles[i].x;
    const y = particles[i].y;
    const neighbors = particles[i].neighbors;
    for (let j = 0; j < neighbors.length; j++) {
      const x1 = neighbors[j].x;
      const y1 = neighbors[j].y;
      const dist = getDist(x, y, x1, y1);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

init();

particlesCanvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  setTimeout(() => {
    if (mouseX === e.clientX && mouseY === e.clientY) {
      for (let i = 0; i < particles.length; i++) {
        let x = particles[i].x;
        let y = particles[i].y;
        const x1 = e.clientX;
        const y1 = e.clientY;
        const dist = getDist(x, y, x1, y1);

        if (dist < 200) {
          if (x < x1) {
            x -= 2;
          } else {
            x += 2;
          }
          if (y < y1) {
            y -= 2;
          } else {
            y += 2;
          }
        }
        particles[i].x = x;
        particles[i].y = y;
      }
    }
  }, 10);
});

setInterval(() => {
  const copy = [...particles];
  for (let i = 0; i < particles.length; i++) {
    const x = particles[i].x;
    const y = particles[i].y;

    copy.sort((a, b) => {
      const x1 = a.x;
      const x2 = b.x;
      const y1 = a.y;
      const y2 = b.y;
      const dist1 = getDist(x, y, x1, y1);
      const dist2 = getDist(x, y, x2, y2);
      return dist1 - dist2;
    });

    particles[i].neighbors = copy.slice(0, neighbors_n);
  }
}, 250);
