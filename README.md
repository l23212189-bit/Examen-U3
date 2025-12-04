# Examen-U3
Construir un sistema web sencillo que permita gestionar el catálogo de instrumentos y registrar préstamos básicos. Debe incluir login, roles, CRUD de instrumentos, búsqueda en vivo y carga/descarga de datos en Excel.

---

## `schema.sql`
Como primer paso se creó la base de datos, las tablas a llenar con información específica y un nuevo el usuario con todos los permisos. De igual forma, se insertaron códigos de acceso para identificar al tipo de usuario y gestionar el acceso a ciertas funciones. 

```sql
CREATE DATABASE IF NOT EXISTS laboratorio CHARACTER SET utf8mb4;
USE laboratorio;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('ADMIN','ASISTENTE','AUDITOR') NOT NULL DEFAULT 'ASISTENTE'
);

CREATE TABLE IF NOT EXISTS instrumentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  estado ENUM('DISPONIBLE','PRESTADO','MANTENIMIENTO') DEFAULT 'DISPONIBLE',
  ubicacion VARCHAR(120) NOT NULL
);

CREATE USER IF NOT EXISTS 'lab_user'@'localhost' IDENTIFIED BY 'lab_pass';
GRANT ALL PRIVILEGES ON laboratorio.* TO 'lab_user'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS codigos_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    tipo_usuario ENUM('ADMIN','ASISTENTE','AUDITOR')
);

INSERT INTO codigos_usuarios (codigo, tipo_usuario) VALUES ('ADMIN123', 'ADMIN');
INSERT INTO codigos_usuarios (codigo, tipo_usuario) VALUES ('ASSIST456', 'ASISTENTE');
INSERT INTO codigos_usuarios (codigo, tipo_usuario) VALUES ('AUDIT789', 'AUDITOR');
```

---

## `.env`
En este archivo se completó la información con el usuario, la contraseña y la base de datos previamente creada del usuario raíz. De igual forma, se guardó el nombre con el cual se podrá ingresar a la página web.

```env
PORT=3000
DB_HOST=localhost
DB_USER=lab_user
DB_PASS=lab_pass
DB_NAME=laboratorio
```

---

## `index.html`
Representa la vista principal de la página web. El código contiene una breve descripción del propósito de la página, algunas funciones a realizar y contenido específico acerca de intrumentos biomédicos. 

```html
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/bootstrap/bootstrap.css">
  <link rel="stylesheet" href="styles.css">  
  
  <title>Instrumentos Biomedicos</title>
</head>

<body class="bg-light">
<div id="navbar"></div>
<div class="container mt-5">
  <div class="p-5 mb-4 bg-primary text-white rounded-3 shadow-sm">
  <h1 class="display-5 fw-bold">Bienvenido</h1>
  <p class="fs-4">Esta es una página donde encontraras equipos e instrumentos utilizados en la ingenieria biomédica</p>
</div>

<div class="row g-4">
  <div class="col-md-6">
    <div class="card shadow-sm h-100">
      <div class="card-body">
        <h2 class="card-title">Catalogo de instrumentacion biomedica</h2>
        <p class="card-text">Navega nuestro catalogo de equipos biomedicos</p>
        <button onclick="window.location.href='/instrumentos.html'" class="btn btn-primary" >CATALOGO</button>
      </div>
    </div>
  </div>

  <div class="col-md-6">
    <div class="card shadow-sm h-100">
      <div class="card-body">
        <h2 class="card-title">Busqueda de equipos</h2>
        <p class="card-text">Busca instrumentos especificos del catalogo a traves de nuestro navegador</p>>
        <button onclick="window.location.href='/busqueda.html'" class="btn btn-secondary">BUSCAR</button>
      </div>
    </div>
  </div>
</div>
</div> <script src="bootstrap/bootstrap.bundle.min.js"></script>
<script src="navbar.html"></script>
<script>
    // Insertar el contenido de navbar.html en el elemento con id "navbar"
    fetch('/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar').innerHTML = data;
      
    fetch('/tipo-usuario')
        .then(response => response.json())
        .then(data => {
            const menu = document.getElementById('menu');
            const tipoUsuario = data.tipo_usuario;

            // Agregar opciones de menú según el tipo de usuario
            if (tipoUsuario === 'ADMIN') {
                menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/ver-usuarios">Ver Usuarios</a></li>';
                menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/gestionar-registros">Gestionar Registros</a></li>';
                menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/gestionar-instrumentos">Gestionar Instrumentos</a></li>';
            } else if (tipoUsuario === 'ASISTENTE') {
                menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/gestionar-instrumentos">Gestionar Instrumentos</a></li>';
            } 

            // Opción de cerrar sesión para todos los tipos de usuario
            menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/logout">Cerrar Sesión</a></li>';
        })
        .catch(error => console.error('Error obteniendo el tipo de usuario:', error));
      })
      .catch(error => console.error('Error cargando el navbar:', error));
  
 
    // Solicitar el tipo de usuario y ajustar el menú en función de este
   
  </script>

</body>
</html>
```

---

## `registro.html`
Este código tiene como objetivo guardar la información de registro de nuevos usuarios que quieran ingresar a la página web y hacer uso de sus funciones. Pide datos personales como nombre de usuario, contraseña, correo electrónico y código de acceso.

