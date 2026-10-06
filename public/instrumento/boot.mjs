const entry = document.body.dataset.view === 'student' ? './student.mjs' : './collective.mjs';
import(entry).catch(error => {
  console.error(error);
  const app = document.querySelector('#app');
  app.className = 'panel';
  app.innerHTML = '<p class="eyebrow">Fundamentos del Diseño</p><h1>No se pudo conectar.</h1><p>Revisa la conexión a internet y vuelve a abrir esta página.</p><button type="button">Reintentar</button>';
  app.querySelector('button').onclick = () => location.reload();
});
