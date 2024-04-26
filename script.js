// -------------------------------------------------
// DIMENSIONAMENTO INICIAL DA PÁGINA
var svg = document.getElementById('chartSvg');

var nodeAttraction = -800;
var simulation;

 function updateSVGDimensions() {
   var innerWidth = window.innerWidth;
   var innerHeight = window.innerHeight;
   svg.setAttribute('width', innerWidth);
   svg.setAttribute('height', innerHeight);
 }



// ---------------------------------------------
//  Envio de arquivo na página inicial 

function updateFileName() {
  var input = document.getElementById('fileUpload');
  var fileName = input.files[0].name;
  var selectedFileNameDiv = document.getElementById('selectedFileName');
  selectedFileNameDiv.innerHTML = 'Arquivo selecionado: ' + fileName;
  selectedFileNameDiv.classList.remove('hidden');
}

function displayError(message) {
  console.log("Erro:", message);
  const errorDisplay = document.getElementById('errorDisplay');
  errorDisplay.textContent = message;
  errorDisplay.classList.remove('hidden');
}

async function sendPostRequest() {
  var input = document.getElementById('fileUpload');
  var file = input.files[0];
  var formData = new FormData();
  formData.append('file', file);
  try {
    const resposta = await fetch('https://hyperstreamapi.onrender.com/uploadcsv/', {
      method: 'POST',
      body: formData
    })
    if (resposta.ok) {
      const bodyResposta = await resposta.json();
      localStorage.setItem('promisedData',JSON.stringify(bodyResposta))
      window.location.href = 'diagrama.html';
    } else {
        displayError('Erro ao carregar arquivo. Por favor, tente novamente.');
    }
  } catch (e) {
    displayError('Por favor, tente novamente.');
    console.error(e);
  }
}

// -------------------------------------------------
// GRÁFICO DE REDE

function linkArc(d) {
  const dx = d.target.x - d.source.x;
  const dy = d.target.y - d.source.y;
  const dr = Math.sqrt(dx * dx + dy * dy);
  return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
}

function createNetChart(data) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  console.log('chartNet',data.children)
  const nodes = Array.from(new Set(data.children.flatMap(d => [d.name, ...d.children.map(c => c.name)])), id => ({ id, r: 5 }));
  const links = data.children.flatMap(d => d.children.map(c => ({ source: d.name, target: c.name })));

  const color = d3.scaleOrdinal(nodes.map(d => d.id), d3.schemeCategory10);

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(nodeAttraction))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  const svg = d3.create("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font: 12px sans-serif;");

  //Definições da seta
  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 16)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", "currentColor")
    .attr("d", "M0,-5L10,0L0,5");

  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", d => color(d.source))
    .attr("marker-end", "url(#arrow)");

  //Definições do caminho
  const node = svg.append("g")
    .attr("fill", "currentColor")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  //Definições das pastas ou nodes
  node.append("circle")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("r", d => d.r)
    .attr("class", "node");

  //Definições do texto
  node.append("text")
    .attr("x", 8)
    .attr("y", "0.31em")
    .text(d => d.id)
    .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3);

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  //Variáveis de bloqueio
  const invalidation = new Promise(resolve => {
    simulation.on("end", resolve);
  });

  invalidation.then(() => simulation.stop());

  function keydownHandler(event) {
    if (event.key === ' ') {

      if (pinnedNode) {
        pinnedNode.fx = null;
        pinnedNode.fy = null;
        pinnedNode.r = 4;
        pinnedNode = null;
      } else {
        pinnedNode = event.subject;
        pinnedNode.fx = pinnedNode.x;
        pinnedNode.fy = pinnedNode.y;
        pinnedNode.r = 8;
      }


      d3.select('.node')
        .attr("r", d => d.r);
    }
  }

  return Object.assign(svg.node(), { scales: { color } });
}


// GRÁFICO INTERATIVO - Movimento

function drag(simulation) {
  let pinnedNode = null;

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
  }

  function dragged(event) {
    if (!pinnedNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// PgUp e PgDown controlam o espaçamento através da atração dos nodes
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowUp' && nodeAttraction < 0 && currentVisualization == 2) {
    nodeAttraction += 100;
    console.log("nodeAttraction increased to:", nodeAttraction);
    simulation.force("charge", d3.forceManyBody().strength(nodeAttraction));
    simulation.alpha(0.3).restart();
  } else if (event.key === 'ArrowDown' && currentVisualization == 2) {
    nodeAttraction -= 100;
    console.log("nodeAttraction decreased to:", nodeAttraction);
    simulation.force("charge", d3.forceManyBody().strength(nodeAttraction));
    simulation.alpha(0.3).restart();
  }
});

// -------------------------------------------------
// Definição da função para PANZOOM