```html
<!DOCTYPE html>
<html lang="es">

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    
    <link rel="stylesheet" href="bootstrap/bootstrap.css">
    
    <link rel="stylesheet" href="styles.css">
    
    <title>Registro de Usuario</title>
</head>

<body class="bg-light">
    <div class="container d-flex justify-content-center align-items-center py-5">
        <div class="card p-4 shadow-lg" style="width: 100%; max-width: 450px;">
            <h2 class="card-title text-center mb-4">Registrar Usuario</h2>

            <form action="/registro" method="POST">
                
                <div class="mb-3">
                    <label for="username" class="form-label">Nombre de usuario:</label>
                    <input type="text" id="username" name="username" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label for="password" class="form-label">Contraseña:</label>
                    <input type="password" id="password" name="password" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label for="correo" class="form-label">Correo electrónico:</label>
                    <input type="email" id="correo" name="correo" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label for="codigos_usuarios" class="form-label">Código de acceso:</label>
                    <input type="text" id="codigos_usuarios" name="codigos_usuarios" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-success w-100 mt-3">REGISTRARSE</button>
            </form>

            <p class="text-center mt-3">
                ¿Ya tienes cuenta? <a href="/login.html">Inicia sesión</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## `login.html`
Este código es capaz de validar la información previamente ingresada al momento del registro simplemente con el nombre de usuario y la contraseña. De esta forma, el usuario puede entrar y salir de la página web en cualquier momento.

```html
<!DOCTYPE html>
<html lang="es">

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    
    <link rel="stylesheet" href="bootstrap/bootstrap.css">
    
    <link rel="stylesheet" href="styles.css">
    
    <title>Inicio de Sesión</title>
</head>

<body class="bg-light">
    <div class="container d-flex justify-content-center align-items-center vh-100">
        <div class="card p-4 shadow-lg" style="width: 100%; max-width: 400px;">
            <h2 class="card-title text-center mb-4">Iniciar Sesión</h2>
            
            <form action="/login" method="POST">
                
                <div class="mb-3">
                    <label for="nombre" class="form-label">Nombre de Usuario:</label>
                    <input type="text" id="nombre" name="nombre" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label for="password" class="form-label">Contraseña:</label>
                    <input type="password" id="password" name="password" class="form-control" required>
                </div>
                
                <button type="submit" class="btn btn-primary w-100 mt-3">INICIAR SESION</button>
            </form>

            <p class="text-center mt-3">
                ¿No tienes cuenta? <a href="/registro.html">Regístrate aquí</a>
            </p>
        </div>
    </div>
</body>
</html>
```

---

## `error-login.html`
Este código permite hacerle saber al usuario ciertas irregularidades al momento del inicio de sesión en caso de no encontrar la información necesaria, puede ser un error en el nombre de usuario o la contraseña ingresada. Le da oportunidad al usuario de corregir los datos para iniciar sesión correctamente.

```html
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="bootstrap/brite.min.css">
    
    <title>Error de inicio de sesión</title>
    
    <link rel="stylesheet" href="/styles.css">
    
</head>

<body class="bg-light d-flex justify-content-center align-items-center vh-100">

    <div class="container" style="max-width: 500px;">
        <div class="alert **alert-warning** text-center **shadow-lg** p-4" role="alert">
            
            <h1 class="alert-heading display-6">Error de inicio de sesión</h1>
            
            <p class="lead">Usuario no encontrado.</p>
            
            <hr> <a href="/login.html" class="btn btn-warning mt-2 fw-bold">Volver al inicio de sesión</a>
        </div>
    </div>

</body>
</html>
```

---

## `instrumentos.html`
Este código da oportunidad de gestionar los instrumentos biomédicos ingresados, esto con el propósito de mostrarle al usuario un conjunto de información ordenada y facilitar la búsqueda de materiales con características específicas. Contiene datos como el tipo de producto, el estado de disponibilidad y la ubicación en almacén. Además, permite cargar y descargar archivos de tipo Excel de la computadora hacia la página web, o viceversa.

```html
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="stylesheet" href="bootstrap/brite.min.css">
    
    <link rel="stylesheet" href="styles.css">
    <title>Lista de Instrumentos</title>
</head>

