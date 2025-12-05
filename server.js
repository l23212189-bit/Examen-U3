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
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (req.session.user && allowedRoles.includes(req.session.user.tipo_usuario)) {
      next();
    } else {
      res.status(403).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Acceso denegado</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        </head>
        <body class="container mt-5">
          <div class="alert alert-danger text-center" role="alert">
            <h4 class="alert-heading">Acceso denegado</h4>
            <p>No tienes permisos para acceder a esta sección.</p>
            <hr>
            <a href="/" class="btn btn-secondary">Volver al inicio</a>
          </div>
        </body>
        </html>
      `);
    }
  };
}


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
app.post(
  '/upload',
  upload.single('excelFile'),
  requireLogin,
  requireRole(['ADMIN', 'ASISTENTE']),
  (req, res) => {
   
    if (!req.file) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
          <link rel="stylesheet" href="/bootstrap/bootstrap.css">
        </head>
        <body class="container mt-5">
          <div class="alert alert-danger text-center" role="alert">
            <h4 class="alert-heading">Error</h4>
            <p>No se subió ningún archivo. Por favor selecciona un archivo Excel antes de continuar.</p>
            <hr>
            <a href="/instrumentos" class="btn btn-secondary">Volver</a>
          </div>
        </body>
        </html>
      `);
    }

   
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
        <link rel="stylesheet" href="/bootstrap/bootstrap.css">
      </head>
      <body class="container mt-5">
        <div class="alert alert-success text-center shadow-sm" role="alert">
          <h4 class="alert-heading">¡Carga exitosa!</h4>
          <p>El archivo fue cargado y los datos se guardaron correctamente.</p>
          <hr>
          <div class="d-flex justify-content-center gap-3">
            <a href="/instrumentos" class="btn btn-primary">Ver instrumentos</a>
            <a href="/" class="btn btn-secondary">Menú principal</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
);




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



