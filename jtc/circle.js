//import { Draw } from './draw.js';
import { toRadian } from './utils.js';
'use strict';

//  export function draw(circle, ctx/*, shape, style*/) {
//     console.log("here");
//     ctx.beginPath();
// //    shape(circle.x, circle.y, circle.r, 0, 2 * Math.PI, false);
//     style();
//     ctx.closePath();
// }
// export class Circle {
//     constructor(x, y, r, ) {
//         this.x = x;
//         this.y = y;
//         this.r = r;
//     }

//     draw() {
//         return ctx => ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
//     }
// }

class CentreDot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw() {
        return function(ctx) {
            ctx.arc(x, y, 10, 0, Math.PI * 2, false);
        }
    }
}

// class Radius {
//     constructor()
// }