<body class="bg-light">
    <div id="navbar"></div>

    <div class="container mt-4">
        <h1 class="text-center mb-4">Gestión de Instrumentos Biomédicos</h1>

        <div class="row g-4">
            
            <div class="col-md-6">
                <div class="card shadow-sm p-4 h-100">
                    <h2 class="card-title text-center mb-3">Agregar instrumento al catálogo</h2>
                    
                    <form action="/submit-data" method="POST">
                        
                        <div class="mb-3">
                            <label for="name" class="form-label">Instrumento</label>
                            <input type="text" id="name" name="name" class="form-control">
                        </div>

                        <div class="mb-3">
                            <label for="category" class="form-label">Categoría</label>
                            <select name="category" required class="form-select">  
                                <option value="EQUIPOS MÉDICOS">EQUIPOS MÉDICOS</option>
                                <option value="PRÓTESIS">PRÓTESIS</option>
                                <option value="ORTESIS">ORTESIS</option>
                                <option value="DE DIAGNÓSTICO">DE DIAGNÓSTICO</option>
                                <option value="QUIRÚRGICOS">QUIRÚRGICOS</option>
                                <option value="DE CURACIÓN">DE CURACIÓN</option>
                                <option value="PRODUCTOS HIGIÉNICOS">PRODUCTOS HIGIÉNICOS</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label for="status" class="form-label">Estado</label>
                            <select name="status" required class="form-select">
                                <option value="DISPONIBLE">DISPONIBLE</option>
                                <option value="PRESTADO">PRESTADO</option>
                                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label for="location" class="form-label">Ubicacion</label>
                            <select name="location" required class="form-select">
                                <option value="Almacén 1">Almacén 1</option>
                                <option value="Almacén 2">Almacén 2</option>
                                <option value="Oficina 3">Oficina 3</option>
                                <option value="Oficina 4">Oficina 4</option>
                                <option value="Oficina 5">Oficina 5</option>
                                <option value="Área de Embalaje">Área de Embalaje</option>
                                <option value="Cubículo 10">Cubículo 10</option>
                                <option value="Cubículo 11">Cubículo 11</option>
                                <option value="Cubículo 12">Cubículo 12</option>
                            </select>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 mt-3">Guardar</button>
                    </form>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card shadow-sm p-4 h-100">
                    <h2 class="card-title text-center mb-4">Carga y Descarga Masiva</h2>
                    
                    <h3 class="fs-5 mt-3">Cargar Equipos desde Excel</h3>
                    <form action="/upload" method="POST" enctype="multipart/form-data" class="mb-4">
                        <div class="mb-3">
                            <input type="file" name="excelFile" accept=".xlsx" class="form-control" />
                        </div>
                        <button type="submit" class="btn btn-success w-100">Subir Archivo</button>
                    </form>

                    <h3 class="fs-5 mt-3">Descargar Base de Datos</h3>
                    <button onclick="window.location.href='/download'" class="btn btn-info w-100">Descargar Equipos</button>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-5 mb-5">
            <button onclick="window.location.href='/index.html'" class="btn btn-secondary btn-lg">Volver</button>
        </div>

    </div> <script src="bootstrap/bootstrap.bundle.min.js"></script>
    
    <script>
        fetch('/navbar.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('navbar').innerHTML = data;
                
                fetch('/tipo-usuario')
                    .then(response => response.json())
                    .then(data => {
                        const menu = document.getElementById('menu');
                        const tipoUsuario = data.tipo_usuario;

                        if (tipoUsuario === 'ADMIN') {
                            menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/ver-usuarios">Ver Usuarios</a></li>';
                            menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/gestionar-registros">Gestionar Registros</a></li>';
                            menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/gestionar-instrumentos">Gestionar Instrumentos</a></li>';
                        } else if (tipoUsuario === 'ASISTENTE') {
                            menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/gestionar-instrumentos">Gestionar Instrumentos</a></li>';
                        } 

                        // Opción de cerrar sesión para todos los tipos de usuario
                        menu.innerHTML += '<li class="nav-item"><a class="nav-link" href="/logout">Cerrar Sesión</a></li>';
                    })
                    .catch(error => console.error('Error obteniendo el tipo de usuario:', error));
            })
            .catch(error => console.error('Error cargando el navbar:', error));
    </script>
</body>
</html>
```

---

## `busqueda.html`
Este código permite que el usuario tenga la posibilidad de buscar instrumentos previamente ingresados en la base de datos, los cuales se presentan en una tabla ordenada con las especificaciones necesarias.

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <link rel="stylesheet" href="bootstrap/brite.min.css">
    
    <link rel="stylesheet" href="styles.css">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Busqueda de Instrumentos</title>

    <style>
        
        #resultsTable tbody tr:hover {
            background-color: var(--bs-table-hover-bg, #f5f5f5) !important; 
            cursor: pointer;
        }
    </style>
</head>

<body class="bg-light">
    <div class="container mt-5">
        
        <h1 class="text-center mb-4">Busqueda de Instrumentos</h1>

        <div class="row justify-content-center">
            <div class="col-md-8">
                <h2 class="text-center mb-3">Busca tu equipo</h2>
                
                <input type="text" id="searchInput" placeholder="Escribe para buscar..." class="form-control form-control-lg shadow-sm mb-4">
            </div>
        </div>

        <table id="resultsTable" class="table table-striped table-hover shadow-sm" style="display:none;">
            <thead class="table-dark"> <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Ubicación</th>
                </tr>
            </thead>
            <tbody id="resultsBody"></tbody>
        </table>

        <div class="text-center mt-4">
            <button onclick="window.location.href='/index.html'" class="btn btn-secondary btn-lg">Volver</button>
        </div>
        
    </div> <script>
    const searchInput = document.getElementById("searchInput");
    const resultsTable = document.getElementById("resultsTable");
    const resultsBody = document.getElementById("resultsBody");

    searchInput.addEventListener("input", async () => {
        const query = searchInput.value.trim();

        if (query.length === 0) {
            resultsTable.style.display = "none";
            resultsBody.innerHTML = "";
            return;
        }

        const response = await fetch(`/buscar-instrumentos?query=${query}`);
        const data = await response.json();

        resultsBody.innerHTML = "";

        if (data.length > 0) {
            resultsTable.style.display = "table";
        } else {
            resultsTable.style.display = "none";
        }

        data.forEach(item => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.nombre}</td>
                <td>${item.categoria}</td>
                <td>${item.estado}</td>
                <td>${item.ubicacion}</td>
            `;
            row.onclick = () => {
                window.location.href = `/instrumento/${item.id}`;
            };

            resultsBody.appendChild(row);
        });
    });
</script>

</body>
</html>
```

---

## `navbar.html`
Esta herramienta permite mostrar las funciones de la página web de manera más ordenada y hacer más accesible el acceso a las rutas.

```html
<nav class="navbar navbar-expand-lg **bg-dark** navbar-dark">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">Inicio</a>
    
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav **me-auto**" id="menu">
          </ul>
    </div>
  </div>
</nav>
```

---

## `styles.css`
En este apartado se le da forma a la página web, con el propósito de hacerla más llamativa y única para los usuarios. Se puede editar el tamaño y tipo de letra, el color del fondo, los títulos y los botones, y las características de la barra de navegación.

```css
body {
  font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
  background-color: #fffeee;
}

h1 {
  color: #000000;
  text-align: center;
}

h2 {
  color: rgb(0, 73, 104);
  text-align: center;
}

