import('./classroom.mjs').catch(error => {
  console.error(error);
  const app = document.querySelector('#app');
  app.className = 'student-screen';
  app.innerHTML = '<p class="eyebrow">Fundamentos del Diseño · Color</p><h1>No se pudo conectar.</h1><p>Revisa la conexión y vuelve a cargar la página.</p>';
});
