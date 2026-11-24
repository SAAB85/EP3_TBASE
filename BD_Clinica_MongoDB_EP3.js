/* =====================================================================
   BDY1103 - TALLER DE BASE DE DATOS
   EVALUACION PARCIAL 3 - CASO SEMESTRAL: CLINICA
   Modelo de datos No Relacional + operaciones CRUD en MongoDB
   Estudiante: Sebastian Antipan
   ---------------------------------------------------------------------
   COMO EJECUTAR
   - En el taller:  mongosh --file BD_Clinica_MongoDB_EP3.js
   - En mongosh:    load("BD_Clinica_MongoDB_EP3.js")
   El script crea la base "clinica" desde cero y es reproducible:
   todos los datos se generan de forma deterministica (sin Math.random).
   ===================================================================== */

const clinica = db.getSiblingDB("clinica");

function titulo(texto) {
  print("\n============================================================");
  print(" " + texto);
  print("============================================================");
}

function fecha(anio, mes, dia) {
  return new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0));
}

function sumarDias(base, dias) {
  return new Date(base.getTime() + dias * 24 * 60 * 60 * 1000);
}

function contar(nombre, filtro) {
  print("  " + nombre + ": " + clinica.getCollection(nombre).countDocuments(filtro || {}));
}

function mostrarTabla(cursor, columnas) {
  cursor.forEach(function (doc) {
    var fila = [];
    columnas.forEach(function (col) {
      var valor = doc;
      col.split(".").forEach(function (parte) { valor = (valor === null || valor === undefined) ? valor : valor[parte]; });
      if (valor instanceof Date) { valor = valor.toISOString().slice(0, 10); }
      fila.push(valor === undefined || valor === null ? "-" : String(valor));
    });
    print("  " + fila.join(" | "));
  });
}

/* =====================================================================
   0. LIMPIEZA INICIAL
   ===================================================================== */
titulo("0. PREPARACION DE LA BASE DE DATOS");
clinica.dropDatabase();
print("  Base 'clinica' eliminada y recreada desde cero.");

/* =====================================================================
   1. COLECCIONES CON VALIDACION DE ESQUEMA
   ---------------------------------------------------------------------
   De las 12 tablas relacionales se pasa a 6 colecciones. La validacion
   $jsonSchema reemplaza parte de las restricciones (NOT NULL, CHECK,
   tipos de dato) que en Oracle hacian las tablas.
   ===================================================================== */
titulo("1. CREACION DE COLECCIONES Y VALIDADORES");

clinica.createCollection("especialidades", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["_id", "nombre", "descripcion"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "number" },
      nombre: { bsonType: "string", minLength: 3, maxLength: 60 },
      descripcion: { bsonType: "string", maxLength: 200 }
    }
  } },
  validationAction: "error"
});

clinica.createCollection("consultorios", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["_id", "nombre", "piso", "ubicacion"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "number" },
      nombre: { bsonType: "string", minLength: 3, maxLength: 40 },
      piso: { bsonType: "number", minimum: 1, maximum: 20 },
      ubicacion: { bsonType: "string", maxLength: 100 }
    }
  } },
  validationAction: "error"
});

clinica.createCollection("medicos", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["_id", "rut", "nombre", "apellido", "telefono", "email", "fecha_ingreso", "especialidades"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "number" },
      rut: { bsonType: "string", minLength: 3, maxLength: 12 },
      nombre: { bsonType: "string", minLength: 2, maxLength: 60 },
      apellido: { bsonType: "string", minLength: 2, maxLength: 60 },
      telefono: { bsonType: "string", maxLength: 20 },
      email: { bsonType: "string", maxLength: 100 },
      fecha_ingreso: { bsonType: "date" },
      especialidades: {
        bsonType: "array", minItems: 1,
        items: {
          bsonType: "object",
          required: ["id_especialidad", "nombre"],
          additionalProperties: false,
          properties: {
            id_especialidad: { bsonType: "number" },
            nombre: { bsonType: "string", maxLength: 60 }
          }
        }
      }
    }
  } },
  validationAction: "error"
});

clinica.createCollection("pacientes", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["_id", "rut", "nombre", "apellido", "fecha_nacimiento", "sexo", "telefono", "direccion", "email", "fecha_registro", "historial_medico"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "number" },
      rut: { bsonType: "string", minLength: 3, maxLength: 12 },
      nombre: { bsonType: "string", minLength: 2, maxLength: 60 },
      apellido: { bsonType: "string", minLength: 2, maxLength: 60 },
      fecha_nacimiento: { bsonType: "date" },
      sexo: { bsonType: "string", enum: ["M", "F"] },
      telefono: { bsonType: "string", maxLength: 20 },
      direccion: { bsonType: "string", maxLength: 150 },
      email: { bsonType: "string", maxLength: 100 },
      fecha_registro: { bsonType: "date" },
      historial_medico: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["id_historial", "fecha_registro", "observaciones"],
          additionalProperties: false,
          properties: {
            id_historial: { bsonType: "number" },
            fecha_registro: { bsonType: "date" },
            observaciones: { bsonType: "string", maxLength: 500 }
          }
        }
      }
    }
  } },
  validationAction: "error"
});