form {
  width: 250px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}


p {
  color: rgba(0, 119, 125, 0.692);
  text-align: center;
}

button {
  font-family: 'Courier New', Courier, monospace;  
  display: block;
  margin: 20px auto;
  padding: 10px;
  background-color: #fff200;
  color: rgb(0, 73, 104);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #ecb308;
}

label {
  display: block;
  margin: 10px 0 5px;
  font-weight: bold;
}

input {
  width: 95%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

table {
  width: 80%;
  margin: 20px auto;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: rgb(246, 232, 41);
  color: white;
}

tr:hover {
  background-color: #f5f5f5;
}

nav {
    background-color: #000d5f;
    color: white;
    padding: 10px;
}

nav ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    display: flex;
}

nav ul li {
    margin-right: 20px;
}

nav ul li a {
    color: white;
    text-decoration: none;
    padding: 5px 10px;
}

nav ul li a:hover {
    background-color: #01568f;
    border-radius: 4px;
}
```

---

## `bootstrap.css`
El bootstrap es un conjunto de herramientas que le da un diseño más moderno a las páginas web, sin necesidad de dar el estilo desde cero. En este código se hizo uso de esta herramienta y se conectó con las rutas previamente creadas. Se hizo uso del siguiente link: `https://bootswatch.com/`.

---

## `server.js`
Este archivo es la base de todos los códigos anteriores, busca poner en marcha la página web y conectar la información con la base de datos. El código contiene todas las rutas para el registro, el inicio de sesión, la autorización de roles, la gestión y edición de datos dependiendo del tipo de usuario, entre muchas otras funciones base de nuestra página.

```javascript
const express = require('express');
const app = express();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();
const upload = multer({ dest: 'uploads/' });
//timezone: 'America/Tijuana'

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de la sesión
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false,
}));

function requireLogin(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/login.html');
  }
  next();
}

//Autorización de Roles
function requireRole(roles) {
    return (req, res, next) => {
      const allowedRoles=Array.isArray(roles)?roles : [roles];
        if (req.session.user && allowedRoles.includes(req.session.user.tipo_usuario)) {
            next();
        } else {
            res.status(403).send('Acceso denegado');
        }
    }
};

//Configuración de la BD
const connection = mysql.createConnection({
  host: process.env.DB_HOST,       // Host desde .env
  user: process.env.DB_USER,       // Usuario desde .env
  password: process.env.DB_PASS,   // Contraseña desde .env
  database: process.env.DB_NAME    // Nombre de la base de datos desde .env
});

//Conectar a la BD
connection.connect(err => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
});



//Configuración del Servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});


//Ruta para la página principal después de iniciar sesión
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
  res.redirect('/index.html');
});


// Archivos HTML
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req,res)=>{
  res.sendFile(path.join(__dirname + '/public/login.html'));
});
app.get('/registro', (req,res)=>{
  res.sendFile(path.join(__dirname + '/public/registro.html'));
});

//Ruta para menú de navegación
app.get('/menu', (req, res) => {
  const menuItems = [
    { nombre: 'Inicio', url: '/index.html' },
    { nombre: 'Instrumentos', url: '/instrumentos.html' },
    { nombre: 'Usuarios', url: '/usuarios.html' },
    { nombre: 'Búsqueda', url: '/busqueda.html' }
  ];
  res.json(menuItems);
});

//Ruta para Búsqueda en el Servidor
app.get('/buscar', (req, res) => {
  const query = req.query.query;
  const sql = `SELECT nombre, correo FROM usuarios WHERE nombre LIKE ?`;
  connection.query(sql, [`%${query}%`], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Ruta para obtener el tipo de usuario actual
app.get('/tipo-usuario', requireLogin, (req, res) => {
    res.json({ tipo_usuario: req.session.user.tipo_usuario });
});

//Registro de usuarios
app.post('/registro', async (req, res) => {
  const { username, password, correo, codigos_usuarios } = req.body;
  console.log(req.body);

  const queryCodigo = 'SELECT tipo_usuario FROM codigos_usuarios WHERE codigo = ?';
  connection.query(queryCodigo, [codigos_usuarios], async (err, results) => {
    if (err) {
      console.error('Error al verificar código:', err);
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <title>Error</title>
        </head>
        <body class="container mt-5">
          <div class="alert alert-danger text-center">
            <h4 class="alert-heading">Error</h4>
            <p>Error al verificar el código de acceso.</p>
            <hr>
            <a href="/registro.html" class="btn btn-secondary">Intentar de nuevo</a>
          </div>
        </body>
        </html>
      `);
    }

    if (results.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <title>Código inválido</title>
        </head>
        <body class="container mt-5">
          <div class="alert alert-warning text-center">
            <h4 class="alert-heading">Código inválido</h4>
            <p>El código de acceso proporcionado no es válido.</p>
            <hr>
            <a href="/registro.html" class="btn btn-secondary">Intentar de nuevo</a>
          </div>
        </body>
        </html>
      `);
    }

    const tipo_usuario = results[0].tipo_usuario;

    try {
      const password_hash = await bcrypt.hash(password, 10);

      const queryInsert = `
        INSERT INTO usuarios (nombre, correo, password_hash, tipo_usuario)
        VALUES (?, ?, ?, ?)
      `;

      connection.query(queryInsert, [username, correo, password_hash, tipo_usuario], (err2) => {
        if (err2) {
          console.error('Error al registrar usuario:', err2);

          if (err2.code === 'ER_DUP_ENTRY') {
            return res.send(`
              <!DOCTYPE html>
              <html lang="es">
              <head>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="/bootstrap/bootstrap.css">
                <title>Correo duplicado</title>
              </head>
              <body class="container mt-5">
                <div class="alert alert-warning text-center">
                  <h4 class="alert-heading">Correo duplicado</h4>
                  <p>El correo ya está registrado en el sistema.</p>
                  <hr>
                  <a href="/registro.html" class="btn btn-secondary">Intentar de nuevo</a>
                </div>
              </body>
              </html>
            `);
          }

          return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <link rel="stylesheet" href="/bootstrap/bootstrap.css">
              <title>Error</title>
            </head>
            <body class="container mt-5">
              <div class="alert alert-danger text-center">
                <h4 class="alert-heading">Error</h4>
                <p>No se pudo registrar el usuario.</p>
                <hr>
                <a href="/registro.html" class="btn btn-secondary">Intentar de nuevo</a>
              </div>
            </body>
            </html>
          `);
        }

        console.log('Usuario registrado correctamente');

        res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registro exitoso</title>
            <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          </head>
          <body class="container mt-5">
            <div class="alert alert-success text-center">
              <h4 class="alert-heading">Registro exitoso</h4>
              <p>Usuario registrado como <strong>${tipo_usuario}</strong> correctamente.</p>
              <hr>
              <a href="/login.html" class="btn btn-primary">Ir al login</a>
            </div>
          </body>
          </html>
        `);
      });
    } catch (error) {
      console.error('Error encriptando contraseña:', error);
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <title>Error interno</title>
        </head>
        <body class="container mt-5">
          <div class="alert alert-danger text-center">
            <h4 class="alert-heading">Error interno</h4>
            <p>Ocurrió un error al encriptar la contraseña.</p>
            <hr>
            <a href="/registro.html" class="btn btn-secondary">Intentar de nuevo</a>
          </div>
        </body>
        </html>
      `);
    }
  });
});


