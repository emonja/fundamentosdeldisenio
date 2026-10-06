// Roster transcribed from the supplied class image, in its original order.
export const roster = [
  ['A01648271', 'Acosta Salgado, Pedro Rodrigo'],
  ['A01403152', 'Anaya Guerrero, Emilio'],
  ['A01711625', 'Bueno Morelos, Fátima'],
  ['A01644360', 'Castellanos Ramírez, Luisa Fernanda'],
  ['A01646889', 'del Toro Ortega, Brenda Elizabeth'],
  ['A01645810', 'Díaz De la Vega, Juan Ignacio'],
  ['A01645372', 'Fregoso Núñez, Natalia'],
  ['A01985482', 'Garcia Rivera, Maximiliano'],
  ['A01644420', 'Gutiérrez Carrasco, Santiago'],
  ['A01644374', 'Gutiérrez Vega, Karol Amelie'],
  ['A01645892', 'Ibarra Ruesga, Luciana'],
  ['A01985487', 'Isidro Aragón, Regina'],
  ['A01645308', 'Lares Del Toro, Sofía'],
  ['A01644524', 'León Peraza, Alejandro'],
  ['A01645616', 'Lomelí Arana, Avril Paola'],
  ['A01644842', 'López Alcaraz, Aranza'],
  ['A01645955', 'López Robles, Karen Alejandra'],
  ['A01644226', 'Mariscal Méndez, Alan Maximilian'],
  ['A01644241', 'Mercado Romo, Romina Berenice'],
  ['A01644333', 'Mier Castellanos, Diana Guadalupe'],
  ['A01649783', 'Navarro Carrillo, Sofía'],
  ['A01985470', 'Pulido Rodríguez, Sofía'],
  ['A01649796', 'Ramírez Pérez, Ángela Sofía'],
  ['A01643167', 'Romero Rosales, Andrea Isabella'],
  ['A01647294', 'Singh, Avantika'],
].map(([id, name], i) => ({id, name, number: i + 1, firstName: name.split(', ')[1].split(' ')[0]}));
export const testSubject = {id: 'Test', name: 'Test', firstName: 'Test', number: 33, test: true};
export const stages = ['preparation', 'sound', 'arrange', 'color', 'line', 'end'];
export const labels = ['Preparación', 'Multitud · sonido', 'Orden · 6 × 4', 'Color', 'Línea', 'Fin · silencio'];
// Four marks, in the order of the original sketch: neutral, sad, tense, good.
export const emotions = [
  {label: 'Rostro sereno', light: 42, mouth: 'M31 66 Q50 77 69 65'},
  {label: 'Rostro triste', light: 25, mouth: 'M33 72 Q50 59 68 72'},
  {label: 'Rostro tenso', light: 12, mouth: 'M30 72 L39 66 L48 73 L57 66 L70 73'},
  {label: 'Rostro alegre', light: 68, mouth: 'M30 66 L48 77 L70 64'},
];
export function lookup(value) {
  const id = value.trim();
  return id === 'Test' ? testSubject : roster.find(s => s.id === id.toUpperCase());
}
export function hash(id) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function properties(student, emotion) {
  const h = hash(student.id);
  const rank = [...roster, testSubject].sort((a,b) => hash(a.id)-hash(b.id)).findIndex(s => s.id === student.id);
  return {frequency: 170 + (h % 19000) / 100,
    hue: 195 + (h % 1601) / 100, light: emotions[emotion]?.light ?? 0,
    thickness: 2 + rank * 1.2};
}
export function validEmotion(value) {return Number.isInteger(value) && value >= 0 && value < emotions.length;}
export function classMembers(excludedId) {return roster.filter(s => s.id !== excludedId);}
export function classData(records, excludedId) {
  return classMembers(excludedId).filter(s => validEmotion(records?.[s.id]?.emotion))
    .map(s => ({...s, emotion: records[s.id].emotion}));
}
export function lockChoice(current, emotion) {
  if (!validEmotion(emotion)) throw new Error('Elige un rostro.');
  return current === null ? {emotion} : undefined;
}
