import { toRadian } from './utils.js';

(function() {
    'use strict';

    const mainCanvas = document.querySelector('#canvas-main');
    const mainContext = mainCanvas.getContext('2d');
    const detailCanvas = document.querySelector('#canvas-details');
    const detailContext = detailCanvas.getContext('2d');
    console.log(detailContext instanceof CanvasState);
    // const width = 1920;
    // const height = 1080;
    // mainCanvas.height = height;
    // mainCanvas.width = width;
    
    const resetCircleDetails = () => {
        document.querySelector('#circle-centre').checked = false;
        document.querySelector('#circle-radii').checked = false;
    }

    resetCircleDetails();

    const outlinedCircle = (erase = false) => {
        const colour = erase ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
        return function(context, circle) {
            context.strokeStyle = colour;
            context.beginPath();
            context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI, false);
            context.stroke();
            context.closePath();
        }
    };

    const filledCircle = (erase = false) => {
        const colour = erase ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
        const deltaRadius = erase ? 0.2 : 0; // in case there's aliasing
        return function(context, circle) {
            context.fillStyle = colour;
            context.beginPath();
            context.arc(circle.x, circle.y, circle.r + deltaRadius, 0, 2 * Math.PI, false);
            context.fill();
            console.log(typeof(CanvasRenderingContext2D))
            console.log(typeof(context))
            context.closePath(); 
        }
    };

    const radiiCircle = (erase = false) => {
        const colour = erase ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
        const lineWidth = erase ? 2 : 1;
        return function(context, circle, n) {
            context.strokeStyle = colour;
            context.lineWidth = lineWidth;
            context.beginPath();
            context.moveTo(circle.x, circle.y);
            context.lineTo(circle.x, circle.y - circle.r);
            context.lineTo(circle.x, circle.y);
            context.stroke();
            context.closePath();
            context.beginPath();
            context.moveTo(circle.x, circle.y);
            context.lineTo(circle.x, circle.y + circle.r);
            context.lineTo(circle.x, circle.y);
            context.stroke();
            context.closePath();
            context.beginPath();
            context.moveTo(circle.x, circle.y);
            context.lineTo(circle.x - circle.r, circle.y);
            context.lineTo(circle.x, circle.y);
            context.stroke();
            context.closePath();
            context.beginPath();
            context.moveTo(circle.x, circle.y);
            context.lineTo(circle.x + circle.r, circle.y);
            context.lineTo(circle.x, circle.y);
            context.stroke();
            context.closePath();
        }
        // const angle = toRadian(360 / n);
        // for (let i = 0; i < n; i++) {
        //     context.lineTo(x, y);
        // }
    }

//TODO find difference between width and boundingRectangle

    const drawStack = {
        circles: [],
        centre: null,
        radii: []
    }

    const displayForm = (name) => {
        detailContext.clearRect(0, 0, detailCanvas.width, detailCanvas.height);
        document.querySelectorAll('#canvas-details-div > div')
            .forEach(form => form.style.display = (form.id === name) ? 'grid' : 'none');
    };

    document.querySelector('#circle').addEventListener('click', function(event) {
        displayForm('circle-details');
        const circle = { x: detailCanvas.width / 2, y: detailCanvas.height / 2, r: 50 };
        drawStack.circles.push(outlinedCircle(false), [detailContext, circle]);
        outlinedCircle()(detailContext, circle);
    });

    document.querySelector('#circle-centre').addEventListener('click', function(event) {
        const circle = { x: detailCanvas.width / 2, y: detailCanvas.height / 2, r: 5 };
        if (this.checked && !drawStack.centre) {
            drawStack.centre = circle;
        }
        filledCircle(!this.checked)(detailContext, circle);
    });

    document.querySelector('#circle-radii').addEventListener('click', function(event) {
        document.querySelector('#n-circle-radii').style.display = this.checked ? 'grid' : 'none';
        const circle = { x: detailCanvas.width / 2, y: detailCanvas.height / 2, r: 50 };
        drawStack.radii.push(outlinedCircle(!this.checked), [detailContext, circle, 5]);
        radiiCircle(!this.checked)(detailContext, circle, 5);
    });

    // document.querySelector('#n-circle-radii').addEventListener('click', function(event) {
    //     radiiCircle(true)(detailContext, circle, )
    //     radiiCircle(this.checked)(detailContext, circle, this.value);
    // });

})();