//Inicio de sesión
app.post('/login', (req, res) => {
    const { nombre, password } = req.body; 
    console.log("Intento login:", nombre, password);

    const query = 'SELECT * FROM usuarios WHERE nombre = ?'; 
    
    connection.query(query, [nombre], (err, results) => {
        if (err) {
            console.error("Error DB:", err);
            return res.redirect('/error-login.html'); 
        }

        console.log("Resultados:", results);

        if (results.length === 0) {
            console.log("Usuario no encontrado");
            return res.redirect('/error-login.html'); 
        }

        const user = results[0];
        console.log("Password en BD:", user.password_hash);

        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
        console.log("¿Contraseña válida?:", isPasswordValid);

        if (!isPasswordValid) {
            console.log("Contraseña incorrecta");
            return res.redirect('/error-login.html'); 
        }

        console.log("✔ Login exitoso");

        req.session.user = {
            id: user.id,
            nombre: user.nombre, 
            tipo_usuario : user.tipo_usuario 
        };

        res.redirect('/'); 
    });
});

//Cierre de sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Ruta para mostrar los usuarios (admin)
app.get('/ver-usuarios', requireLogin, requireRole('ADMIN'), (req, res) => {
  connection.query('SELECT * FROM usuarios', (err, results) => {
    if (err) {
      return res.send('Error al obtener los datos.');
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Usuarios</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
      </head>
      <body class="container mt-4">
        <h1 class="mb-4">Usuarios Registrados</h1>

        <table class="table table-striped table-bordered align-middle">
          <thead class="table-dark">
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Tipo de usuario</th>
            </tr>
          </thead>
          <tbody>
    `;

    results.forEach(usuario => {
      html += `
        <tr>
          <td>${usuario.nombre}</td>
          <td>
            <span class="badge ${usuario.tipo_usuario === 'ADMIN' ? 'bg-primary' : usuario.tipo_usuario === 'ASISTENTE' ? 'bg-success' : 'bg-info'}">
              ${usuario.tipo_usuario}
            </span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <a href="/" class="btn btn-secondary mt-3">Volver</a>
      </body>
      </html>
    `;

    res.send(html);
  });
});



// Ruta gestion de datos (admin)
app.get('/gestionar-registros', requireLogin, requireRole('ADMIN'), (req, res) => {
  const query = 'SELECT id, nombre, tipo_usuario FROM usuarios';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.send('Error al cargar los usuarios.');
    }

    let html = `
      <html>
      <head>
        <!-- Bootswatch brite descargado local -->
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <title>Gestión de Usuarios</title>
      </head>
      <body class="container mt-4">
        <h1 class="mb-4">Gestión de Usuarios</h1>

        <table class="table table-striped table-bordered align-middle">
          <thead class="table-dark">
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Nombre</th>
              <th scope="col">Tipo de Usuario</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    results.forEach(usuario => {
      html += `
        <tr>
          <td>${usuario.id}</td>
          <td>${usuario.nombre}</td>
          <td>${usuario.tipo_usuario}</td>
          <td>
            <form action="/editar-usuario" method="POST" class="d-inline">
              <input type="hidden" name="id" value="${usuario.id}">
              <select name="nuevo_tipo" required class="form-select form-select-sm d-inline w-auto">
                <option value="ADMIN">Administrador</option>
                <option value="ASISTENTE">Asistente</option>
                <option value="AUDITOR">Auditor</option>
              </select>
              <button type="submit" class="btn btn-sm btn-warning ms-2">Editar</button>
            </form>
            <form action="/eliminar-usuario" method="POST" class="d-inline">
              <input type="hidden" name="id" value="${usuario.id}">
              <button type="submit" class="btn btn-sm btn-danger ms-2"
                onclick="return confirm('¿Eliminar este usuario?')">Eliminar</button>
            </form>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <a href="/" class="btn btn-secondary mt-3">Volver</a>
      </body>
      </html>
    `;

    res.send(html);
  });
});


// Editar tipo de usuario
app.post('/editar-usuario', requireLogin, requireRole('ADMIN'), (req, res) => {
  const { id, nuevo_tipo } = req.body;
  const query = 'UPDATE usuarios SET tipo_usuario = ? WHERE id = ?';
  connection.query(query, [nuevo_tipo, id], (err) => {
    if (err) {
      console.error('Error al actualizar usuario:', err);
      return res.send('Error al editar usuario.');
    }
    res.redirect('/gestionar-registros');
  });
});

// Eliminar usuario
app.post('/eliminar-usuario', requireLogin, requireRole('ADMIN'), (req, res) => {
  const { id } = req.body;
  const query = 'DELETE FROM usuarios WHERE id = ?';
  connection.query(query, [id], (err) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return res.send('Error al eliminar usuario.');
    }
    res.redirect('/gestionar-registros');
  });
});

//Ruta para gestionar instrumentos 
app.get('/gestionar-instrumentos', requireLogin, requireRole(['ADMIN','ASISTENTE']), (req, res) => {
  const query = 'SELECT id, nombre, categoria, estado, ubicacion FROM instrumentos';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener instrumentos:', err);
      return res.send('Error al cargar los instrumentos.');
    }

    let html = `
      <html>
      <head>
        <!-- Bootswatch brite descargado local -->
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <title>Gestión de Instrumentos</title> 
      </head>
      <body class="container mt-4">
        <h1 class="mb-4">Gestión de Instrumentos</h1>

        <table class="table table-striped table-bordered align-middle">
          <thead class="table-dark">
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Instrumento</th>
              <th scope="col">Categoría</th>
              <th scope="col">Estado</th>
              <th scope="col">Ubicación</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    results.forEach(inst => {
      html += `
        <tr>
          <td>${inst.id}</td>
          <td>${inst.nombre}</td>
          <td>${inst.categoria}</td>
          <td>${inst.estado}</td>
          <td>${inst.ubicacion}</td>
          <td>
            <form action="/actualizar-instrumento/${inst.id}" method="GET" class="d-inline">
              <button type="submit" class="btn btn-sm btn-primary">Actualizar</button>
            </form>

            <form action="/eliminar-instrumento" method="POST" class="d-inline">
              <input type="hidden" name="id" value="${inst.id}">
              <button type="submit" class="btn btn-sm btn-danger ms-2"
                onclick="return confirm('¿Eliminar instrumento?')">Eliminar</button>
            </form>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <div class="mt-3">
          <a href="/" class="btn btn-secondary">Volver</a>
          <a href="/submit-data" class="btn btn-success ms-2">Registrar instrumento nuevo</a>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});

