# Instrumento · Fundamentos del Diseño

## Entradas

- Estudiantes: `/instrumento/`
- Maestro, en el teléfono: `/instrumento/control.html`
- Proyector: `/instrumento/projection.html`

Comparte solamente la entrada de estudiantes con la clase. El master usa la misma convención de confianza que `/presentacion/control.html`: el proyecto existente no implementa autenticación del maestro. La separación de vistas impide controles de etapa en la interfaz de estudiantes, pero no constituye autorización del servidor.

## Antes de clase

1. Abre el master. La imagen proporcionada tiene **25 nombres**, no 24. Selecciona explícitamente la matrícula que no participa; no se ha eliminado ni inventado ninguna identidad. La selección abre una sesión de 24 miembros en preparación. Los números conservan el orden original de la lista, incluso si la exclusión deja un salto.
2. Abre la proyección en otro dispositivo. Los 24 lugares siguen el orden de la lista, de izquierda a derecha, en seis columnas y cuatro filas.
3. Cada alumno ingresa su matrícula y toca un rostro. La primera respuesta se conserva en una transacción de RTDB; repetir el acceso, reconectar o abrir otro cliente con la misma matrícula recupera esa respuesta. Una clase nueva abre otro identificador de sesión y conserva los datos anteriores.
4. En preparación no hay sonido. Las instrucciones piden quitar silencio, subir volumen, quitar bloqueo automático y subir brillo. El navegador solicita mantener la pantalla despierta cuando lo admite; no puede cambiar ajustes del teléfono.
5. Avanza: **Multitud / sonido → Orden / 6 × 4 → Color → Línea → Fin / silencio**. El oscilador continúa sin cambiar tono entre las cuatro etapas activas. «Detener sonido» termina la sesión desde cualquier etapa.

Prueba audio en un iPhone y un Android antes de reunir los teléfonos. El primer toque prepara Web Audio en silencio. Al recargar, el navegador necesita otro gesto: se muestra únicamente el rostro guardado, sin permitir cambiarlo. Mantén la página visible; el sistema operativo puede suspender audio cuando bloquea o abandona la página. Si se pierde conexión, el cliente silencia su voz y recupera la etapa al reconectar.

## Test / 33

La matrícula exacta es `Test` (distingue mayúsculas). No está en la lista real. Su respuesta se guarda solamente en el teléfono, por sesión; nunca escribe respuestas ni presencia en RTDB. Recibe las mismas etapas, tono determinista, color y línea. No forma parte de la matriz, los conteos, la lista ni ningún agregado.

## Representaciones

- Tono senoidal individual: matrícula → hash FNV-1a → 170–360 Hz, sin dependencia de la emoción.
- Color: matiz de 195–211°, saturación 86%. Los rostros originales se ordenan sereno, triste, tenso, alegre: luminosidad HSL fija de 42%, 25%, 12%, 68%. Es luminosidad de color, independiente del ajuste físico de brillo del teléfono.
- Línea vertical: 72% de la altura; grosor de 2–32 px, distinto y estable por identidad. Negro y blanco, sin animación.

## Arquitectura y comprobación

Reutiliza `/presentacion/js/firebase.js`, Firebase SDK 12.3.0 y `fundamentos501-default-rtdb`. No modifica la presentación existente. Nuevos datos:

```
instrument/state: { session, stage, excludedId }
instrument/sessions/{session}/answers/{matricula}: { emotion }
instrument/sessions/{session}/presence/{matricula}/{clientId}: true
```

Las respuestas y las etapas usan transacciones. Presencia instala `onDisconnect` antes de registrarse y se repone al reconectar; los conteos de conectados agrupan por matrícula. La respuesta permanece aunque un teléfono se desconecte. Las transacciones bloquean cambios desde estos clientes; las reglas de seguridad actuales no están versionadas en este repositorio y deben revisarse para exigir inmutabilidad y autorización frente a escrituras externas. No se han reemplazado reglas existentes ni modificado datos de la presentación.

Ensayo local, sin Firebase ni escrituras de clase: agrega `?demo=1` a las tres entradas, en el mismo navegador/origen. Usa almacenamiento local, Web Locks y BroadcastChannel. Los datos de ensayo están separados de los datos reales y no se usan en las entradas de producción. Los conectados no se simulan en este modo.

Desde la raíz del repositorio:

```
python -m http.server 8767 --bind 127.0.0.1 --directory public
node --test tests/instrument-model.test.mjs tests/instrument-runtime.test.mjs
```

Para comprobar visualmente una clase completa sin datos reales, sirve la raíz del repositorio y abre `/tests/instrument-browser.html?demo=1`. El fixture puede abrir una sesión vacía y agregar 24 respuestas de ejemplo; las tres entradas enlazadas usan el adaptador de ensayo real. Las capturas de verificación usan estas respuestas de ejemplo, no respuestas de alumnos.

Firebase Hosting ya sirve `public/`. La publicación existente en GitHub despliega al recibir cambios en `main`; este trabajo no publica automáticamente. Se comprobaron la lectura pública de `instrument/state` y la conexión del navegador con el SDK de producción, sin errores de inicio. La cuenta local de Firebase CLI necesita renovar su sesión para revisar reglas o desplegar; no se ha validado una escritura de producción ni audio en hardware iOS/Android.