clinica.createCollection("medicamentos", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["_id", "nombre", "descripcion", "stock", "precio"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "number" },
      nombre: { bsonType: "string", minLength: 3, maxLength: 100 },
      descripcion: { bsonType: "string", maxLength: 200 },
      stock: { bsonType: "number", minimum: 0 },
      precio: { bsonType: "number", minimum: 0 }
    }
  } },
  validationAction: "error"
});

clinica.createCollection("citas", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["_id", "paciente", "medico", "consultorio", "fecha_cita", "hora_cita", "estado", "diagnostico", "tratamiento", "recetas"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "number" },
      paciente: {
        bsonType: "object",
        required: ["id_paciente", "rut", "nombre", "apellido"],
        additionalProperties: false,
        properties: {
          id_paciente: { bsonType: "number" },
          rut: { bsonType: "string" },
          nombre: { bsonType: "string" },
          apellido: { bsonType: "string" }
        }
      },
      medico: {
        bsonType: "object",
        required: ["id_medico", "nombre", "apellido", "especialidad"],
        additionalProperties: false,
        properties: {
          id_medico: { bsonType: "number" },
          nombre: { bsonType: "string" },
          apellido: { bsonType: "string" },
          especialidad: { bsonType: "string" }
        }
      },
      consultorio: {
        bsonType: "object",
        required: ["id_consultorio", "nombre", "piso", "ubicacion"],
        additionalProperties: false,
        properties: {
          id_consultorio: { bsonType: "number" },
          nombre: { bsonType: "string" },
          piso: { bsonType: "number" },
          ubicacion: { bsonType: "string" }
        }
      },
      fecha_cita: { bsonType: "date" },
      hora_cita: { bsonType: "string", maxLength: 5 },
      estado: { bsonType: "string", enum: ["PROGRAMADA", "ATENDIDA", "CANCELADA", "NO_ASISTIO"] },
      diagnostico: {
        anyOf: [
          { bsonType: "null" },
          {
            bsonType: "object",
            required: ["id_diagnostico", "codigo_cie", "descripcion", "fecha_diagnostico"],
            additionalProperties: false,
            properties: {
              id_diagnostico: { bsonType: "number" },
              codigo_cie: { bsonType: "string", maxLength: 10 },
              descripcion: { bsonType: "string", maxLength: 300 },
              fecha_diagnostico: { bsonType: "date" }
            }
          }
        ]
      },
      tratamiento: {
        anyOf: [
          { bsonType: "null" },
          {
            bsonType: "object",
            required: ["id_tratamiento", "descripcion", "fecha_inicio", "fecha_fin"],
            additionalProperties: false,
            properties: {
              id_tratamiento: { bsonType: "number" },
              descripcion: { bsonType: "string", maxLength: 300 },
              fecha_inicio: { bsonType: "date" },
              fecha_fin: { bsonType: "date" }
            }
          }
        ]
      },
      recetas: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["id_receta", "fecha_receta", "detalle"],
          additionalProperties: false,
          properties: {
            id_receta: { bsonType: "number" },
            fecha_receta: { bsonType: "date" },
            detalle: {
              bsonType: "array",
              minItems: 1,
              items: {
                bsonType: "object",
                required: ["id_medicamento", "nombre", "dosis", "frecuencia", "duracion_dias", "precio_unitario"],
                additionalProperties: false,
                properties: {
                  id_medicamento: { bsonType: "number" },
                  nombre: { bsonType: "string" },
                  dosis: { bsonType: "string", maxLength: 60 },
                  frecuencia: { bsonType: "string", maxLength: 60 },
                  duracion_dias: { bsonType: "number", minimum: 1 },
                  precio_unitario: { bsonType: "number", minimum: 0 }
                }
              }
            }
          }
        }
      }
    }
  } },
  validationAction: "error"
});

print("  Colecciones creadas: especialidades, consultorios, medicos, pacientes, medicamentos, citas.");

/* =====================================================================
   2. INDICES
   ---------------------------------------------------------------------
   En NoSQL los indices se disenan segun las consultas reales, no solo
   por las claves foraneas. Se indexan los campos de busqueda frecuente.
   ===================================================================== */
titulo("2. CREACION DE INDICES");

clinica.especialidades.createIndex({ nombre: 1 }, { unique: true });
clinica.consultorios.createIndex({ nombre: 1 }, { unique: true });
clinica.medicos.createIndex({ rut: 1 }, { unique: true });
clinica.medicos.createIndex({ "especialidades.id_especialidad": 1 });
clinica.pacientes.createIndex({ rut: 1 }, { unique: true });
clinica.pacientes.createIndex({ apellido: 1, nombre: 1 });
clinica.pacientes.createIndex({ fecha_nacimiento: 1 });
clinica.medicamentos.createIndex({ nombre: 1 }, { unique: true });
clinica.medicamentos.createIndex({ stock: 1 });
clinica.citas.createIndex({ "paciente.id_paciente": 1, fecha_cita: -1 });
clinica.citas.createIndex({ "medico.id_medico": 1, fecha_cita: -1 });
clinica.citas.createIndex({ fecha_cita: 1, estado: 1 });
clinica.citas.createIndex({ "diagnostico.codigo_cie": 1 });