app.get('/submit-data', requireLogin, requireRole(['ADMIN','ASISTENTE']), (req, res) => {
  let html = `
    <html>
    <head>
      <!-- Bootswatch brite descargado local -->
      <link rel="stylesheet" href="/bootstrap/bootstrap.css">
      <title>Registrar Instrumento</title>
    </head>
    <body class="container mt-4">
      <h1 class="mb-4">Registrar Instrumento</h1>

      <form action="/submit-data" method="POST" class="mb-3">
        <div class="mb-3">
          <label class="form-label">Nombre:</label>
          <input type="text" class="form-control" name="name" required>
        </div>

        <div class="mb-3">
          <label class="form-label">Categoría:</label>
          <select class="form-select" name="category" required> 
            <option value="EQUIPOS MÉDICOS">EQUIPOS MÉDICOS</option> 
            <option value="PRÓTESIS">PRÓTESIS</option> 
            <option value="ORTESIS">ORTESIS</option> 
            <option value="DE DIAGNÓSTICO">DE DIAGNÓSTICO</option> 
            <option value="QUIRÚRGICOS">QUIRÚRGICOS</option> 
            <option value="DE CURACIÓN">DE CURACIÓN</option> 
            <option value="PRODUCTOS HIGIÉNICOS">PRODUCTOS HIGIÉNICOS</option> 
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Estado:</label>
          <select class="form-select" name="status" required>
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="PRESTADO">PRESTADO</option>
            <option value="MANTENIMIENTO">MANTENIMIENTO</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Ubicación:</label>
          <select class="form-select" name="location" required>
            <option value="Almacén 1">Almacén 1</option>
            <option value="Almacén 2">Almacén 2</option>
            <option value="Oficina 3">Oficina 3</option>
            <option value="Oficina 4">Oficina 4</option>
            <option value="Oficina 5">Oficina 5</option>
            <option value="Área de Embalaje">Área de Embalaje</option>
            <option value="Cubículo 10">Cubículo 10</option>
            <option value="Cubículo 11">Cubículo 11</option>
            <option value="Cubículo 12">Cubículo 12</option>
          </select>
        </div>

        <button type="submit" class="btn btn-success">Registrar</button>
        <a href="/gestionar-instrumentos" class="btn btn-secondary ms-2">Volver</a>
      </form>
    </body>
    </html>
  `;

  res.send(html);
});

