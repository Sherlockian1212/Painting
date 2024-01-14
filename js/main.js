const canvas = document.getElementById("canvas");
const buffer = document.getElementById("buffer");
canvas.width = buffer.width = w = 500
canvas.height = buffer.height = h = 320
const c = canvas.getContext("2d");
const b = buffer.getContext("2d");
let mouse = false;
const path = [];
let selectedColor = "#000000"; // Màu mặc định là đen
let selectedSize = 1; // Kích thước mặc định là 1
let fillEnabled = false;
let previousData; // Biến để lưu trữ dữ liệu vẽ hiện tại
let drawHistory = [];
let drawHistoryIndex = -1;
document.getElementById("undoButton").addEventListener("click", undo);

document.getElementById("fillTool").addEventListener("click", function() {
  fillEnabled = !fillEnabled;
  selectTool("fillTool")
});
function fill(x, y, targetColor) {
  const pixelStack = [{ x: x, y: y }];

  while (pixelStack.length) {
    const pixel = pixelStack.pop();

    // Kiểm tra xem pixel có nằm trong phạm vi của canvas không
    if (pixel.x >= 0 && pixel.x < w && pixel.y >= 0 && pixel.y < h) {
      const currentColor = c.getImageData(pixel.x, pixel.y, 1, 1).data;

      if (
        currentColor[0] === targetColor[0] &&
        currentColor[1] === targetColor[1] &&
        currentColor[2] === targetColor[2] &&
        currentColor[3] === targetColor[3]
      ) {
        // Tiếp tục tô màu
        c.fillStyle = selectedColor;
        c.fillRect(pixel.x, pixel.y, 1, 1);

        pixelStack.push({ x: pixel.x + 1, y: pixel.y });
        pixelStack.push({ x: pixel.x - 1, y: pixel.y });
        pixelStack.push({ x: pixel.x, y: pixel.y + 1 });
        pixelStack.push({ x: pixel.x, y: pixel.y - 1 });
      }
    }
  }
}
let selectedTool = "pencilTool"; // Công cụ được chọn mặc định

function selectTool(tool) {
  // Loại bỏ lớp "active-tool" từ tất cả các nút công cụ
  document.querySelectorAll('.toolbar button').forEach(btn => {
    btn.classList.remove('active-tool');
  });

  // Thêm lớp "active-tool" cho nút công cụ được chọn
  document.getElementById(tool).classList.add('active-tool');
  document.getElementById(selectTool).classList.remove('active-tool');
  // Cập nhật công cụ được chọn
  selectedTool = tool;
}
// Thêm sự kiện lắng nghe cho chọn màu
document.getElementById("colorPicker").addEventListener("input", function (event) {
    selectedColor = event.target.value;
   
});

// Thêm sự kiện lắng nghe cho chọn kích thước
document.getElementById("sizePicker").addEventListener("input", function (event) {
    selectedSize = parseInt(event.target.value, 10);
    updateCurrentSizeDisplay(selectedSize);
});
function updateCurrentSizeDisplay(size) {
  const currentSizeDisplay = document.getElementById("currentSize");
  currentSizeDisplay.textContent = "Size: "+ size + " px" ;
}
// Cập nhật hàm vẽ để sử dụng màu và kích thước đã chọn
const updateDrawingContext = function (context) {
    context.strokeStyle = selectedColor;
    context.lineWidth = selectedSize;
};
const star = {
  path: [], brush: 1,
  action: function(x, y) {
    this.path.push({
      x: x, y: y});
    updateDrawingContext(b); b.clearRect(0, 0, w, h);
    ini = this.path[0];
    dx = ini.x - this.path[this.path.length - 1].x; dy = ini.y - this.path[this.path.length - 1].y;
    const outerRadius = Math.sqrt(dx * dx + dy * dy); 
    const innerRadius = outerRadius / 2;
    const angleAdjustment = Math.atan2(dy, dx) - Math.PI / 2;
    b.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / 5) * i + angleAdjustment;
      b.lineTo(
        this.path[0].x + Math.cos(angle) * radius,
        this.path[0].y + Math.sin(angle) * radius);}
    b.closePath(); b.stroke();},
  endAction: function() {
    updateDrawingContext(c);
    ini = this.path[0];
    dx = ini.x - this.path[this.path.length - 1].x; dy = ini.y - this.path[this.path.length - 1].y;  
    const outerRadius = Math.sqrt(dx * dx + dy * dy);
    const innerRadius = outerRadius / 2;
    const angleAdjustment = Math.atan2(dy, dx) - Math.PI / 2;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / 5) * i + angleAdjustment;
      c.lineTo(
        this.path[0].x + Math.cos(angle) * radius, this.path[0].y + Math.sin(angle) * radius);}
    c.closePath(); c.stroke();
    this.path = [];}};