print("  Indices creados: 13 (unicos en RUT, nombres y fechas de busqueda).");

/* =====================================================================
   3. CARGA DE DATOS DE PRUEBA
   ---------------------------------------------------------------------
   Volumen equivalente al caso semestral: 120 pacientes, 240 citas,
   10 medicos, 6 consultorios, 10 especialidades y 12 medicamentos.
   ===================================================================== */
titulo("3. CARGA MASIVA DE DATOS");

var especialidadesBase = [
  { _id: 1,  nombre: "Medicina General",     descripcion: "Atencion primaria y control general" },
  { _id: 2,  nombre: "Pediatria",            descripcion: "Atencion de ninos y adolescentes" },
  { _id: 3,  nombre: "Cardiologia",          descripcion: "Enfermedades del corazon" },
  { _id: 4,  nombre: "Dermatologia",         descripcion: "Enfermedades de la piel" },
  { _id: 5,  nombre: "Traumatologia",        descripcion: "Lesiones oseas y musculares" },
  { _id: 6,  nombre: "Ginecologia",          descripcion: "Salud reproductiva femenina" },
  { _id: 7,  nombre: "Oftalmologia",         descripcion: "Enfermedades de la vista" },
  { _id: 8,  nombre: "Otorrinolaringologia", descripcion: "Oido, nariz y garganta" },
  { _id: 9,  nombre: "Psiquiatria",          descripcion: "Salud mental" },
  { _id: 10, nombre: "Endocrinologia",       descripcion: "Enfermedades hormonales y metabolicas" }
];
clinica.especialidades.insertMany(especialidadesBase);

var consultoriosBase = [
  { _id: 1, nombre: "Consultorio 101", piso: 1, ubicacion: "Ala Norte" },
  { _id: 2, nombre: "Consultorio 102", piso: 1, ubicacion: "Ala Norte" },
  { _id: 3, nombre: "Consultorio 201", piso: 2, ubicacion: "Ala Sur" },
  { _id: 4, nombre: "Consultorio 202", piso: 2, ubicacion: "Ala Sur" },
  { _id: 5, nombre: "Consultorio 301", piso: 3, ubicacion: "Ala Poniente" },
  { _id: 6, nombre: "Consultorio 302", piso: 3, ubicacion: "Ala Poniente" }
];
clinica.consultorios.insertMany(consultoriosBase);

var medicamentosBase = [
  { _id: 1,  nombre: "Paracetamol 500mg",    descripcion: "Analgesico y antipiretico",       stock: 500, precio: 1200 },
  { _id: 2,  nombre: "Ibuprofeno 400mg",     descripcion: "Antiinflamatorio no esteroidal",  stock: 400, precio: 1800 },
  { _id: 3,  nombre: "Amoxicilina 500mg",    descripcion: "Antibiotico",                     stock: 300, precio: 3500 },
  { _id: 4,  nombre: "Loratadina 10mg",      descripcion: "Antihistaminico",                 stock: 250, precio: 2200 },
  { _id: 5,  nombre: "Omeprazol 20mg",       descripcion: "Protector gastrico",              stock: 350, precio: 2900 },
  { _id: 6,  nombre: "Losartan 50mg",        descripcion: "Antihipertensivo",                stock: 200, precio: 4200 },
  { _id: 7,  nombre: "Metformina 850mg",     descripcion: "Antidiabetico",                   stock: 220, precio: 3100 },
  { _id: 8,  nombre: "Salbutamol Inhalador", descripcion: "Broncodilatador",                 stock: 150, precio: 5600 },
  { _id: 9,  nombre: "Diclofenaco 50mg",     descripcion: "Antiinflamatorio",                stock: 280, precio: 1500 },
  { _id: 10, nombre: "Cetirizina 10mg",      descripcion: "Antihistaminico",                 stock: 260, precio: 2000 },
  { _id: 11, nombre: "Vitamina C 1g",        descripcion: "Suplemento vitaminico",           stock: 400, precio: 2500 },
  { _id: 12, nombre: "Ranitidina 150mg",     descripcion: "Protector gastrico",              stock: 180, precio: 1900 }
];
clinica.medicamentos.insertMany(medicamentosBase);