app.get('/instrumento/:id', requireLogin, requireRole(['ADMIN','ASISTENTE']), (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM instrumentos WHERE id = ?';
  connection.query(query, [id], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).send('Instrumento no encontrado.');
    }

    const inst = result[0];

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <title>Ver Instrumento</title>
        <style>
          body {
            background-color: #f8f9fa;
          }
          .card {
            max-width: 600px;
            width: 100%;
          }
          .info-row {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 1rem;
          }
          .info-row .label {
            font-weight: bold;
            color: #6c757d;
            margin-right: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container py-5 d-flex justify-content-center">
          <div class="card shadow-lg border-0">
            <div class="card-header bg-success text-white text-center">
              <h1 class="card-title mb-0">Información del Instrumento</h1>
            </div>
            <div class="card-body text-center">
              <div class="info-row">
                <span class="label">ID:</span>
                <span class="text-dark">${inst.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="text-dark">${inst.nombre}</span>
              </div>
              <div class="info-row">
                <span class="label">Categoría:</span>
                <span class="text-dark">${inst.categoria}</span>
              </div>
              <div class="info-row">
                <span class="label">Estado:</span>
                <span class="badge ${inst.estado === 'DISPONIBLE' ? 'bg-success' : inst.estado === 'MANTENIMIENTO' ? 'bg-warning text-dark' : 'bg-danger'}">
                  ${inst.estado}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Ubicación:</span>
                <span class="text-dark">${inst.ubicacion}</span>
              </div>

              <div class="d-flex justify-content-center gap-3 mt-4">
                <a href="/gestionar-instrumentos" class="btn btn-outline-secondary">Volver</a>
                <a href="/" class="btn btn-success">Página principal</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  });
});