const rectangle = {
  path: [],

  brush: 1,

  action: function(x, y) {
    this.path.push({
      x: x,
      y: y
    });
    updateDrawingContext(b);
    b.clearRect(0, 0, w, h);
    b.strokeRect(this.path[0].x, this.path[0].y,
      (this.path[this.path.length - 1].x - this.path[0].x),
      (this.path[this.path.length - 1].y - this.path[0].y));
  },

  endAction: function() {
    updateDrawingContext(c);
    b.clearRect(0, 0, w, h);
    c.strokeRect(this.path[0].x, this.path[0].y,
      (this.path[this.path.length - 1].x - this.path[0].x),
      (this.path[this.path.length - 1].y - this.path[0].y));
   
    this.path = [];
  }
};

const circle = {
  path: [],

  brush: 1,

  action: function(x, y) {
    this.path.push({
      x: x,
      y: y
    });
    updateDrawingContext(b);
    ini = this.path[0];
    dx = ini.x - this.path[this.path.length - 1].x;
    dy = ini.y - this.path[this.path.length - 1].y;
    rad = Math.sqrt(dx * dx + dy * dy);
    b.clearRect(0, 0, w, h);
    b.beginPath();
    b.arc(ini.x, ini.y, rad, 0, 2 * Math.PI);
    b.stroke();
  },

  endAction: function() {
    updateDrawingContext(c);
    ini = this.path[0];
    dx = ini.x - this.path[this.path.length - 1].x;
    dy = ini.y - this.path[this.path.length - 1].y;
    rad = Math.sqrt(dx * dx + dy * dy);
    b.clearRect(0, 0, w, h);
    c.beginPath();
    c.arc(ini.x, ini.y, rad, 0, 2 * Math.PI);
    c.stroke();
    
    this.path = [];
  }
};

const line = {
  path: [],

  brush: 1,

  action: function(x, y) {
    this.path.push({
      x: x,
      y: y
    });
    updateDrawingContext(b);
    b.clearRect(0, 0, w, h);
    b.beginPath();
    b.moveTo(this.path[0].x, this.path[0].y);
    b.lineTo(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y);
    b.stroke();
  },

  endAction: function() {
    updateDrawingContext(c);
    c.beginPath();
    c.moveTo(this.path[0].x, this.path[0].y);
    c.lineTo(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y);
    b.clearRect(0, 0, w, h);
    c.stroke();
    
    this.path = [];
  }
};

const pencil = {
  path: [],

  brush: 1,

  action: function(x, y) {
    this.path.push({
      x: x,
      y: y
    });
    updateDrawingContext(b)
    updateDrawingContext(c);
    
    
    if (this.path.length > 1) {
      c.lineTo(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y);
      c.stroke();
      this.path.shift();
    }else{
      c.beginPath();
      c.moveTo(this.path[0].x, this.path[0].y);    
    }
  },

  endAction: function() {
    updateDrawingContext(c);
    if (this.path.length < 2) {
      c.fillRect((x-100)-(selectedSize/2), y-(selectedSize/2), selectedSize, selectedSize);
    }
   
    this.path = [];
  }
};

const eraser = {
  brush: 10,

  action: function(x, y) {
   
    
    // Thay đổi kích thước của cục tẩy
    const eraserSize = selectedSize;
    updateDrawingContext(b);
    b.strokeStyle="#000000"
    b.lineWidth=1;
    this.brush=selectedSize;
    c.clearRect(x - (eraserSize / 2), y - (eraserSize / 2), eraserSize, eraserSize);
  },

  endAction: function(x, y) {
    
   
    // Thay đổi kích thước của cục tẩy
    const eraserSize = selectedSize;
    updateDrawingContext(c)
    c.strokeStyle="#000000"
    c.lineWidth=1;
    this.brush=selectedSize;
    c.clearRect(x - (eraserSize / 2), y - (eraserSize / 2), eraserSize, eraserSize);
   
  }
};

t = pencil;


