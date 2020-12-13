export default function isWithin(x, y, x2, y2, dist) {
  let dx = x - x2;
  let dy = y - y2;
  return dx*dx + dy*dy < dist*dist;
}

