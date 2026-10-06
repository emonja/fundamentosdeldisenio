import {properties, emotions} from './model.mjs';
export function face(index) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M49 8 C78 7 91 28 88 54 C89 80 68 92 44 89 C18 88 8 67 11 43 C10 22 30 9 49 8 Z M31 32 L31 53 M65 33 L65 54 M48 49 L52 53 M52 49 L48 53 ${emotions[index].mouth}"/></svg>`;
}
export function field(element, stage, student, emotion) {
  const p = properties(student, emotion);
  element.className = 'field ' + stage;
  element.style.backgroundColor = stage === 'color' ? `hsl(${p.hue} 86% ${p.light}%)` : '#000';
  element.replaceChildren();
  if (stage === 'sound' || stage === 'arrange') {
    const n = document.createElement('span'); n.className = 'number';
    n.textContent = String(student.number).padStart(2, '0'); element.append(n);
  } else if (stage === 'line') {
    const line = document.createElement('i'); line.className = 'stroke';
    line.style.width = p.thickness + 'px'; element.append(line);
  }
}