var medicosBase = [
  { id: 1,  rut: "11111111-1", nombre: "Andrea",    apellido: "Soto",      tel: "+56911111111", email: "a.soto@clinica.cl",    ingreso: fecha(2018, 3, 1),  esp: [1, 10] },
  { id: 2,  rut: "22222222-2", nombre: "Bastian",   apellido: "Rojas",     tel: "+56922222222", email: "b.rojas@clinica.cl",   ingreso: fecha(2019, 5, 15), esp: [2] },
  { id: 3,  rut: "33333333-3", nombre: "Carla",     apellido: "Fuentes",   tel: "+56933333333", email: "c.fuentes@clinica.cl", ingreso: fecha(2017, 11, 20), esp: [3, 1] },
  { id: 4,  rut: "44444444-4", nombre: "Diego",     apellido: "Munoz",     tel: "+56944444444", email: "d.munoz@clinica.cl",   ingreso: fecha(2020, 1, 10), esp: [4] },
  { id: 5,  rut: "55555555-5", nombre: "Elena",     apellido: "Vargas",    tel: "+56955555555", email: "e.vargas@clinica.cl",  ingreso: fecha(2016, 7, 7),  esp: [5] },
  { id: 6,  rut: "66666666-6", nombre: "Francisco", apellido: "Herrera",   tel: "+56966666666", email: "f.herrera@clinica.cl", ingreso: fecha(2021, 2, 25), esp: [6] },
  { id: 7,  rut: "77777777-7", nombre: "Gabriela",  apellido: "Contreras", tel: "+56977777777", email: "g.contreras@clinica.cl", ingreso: fecha(2015, 9, 9), esp: [7] },
  { id: 8,  rut: "88888888-8", nombre: "Hugo",      apellido: "Silva",     tel: "+56988888888", email: "h.silva@clinica.cl",   ingreso: fecha(2019, 10, 30), esp: [8] },
  { id: 9,  rut: "99999999-9", nombre: "Ignacia",   apellido: "Pizarro",   tel: "+56999999999", email: "i.pizarro@clinica.cl", ingreso: fecha(2022, 4, 18), esp: [9] },
  { id: 10, rut: "10101010-1", nombre: "Javier",    apellido: "Cortes",    tel: "+56910101010", email: "j.cortes@clinica.cl",  ingreso: fecha(2018, 12, 12), esp: [10] }
];

var medicosDocs = medicosBase.map(function (m) {
  return {
    _id: m.id, rut: m.rut, nombre: m.nombre, apellido: m.apellido,
    telefono: m.tel, email: m.email, fecha_ingreso: m.ingreso,
    especialidades: m.esp.map(function (idEsp) {
      var esp = especialidadesBase.find(function (e) { return e._id === idEsp; });
      return { id_especialidad: esp._id, nombre: esp.nombre };
    })
  };
});
clinica.medicos.insertMany(medicosDocs);

var nombres = [
  "Ana", "Luis", "Maria", "Jorge", "Carolina", "Pedro", "Valentina", "Diego", "Camila", "Matias",
  "Francisca", "Sebastian", "Javiera", "Nicolas", "Antonia", "Cristobal", "Isidora", "Felipe", "Constanza", "Ignacio",
  "Martina", "Vicente", "Josefa", "Benjamin", "Catalina", "Maximiliano", "Fernanda", "Cristian", "Daniela", "Andres"
];
var apellidos = [
  "Antipan", "Gonzalez", "Munoz", "Rojas", "Diaz", "Soto", "Contreras", "Silva", "Sepulveda", "Morales",
  "Perez", "Rodriguez", "Fuentes", "Hernandez", "Torres", "Araya", "Flores", "Espinoza", "Valdes", "Castillo",
  "Vargas", "Pizarro", "Cortes", "Herrera", "Navarro", "Ortiz", "Gutierrez", "Figueroa", "Salazar", "Medina"
];
var calles = ["Av. Los Aromos", "Av. Los Cedros", "Calle El Roble", "Av. Del Sol", "Pasaje Las Flores", "Calle San Martin", "Av. Independencia", "Calle Los Alerces"];
var ciudades = ["Santiago", "Valparaiso", "Concepcion", "La Serena"];
var observacionesBase = [
  "Paciente sin antecedentes relevantes.",
  "Alergia leve a la penicilina.",
  "Control por hipertension arterial.",
  "Antecedentes familiares de diabetes.",
  "Paciente con tratamiento dermatologico previo."
];

var pacientesDocs = [];
for (var i = 1; i <= 120; i++) {
  var nombrePac = nombres[(i - 1) % nombres.length];
  var apellidoPac = apellidos[Math.floor((i - 1) / nombres.length) % apellidos.length];
  pacientesDocs.push({
    _id: i,
    rut: String(10000000 + i) + "-" + ((i * 3) % 10),
    nombre: nombrePac,
    apellido: apellidoPac,
    fecha_nacimiento: fecha(1945 + ((i * 7) % 60), ((i * 3) % 12) + 1, ((i * 11) % 28) + 1),
    sexo: i % 2 === 0 ? "F" : "M",
    telefono: "+569" + String(20000000 + i * 137).slice(0, 8),
    direccion: calles[i % calles.length] + " " + (100 + i * 3) + ", " + ciudades[i % ciudades.length],
    email: "paciente" + i + "@correo.cl",
    fecha_registro: sumarDias(fecha(2025, 1, 1), i * 2),
    historial_medico: [{
      id_historial: i,
      fecha_registro: sumarDias(fecha(2025, 1, 1), i * 2),
      observaciones: observacionesBase[i % observacionesBase.length]
    }]
  });
}
clinica.pacientes.insertMany(pacientesDocs);

