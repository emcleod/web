// // cielab
// function rgbToLab(r, g, b) {
//   // RGB to XYZ
//   let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
//   let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
//   let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

//   // XYZ to Lab
//   x /= 95.047;
//   y /= 100;
//   z /= 108.883;

//   x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
//   y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
//   z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

//   return [
//     (116 * y) - 16,
//     500 * (x - y),
//     200 * (y - z)
//   ];
// }

// function labDistance(lab1, lab2) {
//   const dL = lab1[0] - lab2[0];
//   const da = lab1[1] - lab2[1];
//   const db = lab1[2] - lab2[2];
//   return Math.sqrt(dL*dL + da*da + db*db);
// }

// // main script
// const colorWorker = new Worker('colorWorker.js');
// colorWheel.addEventListener('change', (e) => {
//   const pickedColor = e.detail.color;
//   colorWorker.postMessage({type: 'findClosest', color: pickedColor});
// });
// colorWorker.onmessage = (e) => {
//   displayClosestColors(e.data);
// };

// // In colorWorker.js
// self.onmessage = (e) => {
//   if (e.data.type === 'findClosest') {
//     const closest = findClosestColor(e.data.color, colors, 3);
//     self.postMessage(closest);
//   }
// };

// for wheel picker if cielab doesn't work
// function colorDistance(color1, color2) {
//   const rDiff = color1[0] - color2[0];
//   const gDiff = color1[1] - color2[1];
//   const bDiff = color1[2] - color2[2];
//   return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
// }

// function findClosestColor(targetColor, colorList) {
//   return colorList.reduce((closest, current) => {
//     const currentDistance = colorDistance(targetColor, current.rgb);
//     const closestDistance = colorDistance(targetColor, closest.rgb);
//     return currentDistance < closestDistance ? current : closest;
//   });
// }

// function findNClosestColors(targetColor, colorList, n) {
//   return colorList
//     .map((color) => ({
//       ...color,
//       distance: colorDistance(targetColor, color.rgb),
//     }))
//     .sort((a, b) => a.distance - b.distance)
//     .slice(0, n);
// }

// // Using a library like kdtree-js if it's too slow
// const tree = new KDTree(colors.map((c) => c.rgb));
// const nearest = tree.nearest(pickedColor, 1)[0];

// colorWheel.addEventListener("colorchange", (event) => {
//   const pickedColor = event.detail.rgb; // Assuming this is how your color wheel reports colors
//   const closestMatches = findNClosestColors(pickedColor, colors, 5);
//   updateUIWithMatches(closestMatches);
// });

// function updateUIWithMatches(matches) {
//   const matchList = document.getElementById("color-matches");
//   matchList.innerHTML = matches
//     .map(
//       (match) =>
//         `<li style="background-color: rgb(${match.rgb.join(",")})">
//              ${match.names.co1} (Distance: ${match.distance.toFixed(2)})
//            </li>`
//     )
//     .join("");
// }
