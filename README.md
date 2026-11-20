# Sistema de gestión de inventario

Plantilla web para la gestión de inventario, desarrollada como proyecto formativo de **ADSO**. La propuesta incluye una interfaz de acceso y registro, y contempla módulos para organizar productos y usuarios.

> **Estado del proyecto:** frontend estático servido por un backend Ruby/Sinatra. Registro, inicio de sesión, sesiones, perfiles y compras de demostración usan MySQL. Las métricas del inventario siguen sin conectarse a una fuente de datos.

## Funcionalidades

### Disponibles en el prototipo

- Registro con validación de correo único, contraseña confirmada y foto de perfil opcional.
- Inicio de sesión que valida la contraseña almacenada con BCrypt; el correo y la contraseña incorrectos producen un error claro.
- Confirmación al crear la cuenta con nombre, foto y correo prellenado en el login.
- Sesiones revocables guardadas en MySQL y cookie `HttpOnly`, `SameSite=Strict`; las páginas privadas se controlan desde el servidor.
- Dashboard personalizado con nombre y foto; el perfil permite actualizar estos datos.
- Catálogo de productos de prueba con compras ficticias e historial separado por usuario.
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
- **JavaScript** para validación de formularios e interacción con la API.
- **Ruby con Sinatra** para rutas, API, sesiones y protección de páginas.
- **MySQL** para usuarios, sesiones y compras de demostración; **BCrypt** para hashes de contraseña.

## Requisitos

Ruby 3.2 o superior, Bundler, MySQL 8 o superior y un navegador moderno. El sitio debe abrirse a través del backend; abrir los archivos HTML directamente no ejecuta la autenticación.

## Cómo ejecutar

1. Crea la base de datos y las tablas ejecutando [`db/schema.sql`](./db/schema.sql) desde MySQL Workbench o el cliente MySQL.
2. Crea un usuario MySQL dedicado y concédele `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre `inventario_sena.*`. No uses la cuenta `root` para la aplicación.
3. Desde PowerShell, en la carpeta raíz, configura las variables del proceso:

```bash
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_NAME = "inventario_sena"
$env:DB_USER = "inventario_app"
$env:DB_PASSWORD = Read-Host "Contraseña MySQL de inventario_app"
$env:SESSION_SECRET = ruby -rsecurerandom -e "print SecureRandom.hex(64)"
```

4. Instala las dependencias y arranca Sinatra:

```bash
bundle install
bundle exec rackup -o 127.0.0.1 -p 4567
```

5. Abre `http://127.0.0.1:4567/`. No publiques `DB_PASSWORD` ni `SESSION_SECRET` en Git. En producción, sirve el sitio exclusivamente sobre HTTPS para habilitar la cookie segura.

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
│   ├── auth-client.js
│   ├── dashboard.js
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
├── db/
│   └── schema.sql
├── app.rb
├── config.ru
├── Gemfile
└── README.md
```

> Las páginas de categorías, subcategorías y usuarios siguen como estructura inicial. El catálogo de productos contiene datos ficticios únicamente para probar el historial de compras.

## Alcance y limitaciones

- La autenticación y los datos de cuenta usan el servidor Ruby/MySQL; las compras del catálogo siguen siendo ficticias y no realizan pagos ni modifican existencias.
- Las fotos se guardan en `storage/profile_photos`, fuera de las rutas públicas, y se entregan solo a la sesión autenticada.
- La aplicación no incluye todavía verificación de correo, recuperación de contraseña ni limitación de intentos de inicio de sesión; no la expongas directamente a Internet sin controles adicionales.
- El dashboard no consulta MySQL: muestra guiones y estados vacíos, sin inventar estadísticas.
- OAuth y recuperación de contraseña están pendientes de configurar.
- Las páginas de categorías, subcategorías y usuarios aún no tienen contenido funcional. La opción «Registros» lleva a la actividad reciente del dashboard porque no existe una página independiente de registros.

## Próximos pasos

1. Conectar las métricas del dashboard y el CRUD de inventario a MySQL.
2. Diseñar las vistas de categorías, subcategorías y usuarios.
3. Incorporar verificación de correo, recuperación de contraseña y limitación de intentos.
4. Añadir pruebas de integración con una instancia de MySQL.