var diagnosticosBase = [
  { codigo: "J00",   descripcion: "Rinofaringitis aguda" },
  { codigo: "J18.9", descripcion: "Neumonia no especificada" },
  { codigo: "I10",   descripcion: "Hipertension esencial" },
  { codigo: "E11.9", descripcion: "Diabetes mellitus tipo 2" },
  { codigo: "M54.5", descripcion: "Lumbago no especificado" },
  { codigo: "K29.7", descripcion: "Gastritis no especificada" },
  { codigo: "F32.9", descripcion: "Episodio depresivo" },
  { codigo: "H10.9", descripcion: "Conjuntivitis no especificada" },
  { codigo: "N39.0", descripcion: "Infeccion urinaria" },
  { codigo: "L20.9", descripcion: "Dermatitis atopica" }
];
var tratamientosBase = [
  "Reposo e hidratacion por 5 dias.",
  "Control en 7 dias y ajuste de tratamiento.",
  "Tratamiento farmacologico segun receta.",
  "Derivacion a especialista para evaluacion.",
  "Seguimiento telefonico en 48 horas."
];
var dosisBase = ["1 comprimido", "2 comprimidos", "1 ml", "2 ml", "1 inhalacion"];
var frecuenciaBase = ["cada 8 horas", "cada 12 horas", "cada 24 horas", "cada 6 horas", "segun necesidad"];
var estados = ["ATENDIDA", "ATENDIDA", "ATENDIDA", "ATENDIDA", "ATENDIDA", "ATENDIDA", "PROGRAMADA", "PROGRAMADA", "CANCELADA", "NO_ASISTIO"];

var citasDocs = [];
for (var c = 1; c <= 240; c++) {
  /* Los primeros 60 cupos son controles de pacientes cronicos (1-20);
     el resto se reparte entre los 120 pacientes. Asi hay pacientes con
     mas citas que otros, como en una clinica real. */
  var idPac = c <= 60 ? ((c - 1) % 20) + 1 : ((c - 1) % 120) + 1;
  var idMed = ((c - 1) % 10) + 1;
  var idCons = ((c - 1) % 6) + 1;
  var pac = pacientesDocs[idPac - 1];
  var med = medicosDocs[idMed - 1];
  var cons = consultoriosBase[idCons - 1];
  var fechaCita = sumarDias(fecha(2026, 1, 2), c - 1);
  var estado = estados[(c - 1) % estados.length];
  var esAtendida = estado === "ATENDIDA";
  var diag = null;
  var trat = null;
  var recetas = [];

  if (esAtendida) {
    var d = diagnosticosBase[(c - 1) % diagnosticosBase.length];
    diag = {
      id_diagnostico: c,
      codigo_cie: d.codigo,
      descripcion: d.descripcion,
      fecha_diagnostico: sumarDias(fechaCita, 1)
    };
    trat = {
      id_tratamiento: c,
      descripcion: tratamientosBase[(c - 1) % tratamientosBase.length],
      fecha_inicio: sumarDias(fechaCita, 1),
      fecha_fin: sumarDias(fechaCita, 8)
    };
    if (c % 3 !== 0) {
      var detalle = [];
      var cantidad = (c % 3) + 1;
      for (var j = 1; j <= cantidad; j++) {
        var idMedicamento = ((c + j) % 12) + 1;
        var medic = medicamentosBase[idMedicamento - 1];
        detalle.push({
          id_medicamento: medic._id,
          nombre: medic.nombre,
          dosis: dosisBase[(c + j) % dosisBase.length],
          frecuencia: frecuenciaBase[(c + j) % frecuenciaBase.length],
          duracion_dias: 3 + ((c + j) % 10),
          precio_unitario: medic.precio
        });
      }
      recetas.push({ id_receta: c, fecha_receta: sumarDias(fechaCita, 1), detalle: detalle });
    }
  }

  citasDocs.push({
    _id: c,
    paciente: { id_paciente: idPac, rut: pac.rut, nombre: pac.nombre, apellido: pac.apellido },
    medico: { id_medico: idMed, nombre: med.nombre, apellido: med.apellido, especialidad: med.especialidades[0].nombre },
    consultorio: { id_consultorio: idCons, nombre: cons.nombre, piso: cons.piso, ubicacion: cons.ubicacion },
    fecha_cita: fechaCita,
    hora_cita: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "15:00", "15:30", "16:00", "16:30"][(c - 1) % 10],
    estado: estado,
    diagnostico: diag,
    tratamiento: trat,
    recetas: recetas
  });
}
clinica.citas.insertMany(citasDocs);

print("  Especialidades: " + clinica.especialidades.countDocuments({}));
print("  Consultorios:   " + clinica.consultorios.countDocuments({}));
print("  Medicos:        " + clinica.medicos.countDocuments({}));
print("  Pacientes:      " + clinica.pacientes.countDocuments({}));
print("  Medicamentos:   " + clinica.medicamentos.countDocuments({}));
print("  Citas:          " + clinica.citas.countDocuments({}));

/* =====================================================================
   4. VALIDACION DE ESQUEMA EN ACCION
   ---------------------------------------------------------------------
   Se intenta insertar un paciente con sexo invalido y un medicamento con
   stock negativo. MongoDB debe rechazar ambos documentos.
   ===================================================================== */
titulo("4. DEMOSTRACION DE VALIDACION DE ESQUEMA");

try {
  clinica.pacientes.insertOne({
    _id: 900, rut: "99999999-9", nombre: "Prueba", apellido: "Invalido",
    fecha_nacimiento: fecha(1990, 1, 1), sexo: "X", telefono: "+56900000000",
    direccion: "Sin direccion", email: "invalido@correo.cl",
    fecha_registro: fecha(2026, 1, 1), historial_medico: []
  });
  print("  ERROR: el documento invalido fue aceptado.");
} catch (e) {
  print("  Paciente rechazado correctamente: sexo debe ser M o F.");
}