document.getElementById("pencilTool").addEventListener("click", function() {
  t = pencil;
  selectTool("pencilTool");
});

document.getElementById("eraserTool").addEventListener("click", function() {
  t = eraser;
  selectTool("eraserTool");
});

document.getElementById("lineTool").addEventListener("click", function() {
  t = line;
  selectTool("lineTool");
});

document.getElementById("circleTool").addEventListener("click", function() {
  t = circle;
  selectTool("circleTool");
});

document.getElementById("rectangleTool").addEventListener("click", function() {
  t = rectangle;
  selectTool("rectangleTool");
});

document.getElementById("starTool").addEventListener("click", function() {
  t = star;
  selectTool("starTool");
});
canvas.addEventListener("mousedown", function (evt) {
  click = evt.which || evt.button;
  if (click === 1) {
    mouse = true;
    const x = evt.clientX;
    const y = evt.clientY;
    if (fillEnabled) {
      const targetColor = c.getImageData(x - 100, y, 1, 1).data;
      fill(x - 100, y, targetColor);
    } else {
      updateDrawingContext(b);
      updateDrawingContext(c);
      t.action(x - 100, y);
    }
    saveCurrentState(); // Lưu trạng thái hiện tại vào lịch sử
  }
});


canvas.addEventListener("mouseup", function() {
  mouse = false;
  t.endAction();
});


canvas.addEventListener("mousemove", function(evt) {
  x = evt.clientX;
  y = evt.clientY;
  updateDrawingContext(b);
  
  if(t==eraser){
    b.strokeStyle="#000000"
    b.lineWidth=1;
    
    eraser.brush = selectedSize;
  }
  updateDrawingContext(c);
  if(t==eraser){
    c.lineWidth=1;
    c.strokeStyle="#000000"
    t.brush = selectedSize;
  }
  if (t.brush) {
    b.clearRect(0, 0, w, h);
    b.strokeRect((x-100) - (t.brush / 2), y - (t.brush / 2), t.brush, t.brush);
  }
  if (mouse) {
    t.action(x-100, y);
  }
});
const toolbar = document.querySelector('.toolbar');

toolbar.addEventListener('mousemove', function() {
  b.clearRect(0, 0, w, h);
});
document.getElementById("clearCanvas").addEventListener("click", function() {
  clearCanvas();
  selectTool("clearCanvas")
});

function clearCanvas() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  b.clearRect(0, 0, canvas.width, canvas.height);
}
// Thêm sự kiện lắng nghe cho chiều rộng và chiều cao của canvas
document.getElementById("canvasWidth").addEventListener("input", function (event) {
  const newWidth = parseInt(event.target.value, 10);
  updateCanvasSize(newWidth, canvas.height);
});

document.getElementById("canvasHeight").addEventListener("input", function (event) {
  const newHeight = parseInt(event.target.value, 10);
  updateCanvasSize(canvas.width, newHeight);
});
function saveCurrentData() {
  previousData = c.getImageData(0, 0, canvas.width, canvas.height);
}

// Hàm để vẽ lại dữ liệu đã lưu vào canvas mới
function redrawPreviousData() {
  c.putImageData(previousData, 0, 0);
}

// Sự kiện khi thay đổi kích thước canvas
function updateCanvasSize(newWidth, newHeight) {
  saveCurrentData(); // Lưu trữ dữ liệu vẽ hiện tại

  canvas.width = buffer.width = newWidth;
  canvas.height = buffer.height = newHeight;
  c.canvas.width = b.canvas.width = newWidth;
  c.canvas.height = b.canvas.height = newHeight;

  // Cập nhật lại chiều rộng và chiều cao của context vẽ
  w = newWidth;
  h = newHeight;

  clearCanvas();
  mouse = false;
  redrawPreviousData(); // Vẽ lại dữ liệu đã lưu
}
function saveCurrentState() {
  if (drawHistoryIndex < drawHistory.length - 1) {
    drawHistory.splice(drawHistoryIndex + 1);
  }
  drawHistory.push(c.getImageData(0, 0, canvas.width, canvas.height));
  drawHistoryIndex = drawHistory.length - 1;
}

function undo() {
  
    drawHistoryIndex--;
    redrawPreviousDataUnRe();
}

function redrawPreviousDataUnRe() {
  c.putImageData(drawHistory[drawHistoryIndex+1], 0, 0);
}