app.get('/actualizar-instrumento/:id', requireLogin, requireRole(['ADMIN','ASISTENTE']), (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM instrumentos WHERE id = ?';
  connection.query(query, [id], (err, result) => {
    if (err || result.length === 0) {
      return res.send('Instrumento no encontrado.');
    }

    const inst = result[0];

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <title>Actualizar Instrumento</title>
      </head>
      <body class="container mt-4">
        <h1 class="mb-4">Actualizar Instrumento</h1>

        <form action="/actualizar-instrumento" method="POST" class="card p-4 shadow-sm">
          <input type="hidden" name="id" value="${inst.id}">

          <div class="mb-3">
            <label class="form-label">Nombre:</label>
            <input type="text" class="form-control" name="nombre" value="${inst.nombre}" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Categoría:</label>
            <select class="form-select" name="categoria" required>
              <option value="EQUIPOS MÉDICOS" ${inst.categoria === 'EQUIPOS MÉDICOS' ? 'selected' : ''}>EQUIPOS MÉDICOS</option>
              <option value="PRÓTESIS" ${inst.categoria === 'PRÓTESIS' ? 'selected' : ''}>PRÓTESIS</option>
              <option value="ORTESIS" ${inst.categoria === 'ORTESIS' ? 'selected' : ''}>ORTESIS</option>
              <option value="DE DIAGNÓSTICO" ${inst.categoria === 'DE DIAGNÓSTICO' ? 'selected' : ''}>DE DIAGNÓSTICO</option>
              <option value="QUIRÚRGICOS" ${inst.categoria === 'QUIRÚRGICOS' ? 'selected' : ''}>QUIRÚRGICOS</option>
              <option value="DE CURACIÓN" ${inst.categoria === 'DE CURACIÓN' ? 'selected' : ''}>DE CURACIÓN</option>
              <option value="PRODUCTOS HIGIÉNICOS" ${inst.categoria === 'PRODUCTOS HIGIÉNICOS' ? 'selected' : ''}>PRODUCTOS HIGIÉNICOS</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Estado:</label>
            <select class="form-select" name="estado" required>
              <option value="DISPONIBLE" ${inst.estado === 'DISPONIBLE' ? 'selected' : ''}>DISPONIBLE</option>
              <option value="PRESTADO" ${inst.estado === 'PRESTADO' ? 'selected' : ''}>PRESTADO</option>
              <option value="MANTENIMIENTO" ${inst.estado === 'MANTENIMIENTO' ? 'selected' : ''}>MANTENIMIENTO</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Ubicación:</label>
            <select class="form-select" name="ubicacion" required>
              <option value="Almacén 1" ${inst.ubicacion === 'Almacén 1' ? 'selected' : ''}>Almacén 1</option>
              <option value="Almacén 2" ${inst.ubicacion === 'Almacén 2' ? 'selected' : ''}>Almacén 2</option>
              <option value="Oficina 3" ${inst.ubicacion === 'Oficina 3' ? 'selected' : ''}>Oficina 3</option>
              <option value="Oficina 4" ${inst.ubicacion === 'Oficina 4' ? 'selected' : ''}>Oficina 4</option>
              <option value="Oficina 5" ${inst.ubicacion === 'Oficina 5' ? 'selected' : ''}>Oficina 5</option>
              <option value="Área de Embalaje" ${inst.ubicacion === 'Área de Embalaje' ? 'selected' : ''}>Área de Embalaje</option>
              <option value="Cubículo 10" ${inst.ubicacion === 'Cubículo 10' ? 'selected' : ''}>Cubículo 10</option>
              <option value="Cubículo 11" ${inst.ubicacion === 'Cubículo 11' ? 'selected' : ''}>Cubículo 11</option>
              <option value="Cubículo 12" ${inst.ubicacion === 'Cubículo 12' ? 'selected' : ''}>Cubículo 12</option>
            </select>
          </div>

          <div class="d-flex justify-content-between">
            <button type="submit" class="btn btn-primary">Guardar cambios</button>
            <a href="/gestionar-instrumentos" class="btn btn-secondary">Volver</a>
          </div>
        </form>
      </body>
      </html>
    `;

    res.send(html);
  });
});


app.post('/actualizar-instrumento', requireLogin, requireRole(['ADMIN','ASISTENTE']), (req, res) => {
  const { id, nombre, categoria, estado, ubicacion } = req.body;

  const query = `
    UPDATE instrumentos
    SET nombre = ?, categoria = ?, estado = ?, ubicacion = ?
    WHERE id = ?
  `;

  connection.query(query, [nombre, categoria, estado, ubicacion, id], (err) => {
    if (err) {
      console.error('Error al actualizar:', err);
      return res.send('Error al actualizar el instrumento.');
    }
    res.redirect('/gestionar-instrumentos');
  });
});



// Eliminar instrumento
app.post('/eliminar-instrumento', requireLogin, requireRole('ADMIN'), (req, res) => {
  const { id } = req.body;
  const query = 'DELETE FROM instrumentos WHERE id = ?';
  connection.query(query, [id], (err) => {
    if (err) {
      console.error('Error al eliminar instrumento:', err);
      return res.send('Error al eliminar instrumento.');
    }
    res.redirect('/gestionar-instrumentos');
  });
});

// Ruta para guardar datos en la base de datos
app.post('/submit-data', requireLogin, requireRole(['ADMIN', 'ASISTENTE']), (req, res) => {
  const { name, category, status, location } = req.body;

  // Validación de campos vacíos
  if (!name || !category || !status || !location) {
    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <title>Error</title>
      </head>
      <body class="container mt-5">
        <div class="alert alert-danger text-center" role="alert">
          <h4 class="alert-heading">Error</h4>
          <p>Faltan datos obligatorios para registrar el instrumento.</p>
          <hr>
          <a href="/" class="btn btn-secondary">Volver</a>
        </div>
      </body>
      </html>
    `;
    return res.send(html);
  }

  const query = 'INSERT INTO instrumentos (nombre, categoria, estado, ubicacion) VALUES (?, ?, ?, ?)';
  connection.query(query, [name, category, status, location], (err, result) => {
    if (err) {
      let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
          <title>Error</title>
        </head>
        <body class="container mt-5">
          <div class="alert alert-danger text-center" role="alert">
            <h4 class="alert-heading">Error</h4>
            <p>No se pudo guardar el instrumento en la base de datos.</p>
            <hr>
            <a href="/gestionar-instrumentos" class="btn btn-secondary">Volver</a>
          </div>
        </body>
        </html>
      `;
      return res.send(html);
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        <title>Guardado con éxito</title>
      </head>
      <body class="container mt-5">
        <div class="alert alert-success text-center" role="alert">
          <h4 class="alert-heading">Éxito</h4>
          <p>Los datos del instrumento han sido registrados correctamente.</p>
          <hr>
          <a href="/" class="btn btn-primary">Volver</a>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  });
});


app.get('/buscar-instrumentos', (req, res) => {
  const query = req.query.query;

  const sql = `
    SELECT id, nombre, categoria, estado, ubicacion
    FROM instrumentos
    WHERE nombre LIKE ? OR categoria LIKE ? OR estado LIKE ? OR ubicacion LIKE ?
  `;

  connection.query(sql, 
    [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`], 
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

// Ruta para mostrar los datos de la base de datos en formato HTML
app.get('/instrumentos', requireLogin, requireRole(['ADMIN', 'ASISTENTE', 'AUDITOR']), (req, res) => {
  connection.query('SELECT * FROM instrumentos', (err, results) => {
    if (err) {
      return res.send('Error al obtener los datos.');
    }

    let html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Instrumentos</title>
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
      </head>
      <body class="container mt-4">
        <h1 class="mb-4">Instrumentos Registrados</h1>

        <table class="table table-striped table-bordered align-middle">
          <thead class="table-dark">
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Categoría</th>
              <th scope="col">Estado</th>
              <th scope="col">Ubicación</th>
            </tr>
          </thead>
          <tbody>
    `;

    results.forEach(instrumento => {
      html += `
        <tr>
          <td>${instrumento.nombre}</td>
          <td>${instrumento.categoria}</td>
          <td>
            <span class="badge ${instrumento.estado === 'DISPONIBLE' ? 'bg-success' : instrumento.estado === 'MANTENIMIENTO' ? 'bg-warning text-dark' : 'bg-danger'}">
              ${instrumento.estado}
            </span>
          </td>
          <td>${instrumento.ubicacion}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <a href="/" class="btn btn-secondary mt-3">Volver</a>
      </body>
      </html>
    `;

    res.send(html);
  });
});




//Ruta para subir archivos Xlxs
app.post('/upload', 
  upload.single('excelFile'), 
  requireLogin, 
  requireRole(['ADMIN', 'ASISTENTE']), 
(req, res) => {

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  data.forEach(row => {
    const { nombre, categoria, estado, ubicacion } = row;

    const sql = `INSERT INTO instrumentos (nombre, categoria, estado, ubicacion) VALUES (?, ?, ?, ?)`;

    connection.query(sql, [nombre, categoria, estado, ubicacion], err => {
      if (err) throw err;
    });
  });

  res.send(`
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Éxito</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body style="text-align:center; font-family: Arial;">
    <h1>Archivo cargado y datos guardados</h1>

    <a href="/instrumentos.html">
      <button style="margin: 10px; padding: 8px 15px;">Volver a Instrumentos</button>
    </a>

    <a href="/">
      <button style="margin: 10px; padding: 8px 15px;">Volver al Menú Principal</button>
    </a>
  </body>
  </html>
  `);
});


//Ruta para descargar archivos xlxs
app.get('/download', requireLogin, requireRole(['ADMIN', 'ASISTENTE']), (req, res) => {
  const sql = `SELECT * FROM instrumentos`;
  connection.query(sql, (err, results) => {  
    if (err) throw err;

    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Instrumentos');

    const filePath = path.join(__dirname, 'uploads', 'instrumentos.xlsx');
    xlsx.writeFile(workbook, filePath);
    res.download(filePath, 'instrumentos.xlsx');
  });
});
```