try {
  clinica.medicamentos.insertOne({
    _id: 900, nombre: "Medicamento invalido", descripcion: "Prueba",
    stock: -5, precio: 1000
  });
  print("  ERROR: el medicamento invalido fue aceptado.");
} catch (e) {
  print("  Medicamento rechazado correctamente: stock no puede ser negativo.");
}

/* =====================================================================
   5. CRUD - CREATE
   ===================================================================== */
titulo("5. CRUD: CREATE (insertOne / insertMany)");

var nuevoPaciente = {
  _id: 121, rut: "20000121-4", nombre: "Teresa", apellido: "Antipan",
  fecha_nacimiento: fecha(1988, 6, 14), sexo: "F", telefono: "+56912345678",
  direccion: "Av. Los Aromos 1500, Santiago", email: "teresa.antipan@correo.cl",
  fecha_registro: fecha(2026, 11, 10),
  historial_medico: [{
    id_historial: 121, fecha_registro: fecha(2026, 11, 10),
    observaciones: "Paciente nueva. Ingresa por control preventivo."
  }]
};
var resPaciente = clinica.pacientes.insertOne(nuevoPaciente);
print("  insertOne paciente -> _id insertado: " + resPaciente.insertedId);

var resPacientes = clinica.pacientes.insertMany([
  { _id: 122, rut: "20000122-2", nombre: "Ramiro", apellido: "Antipan", fecha_nacimiento: fecha(1979, 2, 20),
    sexo: "M", telefono: "+56922334455", direccion: "Calle El Roble 220, Valparaiso",
    email: "ramiro.antipan@correo.cl", fecha_registro: fecha(2026, 11, 10), historial_medico: [] },
  { _id: 123, rut: "20000123-0", nombre: "Emilia", apellido: "Antipan", fecha_nacimiento: fecha(2010, 9, 3),
    sexo: "F", telefono: "+56933445566", direccion: "Av. Del Sol 340, Concepcion",
    email: "emilia.antipan@correo.cl", fecha_registro: fecha(2026, 11, 10), historial_medico: [] }
]);
print("  insertMany pacientes -> documentos insertados: " + Object.keys(resPacientes.insertedIds).length);

var nuevaCita = {
  _id: 241,
  paciente: { id_paciente: 121, rut: "20000121-4", nombre: "Teresa", apellido: "Antipan" },
  medico: { id_medico: 2, nombre: "Bastian", apellido: "Rojas", especialidad: "Pediatria" },
  consultorio: { id_consultorio: 3, nombre: "Consultorio 201", piso: 2, ubicacion: "Ala Sur" },
  fecha_cita: fecha(2026, 12, 15), hora_cita: "10:30", estado: "PROGRAMADA",
  diagnostico: null, tratamiento: null, recetas: []
};
var resCita = clinica.citas.insertOne(nuevaCita);
print("  insertOne cita -> _id insertado: " + resCita.insertedId);

var resCitasPrueba = clinica.citas.insertMany([
  { _id: 242,
    paciente: { id_paciente: 2, rut: "10000002-6", nombre: "Luis", apellido: "Antipan" },
    medico: { id_medico: 1, nombre: "Andrea", apellido: "Soto", especialidad: "Medicina General" },
    consultorio: { id_consultorio: 1, nombre: "Consultorio 101", piso: 1, ubicacion: "Ala Norte" },
    fecha_cita: fecha(2026, 12, 16), hora_cita: "09:00", estado: "CANCELADA",
    diagnostico: null, tratamiento: null, recetas: [] },
  { _id: 243,
    paciente: { id_paciente: 3, rut: "10000003-9", nombre: "Maria", apellido: "Antipan" },
    medico: { id_medico: 1, nombre: "Andrea", apellido: "Soto", especialidad: "Medicina General" },
    consultorio: { id_consultorio: 2, nombre: "Consultorio 102", piso: 1, ubicacion: "Ala Norte" },
    fecha_cita: fecha(2026, 12, 17), hora_cita: "09:30", estado: "CANCELADA",
    diagnostico: null, tratamiento: null, recetas: [] }
]);
print("  insertMany citas de prueba -> documentos insertados: " + Object.keys(resCitasPrueba.insertedIds).length);

/* =====================================================================
   6. CRUD - READ
   ===================================================================== */
titulo("6. CRUD: READ (find / findOne / proyecciones)");

print("\n  6.1 Historia clinica completa de un paciente (documento embebido):");
var paciente1 = clinica.pacientes.findOne({ _id: 1 }, { nombre: 1, apellido: 1, rut: 1, historial_medico: 1 });
printjson(paciente1);

print("\n  6.2 Las 5 citas mas recientes de pacientes con apellido Antipan:");
mostrarTabla(
  clinica.citas.find(
    { "paciente.apellido": "Antipan" },
    { _id: 0, "paciente.nombre": 1, "paciente.apellido": 1, fecha_cita: 1, hora_cita: 1, estado: 1 }
  ).sort({ fecha_cita: -1 }).limit(5),
  ["paciente.nombre", "paciente.apellido", "fecha_cita", "hora_cita", "estado"]
);

