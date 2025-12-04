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
        <button onclick="window.location.href='/instrumentos'" class="btn btn-primary" >CATALOGO</button>
        <h2 class="card-title">Registros</h2>
        <p class="card-text">Cargas y descargas de los equipos</p>
        <button onclick="window.location.href='/instrumentos.html'" class="btn btn-primary" >REGISTROS</button>
      </div>
    </div>
  </div>

  <div class="col-md-6">
    <div class="card shadow-sm h-100">
      <div class="card-body">
        <h2 class="card-title">Busqueda de equipos</h2>
        <p class="card-text">Busca instrumentos especificos del catalogo a traves de nuestro navegador</p>
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
