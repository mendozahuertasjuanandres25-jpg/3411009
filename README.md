# Sistema de gestión de inventario

Plantilla web para la gestión de inventario, desarrollada como proyecto formativo de **ADSO**. La propuesta incluye una interfaz de acceso y registro, y contempla módulos para organizar productos y usuarios.

> **Estado del proyecto:** prototipo estático en desarrollo. El dashboard presenta la estructura visual y estados vacíos; no hay servidor, base de datos ni fuente de datos conectada.

## Funcionalidades

### Disponibles en el prototipo

- Pantalla de inicio de sesión.
- Formulario de registro con carga opcional de foto de perfil.
- Panel que muestra el nombre, correo y foto del usuario de la sesión de demostración.
- Edición del nombre y la foto desde la página «Mi perfil».
- Catálogo de productos de prueba con compras ficticias e historial por perfil.
- Panel principal responsive con tarjetas, gráficas, actividad reciente y tabla en estado vacío cuando no hay datos.
- Footer responsive del dashboard con navegación, versión y estado desconectado mientras no exista una fuente de datos.
- Menú horizontal y footer con navegación en las páginas de inicio de sesión y registro.
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
Para que la sesión y los perfiles se compartan entre páginas, es recomendable abrir el proyecto desde el servidor local de Ruby descrito abajo.

## Cómo ejecutar

1. Descarga o clona este repositorio.
2. Abre la carpeta del proyecto.
3. Abre `html/login.html` en tu navegador.

También puedes abrir `html/registro.html` directamente para revisar el formulario de registro.
Abre `html/dashboard.html` para probar el menú hamburguesa del panel.

### Servir la página localmente con Ruby (opcional)

Si tienes Ruby instalado, puedes iniciar un servidor web estático desde la carpeta raíz del proyecto:

```bash
ruby -run -e httpd . -p 8000
```

Luego abre `http://localhost:8000/html/login.html` en tu navegador. Para detener el servidor, presiona `Ctrl+C` en la terminal.

En Ruby 3 o superior, si el comando indica que falta `webrick`, instala la gema una sola vez y vuelve a iniciar el servidor:

```bash
gem install webrick
```

Este servidor solo entrega los archivos estáticos; no agrega funcionalidades de backend, autenticación ni almacenamiento de datos.

## Estructura del proyecto

```text
3411009/
├── css/
│   ├── dashboard.css
│   ├── auth-navigation.css
│   ├── footer.css
│   ├── estilos.css
│   ├── login.css
│   ├── menu.css
│   ├── perfil.css
│   ├── productos-demo.css
│   └── registro.css
├── html/
│   ├── categorias.html
│   ├── dashboard.html
│   ├── login.html
│   ├── productos.html
│   ├── perfil.html
│   ├── registro.html
│   ├── subcategorias.html
│   └── usuarios.html
├── js/
│   ├── dashboard.js
│   ├── demo-store.js
│   ├── login.js
│   ├── menu.js
│   ├── perfil.js
│   ├── productos-demo.js
│   └── registro.js
├── img/
│   ├── apple.svg
│   ├── gestion-inventario.svg
│   ├── google.svg
│   ├── images.png
│   └── microsoft.svg
└── README.md
```

> Las páginas de categorías, subcategorías y usuarios siguen como estructura inicial. El catálogo de productos contiene datos ficticios únicamente para probar el historial de compras.

## Alcance y limitaciones

- Es una maqueta de interfaz; no cuenta con backend ni base de datos. El inicio de sesión es demostrativo: no verifica contraseñas y no autentica la identidad.
- Los perfiles, fotos, sesión y compras de prueba se guardan en el almacenamiento local del navegador; no se comparten entre dispositivos ni usuarios del navegador.
- El catálogo y las compras son ficticios: no se realizan pagos ni se modifica el inventario.
- El dashboard no consulta MySQL: muestra guiones y estados vacíos, sin inventar estadísticas.
- OAuth y recuperación de contraseña están pendientes de configurar.
- Las páginas de categorías, subcategorías y usuarios aún no tienen contenido funcional. La opción «Registros» lleva a la actividad reciente del dashboard porque no existe una página independiente de registros.

## Próximos pasos

1. Completar la navegación entre módulos.
2. Diseñar las vistas de categorías, subcategorías y usuarios.
3. Implementar operaciones CRUD y validaciones.
4. Conectar la aplicación con un servicio de autenticación y una base de datos.
5. Incorporar pruebas de navegación y formularios.
