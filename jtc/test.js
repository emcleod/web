const container = document.getElementById('canvas-container');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = 1920;
const height = 1080;
canvas.height = height;
canvas.width = width;

const toRadian = angle => Math.PI * angle / 180;

const drawCircle = (x, y, r, startAngle, endAngle, decorator = noop) => {
    ctx.beginPath();
    ctx.arc(x, y, r, toRadian(startAngle), toRadian(endAngle), false);
    ctx.stroke();
    ctx.closePath();
    decorator(x, y, r);
}
const drawEllipse = (x, y, radiusX, radiusY, rotation, startAngle, endAngle) => {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, toRadian(rotation), toRadian(startAngle), toRadian(endAngle));
    ctx.stroke();
    ctx.closePath();
};

const noop = () => {};

const wovenWheel = (x, y, r) => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.arc(x, y, 4, 0, toRadian(360), false);
    ctx.fill();
    ctx.closePath();
}

// this will be selected via button and be either petals or dots for lines for a woven wheel
const decorator = wovenWheel;
drawCircle(100, 100, 50, 0, 360, wovenWheel);
//drawEllipse(200, 200, 50, 70, 40, 10, 270);


let drawing = false;

const getMousePos = (canvas, event) => {
    const boundingRectangle = canvas.getBoundingClientRect();
    const scaleX = canvas.width / boundingRectangle.width;
    const scaleY = canvas.height / boundingRectangle.height;
    return {
        x: (event.clientX - boundingRectangle.left) * scaleX,
        y: (event.clientY - boundingRectangle.top) * scaleY
    };
}

const startDraw = event => {
    drawing = true;
    ctx.beginPath();
    draw(event);
}

const endDraw = event => drawing = false;

const draw = event => {
    if (!drawing) {
        return;
    }
    let { x, y } = getMousePos(canvas, event);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

window.addEventListener('mousedown', startDraw);
window.addEventListener('mouseup', endDraw);
window.addEventListener('mousemove', draw);