function initializePanzoom() {
  const outerSvg = document.getElementById('chartSvg');
  const innerSvg = outerSvg.querySelector('svg');

  let isDragging = false;
  let lastX;
  let lastY;

  const initialViewBox = innerSvg.viewBox.baseVal;
  let viewBox = [initialViewBox.x, initialViewBox.y, initialViewBox.width, initialViewBox.height];

  outerSvg.addEventListener('mousedown', function(event) {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  outerSvg.addEventListener('mousemove', function(event) {
    if (isDragging) {
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      viewBox[0] -= deltaX;
      viewBox[1] -= deltaY;

      innerSvg.setAttribute('viewBox', viewBox.join(' '));
    }
  });

  outerSvg.addEventListener('mouseup', function() {
    isDragging = false;
  });

  outerSvg.addEventListener('wheel', function(event) {
    event.preventDefault();

    const delta = Math.max(-1, Math.min(1, event.deltaY));
    const scaleFactor = 1 + delta * 0.25;

    const mouseX = event.clientX - outerSvg.getBoundingClientRect().left;
    const mouseY = event.clientY - outerSvg.getBoundingClientRect().top;

    const viewBoxWidth = viewBox[2];
    const viewBoxHeight = viewBox[3];

    const newWidth = viewBoxWidth * scaleFactor;
    const newHeight = viewBoxHeight * scaleFactor;

    const deltaX = (viewBoxWidth - newWidth) * (mouseX / outerSvg.clientWidth);
    const deltaY = (viewBoxHeight - newHeight) * (mouseY / outerSvg.clientHeight);

    viewBox[0] += deltaX;
    viewBox[1] += deltaY;
    viewBox[2] = newWidth;
    viewBox[3] = newHeight;

    innerSvg.setAttribute('viewBox', viewBox.join(' '));
  });
}

// -------------------------------------------------
// GRÁFICO DE ÁRVORE

function createHorizontalTreeChart(data) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cx = width * 0.5;
  const cy = height * 0.59;
  const margin = { top: 10, right: 120, bottom: 10, left: 40 };
  // Define a color scale
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Atribuir profundidade para os nodes
  function assignDepth(node, depth) {
    node.depth = depth;
    if (node.children) {
      node.children.forEach(child => assignDepth(child, depth + 1));
    }
  }
  assignDepth(data, 0);

  // Criar layout de árvore horizontal. A primeira dimensão do layout (x) é a altura, e a segunda (y) é a largura.
  const tree = d3.tree()
    .size([height - margin.top - margin.bottom, width - margin.right - margin.left]);

  // Ordenar árvore
  const root = tree(d3.hierarchy(data)
    .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

  // Calculate the spacing between nodes based on the width
  const nodeSpacing = width / (root.height + 1);

  //SVG Container.
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Adicionar links.
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(root.links())
    .join("path")
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  // Adicionar pastas como nodes.
  const node = g.append("g")
    .selectAll()
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.depth * nodeSpacing},${d.x})`);

  node.append("circle")
    .attr("fill", d => colorScale(d.data.isBackup ? d.depth - 1 : d.depth))
    .attr("r", 2.5);

  // Adicionar legendas.
  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .attr("paint-order", "stroke")
    .attr("stroke", "white")
    .attr("fill", "currentColor")
    .attr("transform", "rotate(4)") // Rotate the text
    .text(d => d.data.name);

  return svg.node();
}

// -------------------------------------------------
// TOOGLE - Gráfico de árvore OU Diagrama interativo

var currentVisualization = 1;

if(document.title === 'Diagramas') {
  document.getElementById('toggleButton').addEventListener('click', function() {
    toggleVisualization();
  });
}

function toggleVisualization() {
  updateSVGDimensions();
  //window.addEventListener('resize', updateSVGDimensions);
  const promised_data = JSON.parse(localStorage.getItem('promisedData'));
  console.log(promised_data);
  if (currentVisualization === 1) {
      // CONFIG: Diagrama interativo
      const chart = createNetChart(promised_data.network);

      document.getElementById("chartSvg").innerHTML = '';
      document.getElementById("chartSvg").appendChild(chart);

      initializePanzoom();
      currentVisualization = 2;
      console.log("currentVisualization: ", currentVisualization)
      toggleDescription(2);

  } else {

    // CONFIG: Gráfico de árvore
    const chart = createHorizontalTreeChart(promised_data.tree);

    document.getElementById("chartSvg").innerHTML = '';
    document.getElementById("chartSvg").appendChild(chart);

    initializePanzoom();
    currentVisualization = 1;
    console.log("currentVisualization:", currentVisualization);
    toggleDescription(1);
  }
}

// CONFIG: Legenda Toggle 

function toggleDescription(setTo) {

  const legendDescription = document.getElementById('legendDescription');
  const legendItems = document.getElementById('legendItems');
  const toggleButton = document.getElementById('toggleButton');

  if (setTo == 2) {

    legendDescription.innerText = "Diagrama mostrando os caminhos que os arquivos fazem e suas correlações";
    legendItems.innerHTML = `
      <p class="mt-1"><span class="font-bold">PgDown</span> ↓ - Aumenta o espaçamento entre nodes</p>
      <p class="mt-3"><span class="font-bold">PgUp</span> ↑ - Diminui o espaçamento entre nodes</p>
      <p class="mt-3"><span class="font-bold">→</span> - Setas indicando a origem e destino, respectivamente</p>
      <p class="mt-3"><span class="font-bold">◉</span> - Pastas</p>
    `;
    toggleButton.innerText = "Visualizar Diagrama de Aplicações";

  } else {

    legendDescription.innerText = "Diagrama mostrando os caminhos hierárquicos entre os elementos";
    legendItems.innerHTML = `
    <p class="mt-1"><span class="font-bold">◉</span> - Aplicações</p>
      <p class="mt-3"><span class="font-bold">Conexão →</span> - Ligação entre Aplicações</p>
    `;
    toggleButton.innerText = "Visualizar Diagrama de Pastas";

  };
}
