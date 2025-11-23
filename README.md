# 🎮 Arcade Clásico

Un arcade de juegos clásicos retro construido con HTML5, CSS3 y JavaScript puro. Colección de 9 juegos nostálgicos con diseño moderno y efectos visuales vibrantes.

![Arcade Clásico](https://img.shields.io/badge/Juegos-9-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## 🌟 Características

- 🎨 **Diseño Moderno**: Interfaz con gradientes vibrantes, glassmorphism y animaciones suaves
- 🎯 **9 Juegos Clásicos**: Desde puzzles hasta shooters y plataformas
- 📱 **Responsive**: Adaptable a diferentes tamaños de pantalla
- 💾 **LocalStorage**: Guarda tu progreso y puntuaciones más altas
- 🎵 **Sin Dependencias**: JavaScript vanilla, sin frameworks
- ⚡ **Rendimiento Optimizado**: Game loops eficientes con requestAnimationFrame

## 🎮 Juegos Incluidos

### 1. **Tetris**
Rota y alinea las piezas para completar líneas.
- **Dificultad**: Fácil - Medio
- **Controles**: Flechas, Espacio para rotar
- **Características**: Sistema de niveles, preview de siguiente pieza

### 2. **Snake**
Controla la serpiente, come la comida y crece sin chocarte.
- **Dificultad**: Medio
- **Controles**: Flechas direccionales
- **Características**: Aumento progresivo de velocidad

### 3. **Memoria**
Encuentra las parejas de cartas usando tu memoria.
- **Dificultad**: Fácil
- **Controles**: Click/Tap
- **Características**: Contador de movimientos, temporizador

### 4. **Pong**
El clásico juego de ping-pong contra la CPU.
- **Dificultad**: Medio - Difícil
- **Controles**: W/S o Flechas
- **Características**: IA ajustable, efectos de sonido visuales, **3 pelotas simultáneas en modo difícil**

### 5. **Breakout**
Rompe todos los bloques con la pelota.
- **Dificultad**: Medio - Difícil
- **Controles**: Mouse o Flechas
- **Características**: Power-ups, múltiples niveles

### 6. **Space Invaders**
Defiende la Tierra de la invasión alienígena.
- **Dificultad**: Medio - Difícil
- **Controles**: Flechas, Espacio para disparar
- **Características**: Oleadas progresivas, escudos destructibles

### 7. **Racing**
Carreras multijugador en split-screen.
- **Dificultad**: Medio
- **Controles**: Jugador 1 (W/A/S/D), Jugador 2 (Flechas)
- **Características**: 2 jugadores, pista con obstáculos

### 8. **Meteor Dodge**
Esquiva meteoros en el espacio - extremadamente difícil.
- **Dificultad**: MUY DIFÍCIL
- **Controles**: Mouse o Flechas
- **Características**: Dificultad progresiva, doble control

### 9. **Platform Runner** ⭐
Juego de plataformas con física realista.
- **Dificultad**: Medio - Difícil
- **Controles**: WASD o Flechas, Espacio para saltar (doble salto), S o ↓ para caída rápida
- **Características**: 3 niveles, enemigos inteligentes, plataformas móviles, mecánica de caída rápida

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/classicgames-test.git

# Navegar al directorio
cd classicgames-test

# Abrir en el navegador
# Opción 1: Doble click en index.html
# Opción 2: Usar un servidor local
python -m http.server 8000
# Luego abrir http://localhost:8000
```

### Estructura del Proyecto

```
classicgames-test/
├── index.html              # Página principal
├── css/
│   └── home.css           # Estilos de la página principal
├── tetris/
│   ├── tetris.html
│   ├── css/tetris.css
│   └── js/tetris.js
├── snake/
│   ├── snake.html
│   ├── css/snake.css
│   └── js/snake.js
├── memoria/
│   ├── memoria.html
│   ├── css/memoria.css
│   └── js/memoria.js
├── pong/
│   ├── pong.html
│   ├── css/pong.css
│   └── js/pong.js
├── breakout/
│   ├── breakout.html
│   ├── css/breakout.css
│   └── js/breakout.js
├── space-invaders/
│   ├── space-invaders.html
│   ├── css/space-invaders.css
│   └── js/space-invaders.js
├── racing/
│   ├── racing.html
│   ├── css/racing.css
│   └── js/racing.js
├── meteor-dodge/
│   ├── meteor-dodge.html
│   ├── css/meteor-dodge.css
│   └── js/meteor-dodge.js
├── platform-runner/
│   ├── platform-runner.html
│   ├── css/platform-runner.css
│   └── js/platform-runner.js
└── README.md
```

## 💻 Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y Canvas API
- **CSS3**: 
  - Flexbox y Grid para layouts
  - Gradientes y animaciones CSS
  - Glassmorphism y efectos visuales
  - Responsive design
- **JavaScript ES6+**:
  - Clases y módulos
  - Arrow functions
  - Async/await
  - Canvas 2D API
  - LocalStorage API
  - RequestAnimationFrame para game loops

### Fuentes
- **Google Fonts**: Orbitron (títulos), Roboto (texto)

### Herramientas de Desarrollo
- Git para control de versiones
- Navegador moderno con DevTools

## 🎯 Características Técnicas

### Sistema de Física (Platform Runner)
- Gravedad y saltos realistas
- Detección de colisiones AABB
- Plataformas móviles con sincronización
- IA de enemigos con detección de bordes

### Optimizaciones
- Game loop optimizado con `requestAnimationFrame`
- Cancelación de loops para prevenir múltiples instancias
- Lazy rendering (solo dibuja cuando es necesario)
- Event delegation para mejor rendimiento

### Persistencia
- Puntuaciones más altas guardadas en LocalStorage
- Progreso del juego persistente

## 🎨 Diseño

### Paleta de Colores
- **Primarios**: 
  - `#FF006E` (Rosa neón)
  - `#FFBE0B` (Amarillo dorado)
  - `#06FFA5` (Verde neón)
  - `#3A86FF` (Azul vibrante)
  - `#8338EC` (Púrpura)

### Efectos Visuales
- Fondos con estrellas animadas
- Gradientes dinámicos
- Efectos de brillo (glow)
- Animaciones de hover
- Transiciones suaves

## 📱 Compatibilidad

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 🤝 Contribuir

Las contribuciones son bienvenidas! Si quieres agregar un nuevo juego o mejorar uno existente:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevoJuego`)
3. Commit tus cambios (`git commit -m 'Agregar nuevo juego: NuevoJuego'`)
4. Push a la rama (`git push origin feature/NuevoJuego`)
5. Abre un Pull Request

### Guías para Contribuir

- Mantén la estructura de directorios consistente
- Usa la paleta de colores del proyecto
- Asegúrate de que el juego sea responsive
- Incluye controles de teclado y/o mouse
- Guarda puntuaciones en localStorage
- Documenta el código

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

**Vasco**

- GitHub: [@vasco-giusep-dev](https://github.com/vasco-giusep-dev)

## 🙏 Agradecimientos

- Inspirado en los clásicos juegos de arcade de los 80s y 90s
- Google Fonts por las tipografías
- Comunidad de desarrolladores web

## 🔮 Próximamente

- 🎮 Más juegos clásicos
- 🏆 Sistema de logros
- 👥 Multiplayer online
- 🎵 Efectos de sonido
- 📊 Estadísticas globales

---

⭐ Si te gusta este proyecto, no olvides darle una estrella!

**Hecho con ❤️ para los amantes de los juegos clásicos**
