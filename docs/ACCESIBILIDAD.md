# Accesibilidad y consistencia de interfaz — Avenir

Documento para la materia (Interfaz de Usuario): qué hicimos para que Avenir sea usable por personas con baja visión, ceguera, dislexia, daltonismo, temblor o poca precisión motriz y sensibilidad al movimiento, y qué haríamos después.

## 1. Qué se midió
Se corrió **axe-core** (reglas WCAG 2.1 A/AA y buenas prácticas) sobre las 22 pantallas internas del panel y las 6 públicas (landing, ingreso, registro, demo, juego, ranking), con la demo local y datos ficticios.

| Problema (WCAG) | Antes | Después |
|---|---|---|
| Contraste insuficiente (1.4.3) | 309 elementos | 0 |
| Botones de solo ícono sin nombre (4.1.2) | 80 | 0 |
| Listas desplegables sin nombre (4.1.2) | 47 | 0 |
| Campos de texto sin etiqueta (1.3.1 / 3.3.2) | 30 | 0 |
| Sin encabezado principal / sin zona "main" (2.4.1, 1.3.1) | 10 pantallas | 0 |
| Pendientes menores | — | orden de encabezados en 1 pantalla y el enlace de atribución del mapa (Leaflet) |

Los 10 escenarios de aceptación (Cucumber/Gherkin) siguen pasando con los cambios (10/10, 51 pasos).

## 2. Qué se hizo
**Para todas las personas (siempre activo)**
- Enlace "Saltar al contenido" (primer Tab) y zona `main` con foco: quien navega con teclado no recorre el menú en cada pantalla.
- Foco visible en todo lo que se puede tocar (anillo amarillo + borde oscuro, que se ve sobre fondos claros y oscuros). Antes los estilos en línea lo apagaban.
- Contraste mínimo 4,5:1 en textos y botones (verdes, grises y etiquetas del calendario ajustados).
- Objetivos táctiles de 44 px en pantallas táctiles y letra de 16 px en los campos del celular (evita el zoom automático de iOS).
- Se respeta `prefers-reduced-motion` (si el sistema pide menos movimiento, se apagan las animaciones).
- Etiquetas asociadas a sus campos (tocar "Fecha" enfoca el campo) y nombre accesible para botones de ícono ("Eliminar", "Editar", "Abrir el menú lateral"…).
- Cada pantalla se anuncia al cambiarla (región `aria-live`) y el menú se cierra solo en el celular.

**Panel "Accesibilidad" (botón azul abajo a la derecha, en todas las pantallas)**
- Tamaño del texto de 100 % a 175 %.
- Alto contraste.
- Letra y espaciado fáciles de leer (para dislexia y baja visión) y más espacio entre renglones.
- Foco y enlaces más marcados.
- Quitar animaciones.
- **Lectura en voz alta** de la pantalla (síntesis de voz del navegador) para quien ve poco o no ve.
- Todo se recuerda en el dispositivo y se puede restablecer. Se maneja con teclado (Tab y Esc).

**Consistencia visual**
- Todas las pantallas internas comparten un mismo contenedor (ancho máximo, márgenes, separación y marco de tarjeta con el mismo radio, borde y sombra); antes cada una se centraba y medía distinto.
- Un margen reservado a la derecha evita que los botones flotantes tapen botones o tablas.
- Las tablas que no entran se desplazan dentro de su tarjeta (antes se cortaba la columna "Acciones").

## 3. Qué haríamos después (propuesta)
1. **Prueba con personas reales** usuarias de lectores de pantalla (NVDA, TalkBack, VoiceOver) y con baja visión; hoy solo verificamos con herramientas automáticas, que detectan alrededor de un tercio de los problemas posibles.
2. **No depender solo del color**: los estados (Activo, Vencido, Por vencer) ya llevan texto; sumar íconos o patrones donde solo hay color (mapa, calendario) para daltonismo.
3. **Gráficos de Estadísticas**: agregar una tabla de datos alternativa y descripciones, para quien no puede ver el gráfico.
4. **Mapa**: alternativa en lista (ya existe el buscador de entidades) y atajos de teclado documentados.
5. **Formularios**: mensajes de error vinculados al campo (`aria-describedby`) y resumen de errores al enviar.
6. **Modo oscuro** con contraste verificado en cada pantalla y respeto de la preferencia del sistema.
7. **Subtítulos y descripciones** si se agregan videos; textos alternativos reales en las imágenes (hoy decorativas con `alt` vacío).
8. **Idioma y lenguaje claro**: mensajes cortos y sin jerga ("Falta completar el nombre" y no "Campo requerido").
9. **Pruebas automáticas de accesibilidad en cada cambio** (axe en la suite de Playwright), para que no vuelva a empeorar.

## 4. Límites honestos
- Verificado con axe-core y capturas en Chrome (PC 1366×768 y celular 390 px). **No** probado con lectores de pantalla reales ni en un celular físico.
- "Alto contraste" es un filtro visual (no un tema nuevo); el modo oscuro ya existente es independiente.
- El zoom de texto agranda el contenido de las pantallas; el menú lateral mantiene su tamaño.
- Algunos nombres accesibles se completan automáticamente al abrir la pantalla (por ejemplo los de botones de ícono); el criterio es mejorar los componentes de a poco.