print("\n  6.3 Citas atendidas en marzo de 2026:");
mostrarTabla(
  clinica.citas.find(
    { fecha_cita: { $gte: fecha(2026, 3, 1), $lt: fecha(2026, 4, 1) }, estado: "ATENDIDA" },
    { _id: 1, "paciente.nombre": 1, "paciente.apellido": 1, "medico.nombre": 1, "medico.apellido": 1, fecha_cita: 1 }
  ).sort({ fecha_cita: 1 }).limit(6),
  ["_id", "paciente.nombre", "paciente.apellido", "medico.nombre", "fecha_cita"]
);

print("\n  6.4 Citas con diagnostico de hipertension (I10) o diabetes (E11.9):");
mostrarTabla(
  clinica.citas.find(
    { "diagnostico.codigo_cie": { $in: ["I10", "E11.9"] } },
    { _id: 1, "paciente.nombre": 1, "paciente.apellido": 1, "diagnostico.codigo_cie": 1, "diagnostico.descripcion": 1, fecha_cita: 1 }
  ).sort({ fecha_cita: -1 }).limit(8),
  ["_id", "paciente.nombre", "paciente.apellido", "diagnostico.codigo_cie", "fecha_cita"]
);

print("\n  6.5 Citas que tienen al menos una receta (subdocumento anidado):");
print("  Total con receta: " + clinica.citas.countDocuments({ "recetas.0": { $exists: true } }));

print("\n  6.6 Documento completo de una cita atendida (paciente + medico + diagnostico + tratamiento + receta en un solo documento):");
printjson(clinica.citas.findOne({ _id: 1 }));

