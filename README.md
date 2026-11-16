# Sistema de gestión de inventario

Plantilla web para la gestión de inventario, desarrollada como proyecto formativo de **ADSO**. La propuesta incluye una interfaz de acceso y registro, y contempla módulos para organizar productos y usuarios.

> **Estado del proyecto:** prototipo estático en desarrollo. El dashboard presenta la estructura visual y estados vacíos; no hay servidor, base de datos ni fuente de datos conectada.

## Funcionalidades

### Disponibles en el prototipo

- Pantalla de inicio de sesión.
- Formulario de registro.
- Panel principal responsive con tarjetas, gráficas, actividad reciente y tabla en estado vacío cuando no hay datos.
- Footer responsive del dashboard con navegación, versión y estado desconectado mientras no exista una fuente de datos.
- Menú lateral fijo en escritorio y hamburguesa en móviles; se cierra con clic fuera, Escape o al elegir una sección.
- Fecha actual, búsqueda local de productos y panel de notificaciones sin datos.
- Estilos propios con una paleta inspirada en los colores del SENA.

### Módulos previstos

- Panel principal.
- Gestión de usuarios.
- Gestión de categorías y subcategorías.
- Gestión de productos.

Las operaciones CRUD de estos módulos son parte del alcance previsto; aún no están disponibles en esta versión.

## Tecnologías

- **HTML5** para la estructura de las páginas.
- **CSS3** en hojas separadas por página y componentes.
- **JavaScript** para navegación, fecha, búsqueda, notificaciones e interacciones del prototipo.

## Requisitos

Solo necesitas un navegador web moderno. El proyecto no requiere instalación de dependencias ni un servidor para abrir las páginas estáticas.

## Cómo ejecutar

1. Descarga o clona este repositorio.
2. Abre la carpeta del proyecto.
3. Abre `html/login.html` en tu navegador.

También puedes abrir `html/registro.html` directamente para revisar el formulario de registro.
Abre `html/dashboard.html` para probar el menú hamburguesa del panel.

## Estructura del proyecto

```text
3411009/
├── css/
│   ├── dashboard.css
│   ├── footer.css
│   ├── estilos.css
│   ├── login.css
│   ├── menu.css
│   └── registro.css
├── html/
│   ├── categorias.html
│   ├── dashboard.html
│   ├── login.html
│   ├── productos.html
│   ├── registro.html
│   ├── subcategorias.html
│   └── usuarios.html
├── js/
│   ├── dashboard.js
│   ├── login.js
│   ├── menu.js
│   └── registro.js
├── img/
│   ├── apple.svg
│   ├── gestion-inventario.svg
│   ├── google.svg
│   ├── images.png
│   └── microsoft.svg
└── README.md
```

> Los archivos de `productos`, `categorias`, `subcategorias` y `usuarios` están creados como estructura inicial, pero actualmente están vacíos.

## Alcance y limitaciones

- Es una maqueta de interfaz; no cuenta con servidor, base de datos ni almacenamiento de información.
- El inicio de sesión sólo valida los campos en el navegador y redirige al panel de demostración; no autentica la identidad. El registro no crea cuentas reales.
- El dashboard no consulta MySQL: muestra guiones y estados vacíos, sin inventar estadísticas.
- OAuth y recuperación de contraseña están pendientes de configurar.
- Las páginas de productos, categorías, subcategorías y usuarios aún no tienen contenido funcional. La opción «Registros» lleva a la actividad reciente del dashboard porque no existe una página independiente de registros.

## Próximos pasos

1. Completar el panel principal y la navegación entre módulos.
2. Diseñar las vistas de productos, categorías, subcategorías y usuarios.
3. Implementar operaciones CRUD y validaciones.
4. Conectar la aplicación con un servicio de autenticación y una base de datos.
5. Incorporar pruebas de navegación y formularios.
