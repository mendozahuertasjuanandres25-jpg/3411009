# Sistema de gestión de inventario

Plantilla web para la gestión de inventario, desarrollada como proyecto formativo de **ADSO**. La propuesta incluye una interfaz de acceso y registro, y contempla módulos para organizar productos y usuarios.

> **Estado del proyecto:** prototipo estático en desarrollo. Las pantallas de inventario están previstas, pero todavía no están implementadas.

## Funcionalidades

### Disponibles en el prototipo

- Pantalla de inicio de sesión.
- Formulario de registro.
- Estilos propios con una paleta inspirada en los colores del SENA.

### Módulos previstos

- Panel principal.
- Gestión de usuarios.
- Gestión de categorías y subcategorías.
- Gestión de productos.

Las operaciones CRUD de estos módulos son parte del alcance previsto; aún no están disponibles en esta versión.

## Tecnologías

- **HTML5** para la estructura de las páginas.
- **CSS3** para los estilos y la identidad visual.
- Los estilos incluyen algunas variables compatibles con Bootstrap, pero el proyecto todavía no carga la biblioteca de Bootstrap.

## Requisitos

Solo necesitas un navegador web moderno. El proyecto no requiere instalación de dependencias ni un servidor para abrir las páginas estáticas.

## Cómo ejecutar

1. Descarga o clona este repositorio.
2. Abre la carpeta del proyecto.
3. Abre `html/login.html` en tu navegador.

También puedes abrir `html/registro.html` directamente para revisar el formulario de registro.

## Estructura del proyecto

```text
3411009/
├── css/
│   └── estilos.css
├── html/
│   ├── categorias.html
│   ├── dashboard.html
│   ├── login.html
│   ├── productos.html
│   ├── registro.html
│   ├── subcategorias.html
│   └── usuarios.html
├── img/
│   └── images.png
└── README.md
```

> Los archivos de `dashboard`, `productos`, `categorias`, `subcategorias` y `usuarios` están creados como estructura inicial, pero actualmente están vacíos.

## Alcance y limitaciones

- Es una maqueta de interfaz; no cuenta con servidor, base de datos ni almacenamiento de información.
- El inicio de sesión y el registro no autentican ni crean cuentas reales.
- Los formularios no realizan operaciones persistentes. El destino del formulario de acceso es una pantalla de panel que todavía no está implementada.

## Próximos pasos

1. Completar el panel principal y la navegación entre módulos.
2. Diseñar las vistas de productos, categorías, subcategorías y usuarios.
3. Implementar operaciones CRUD y validaciones.
4. Conectar la aplicación con un servicio de autenticación y una base de datos.
5. Incorporar pruebas de navegación y formularios.