print("\n  6.7 Conteo de citas por estado:");
mostrarTabla(
  clinica.citas.aggregate([
    { $group: { _id: "$estado", total: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]),
  ["_id", "total"]
);

/* =====================================================================
   7. CRUD - UPDATE
   ===================================================================== */
titulo("7. CRUD: UPDATE (updateOne / updateMany / $set / $inc / $push / $pull / replaceOne)");

var resTel = clinica.pacientes.updateOne(
  { _id: 121 },
  { $set: { telefono: "+56987654321", direccion: "Av. Los Aromos 1550, Santiago" } }
);
print("  updateOne paciente 121 -> coincidencias: " + resTel.matchedCount + ", modificados: " + resTel.modifiedCount);

var resHist = clinica.pacientes.updateOne(
  { _id: 1 },
  { $push: { historial_medico: {
      id_historial: 1001,
      fecha_registro: fecha(2026, 11, 10),
      observaciones: "Control anual: paciente estable, sin nuevos sintomas."
  } } }
);
print("  $push historial paciente 1 -> modificados: " + resHist.modifiedCount);

var resCitaAtendida = clinica.citas.updateOne(
  { _id: 241 },
  { $set: {
      estado: "ATENDIDA",
      diagnostico: { id_diagnostico: 241, codigo_cie: "J00", descripcion: "Rinofaringitis aguda", fecha_diagnostico: fecha(2026, 12, 15) },
      tratamiento: { id_tratamiento: 241, descripcion: "Reposo e hidratacion por 5 dias.", fecha_inicio: fecha(2026, 12, 15), fecha_fin: fecha(2026, 12, 20) },
      recetas: [{ id_receta: 241, fecha_receta: fecha(2026, 12, 15), detalle: [
          { id_medicamento: 1, nombre: "Paracetamol 500mg", dosis: "1 comprimido", frecuencia: "cada 8 horas", duracion_dias: 5, precio_unitario: 1200 }
      ] }]
  } }
);
print("  updateOne cita 241 (agregar diagnostico/tratamiento/receta) -> modificados: " + resCitaAtendida.modifiedCount);

var resStock = clinica.medicamentos.updateOne(
  { _id: 1 },
  { $inc: { stock: -5 } }
);
print("  $inc stock medicamento 1 (-5 unidades) -> modificados: " + resStock.modifiedCount + ", stock actual: " + clinica.medicamentos.findOne({ _id: 1 }).stock);

var resEstados = clinica.citas.updateMany(
  { "diagnostico.codigo_cie": "J00" },
  { $set: { "tratamiento.descripcion": "Reposo, hidratacion y control en 7 dias." } }
);
print("  updateMany tratamientos de diagnosticos J00 -> coincidencias: " + resEstados.matchedCount + ", modificados: " + resEstados.modifiedCount);

var resPushTemp = clinica.pacientes.updateOne(
  { _id: 2 },
  { $push: { historial_medico: {
      id_historial: 2002,
      fecha_registro: fecha(2026, 11, 10),
      observaciones: "Registro temporal para demostrar $pull."
  } } }
);
print("  $push registro temporal paciente 2 -> modificados: " + resPushTemp.modifiedCount);

var resPull = clinica.pacientes.updateOne(
  { _id: 2 },
  { $pull: { historial_medico: { id_historial: 2002 } } }
);
print("  $pull registro temporal paciente 2 -> modificados: " + resPull.modifiedCount);

var resReplace = clinica.medicamentos.replaceOne(
  { _id: 12 },
  { _id: 12, nombre: "Ranitidina 150mg", descripcion: "Protector gastrico (precio actualizado)", stock: 180, precio: 1950 }
);
print("  replaceOne medicamento 12 -> modificados: " + resReplace.modifiedCount);

/* =====================================================================
   8. CRUD - DELETE
   ===================================================================== */
titulo("8. CRUD: DELETE (deleteOne / deleteMany)");

var resDelPac = clinica.pacientes.deleteOne({ _id: 123 });
print("  deleteOne paciente de prueba 123 -> eliminados: " + resDelPac.deletedCount);

var resDelCitas = clinica.citas.deleteMany({ _id: { $in: [242, 243] } });
print("  deleteMany citas de prueba 242 y 243 -> eliminadas: " + resDelCitas.deletedCount);

var resDelCitaFinal = clinica.citas.deleteOne({ _id: 241 });
print("  deleteOne cita de prueba 241 -> eliminados: " + resDelCitaFinal.deletedCount);

var resDelPacPrueba = clinica.pacientes.deleteMany({ _id: { $in: [121, 122] } });
print("  deleteMany pacientes de prueba 121 y 122 -> eliminados: " + resDelPacPrueba.deletedCount);

var resDelMed = clinica.medicamentos.deleteOne({ _id: 900 });
print("  deleteOne medicamento inexistente 900 -> eliminados: " + resDelMed.deletedCount);

/* =====================================================================
   9. CONSULTAS DE AGREGACION (reportes de gestion)
   ===================================================================== */
titulo("9. AGREGACIONES Y REPORTES DE GESTION");

print("\n  9.1 Citas por medico:");
mostrarTabla(
  clinica.citas.aggregate([
    { $group: { _id: { nombre: "$medico.nombre", apellido: "$medico.apellido", especialidad: "$medico.especialidad" }, total: { $sum: 1 } } },
    { $sort: { total: -1, "_id.apellido": 1 } }
  ]),
  ["_id.nombre", "_id.apellido", "_id.especialidad", "total"]
);

print("\n  9.2 Citas por especialidad:");
mostrarTabla(
  clinica.citas.aggregate([
    { $group: { _id: "$medico.especialidad", total: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]),
  ["_id", "total"]
);

print("\n  9.3 Diagnosticos mas frecuentes:");
mostrarTabla(
  clinica.citas.aggregate([
    { $match: { diagnostico: { $ne: null } } },
    { $group: { _id: { codigo: "$diagnostico.codigo_cie", descripcion: "$diagnostico.descripcion" }, total: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 }
  ]),
  ["_id.codigo", "_id.descripcion", "total"]
);

print("\n  9.4 Pacientes con mas citas:");
mostrarTabla(
  clinica.citas.aggregate([
    { $group: { _id: { id: "$paciente.id_paciente", nombre: "$paciente.nombre", apellido: "$paciente.apellido" }, total: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 5 }
  ]),
  ["_id.id", "_id.nombre", "_id.apellido", "total"]
);

print("\n  9.5 Medicamentos con stock bajo (menos de 250 unidades):");
mostrarTabla(
  clinica.medicamentos.find({ stock: { $lt: 250 } }, { nombre: 1, stock: 1, precio: 1 }).sort({ stock: 1 }),
  ["_id", "nombre", "stock", "precio"]
);

print("\n  9.6 Monto potencial de las recetas por medicamento:");
mostrarTabla(
  clinica.citas.aggregate([
    { $unwind: "$recetas" },
    { $unwind: "$recetas.detalle" },
    { $group: {
        _id: "$recetas.detalle.nombre",
        unidades: { $sum: 1 },
        monto_potencial: { $sum: { $multiply: ["$recetas.detalle.precio_unitario", "$recetas.detalle.duracion_dias"] } }
    } },
    { $sort: { monto_potencial: -1 } },
    { $limit: 5 }
  ]),
  ["_id", "unidades", "monto_potencial"]
);

print("\n  9.7 Ocupacion por consultorio:");
mostrarTabla(
  clinica.citas.aggregate([
    { $group: { _id: { consultorio: "$consultorio.nombre", ubicacion: "$consultorio.ubicacion" }, total: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]),
  ["_id.consultorio", "_id.ubicacion", "total"]
);

/* =====================================================================
   10. RESUMEN FINAL
   ===================================================================== */
titulo("10. RESUMEN FINAL DE LA BASE DE DATOS");
contar("especialidades");
contar("consultorios");
contar("medicos");
contar("pacientes");
contar("medicamentos");
contar("citas");
print("  Citas ATENDIDAS:  " + clinica.citas.countDocuments({ estado: "ATENDIDA" }));
print("  Citas PROGRAMADAS: " + clinica.citas.countDocuments({ estado: "PROGRAMADA" }));
print("  Citas CANCELADAS: " + clinica.citas.countDocuments({ estado: "CANCELADA" }));
print("  Citas NO_ASISTIO: " + clinica.citas.countDocuments({ estado: "NO_ASISTIO" }));
print("  Documentos totales: " + clinica.stats().objects);
print("\n  Script EP3 ejecutado correctamente.");
