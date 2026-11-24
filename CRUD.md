# CRUD demostrado — Clínica en MongoDB

Las cuatro operaciones se ejecutaron con `BD_Clinica_MongoDB_EP3.js`. La salida completa está en `Evidencia_Ejecucion_EP3.txt` (secciones 5 a 8, líneas 34–175), generada con `mongosh`.

## Create — insertar documentos (sección 5)

```javascript
// Un paciente
clinica.pacientes.insertOne({
  _id: 121, rut: "20000121-4", nombre: "Teresa", apellido: "Antipan",
  sexo: "F", historial_medico: [...]
});

// Varios pacientes de una vez
clinica.pacientes.insertMany([ { _id: 122, ... }, { _id: 123, ... } ]);

// Una cita
clinica.citas.insertOne({ _id: 241, estado: "PROGRAMADA", ... });
```

Resultado:

```
insertOne paciente -> _id insertado: 121
insertMany pacientes -> documentos insertados: 2
insertOne cita -> _id insertado: 241
insertMany citas de prueba -> documentos insertados: 2
```

## Read — leer documentos (sección 6)

```javascript
// Ficha con historial embebido (proyección)
clinica.pacientes.findOne({ _id: 1 }, { nombre: 1, apellido: 1, historial_medico: 1 });

// Citas por apellido, ordenadas y limitadas
clinica.citas.find({ "paciente.apellido": "Antipan" },
                   { fecha_cita: 1, estado: 1 })
       .sort({ fecha_cita: -1 }).limit(5);

// Diagnósticos dentro de una lista
clinica.citas.find({ "diagnostico.codigo_cie": { $in: ["I10", "E11.9"] } });

// Cita completa en un solo documento, sin JOIN
clinica.citas.findOne({ _id: 1 });
```

Resultados:

```
Ficha de paciente con historial_medico embebido.
Total con receta: 96
Citas ATENDIDA | 144, PROGRAMADA | 49, CANCELADA | 26, NO_ASISTIO | 24
```

## Update — actualizar documentos (sección 7)

```javascript
// Cambiar campos
clinica.pacientes.updateOne({ _id: 121 }, { $set: { telefono: "+56987654321" } });

// Agregar al historial
clinica.pacientes.updateOne({ _id: 1 },
  { $push: { historial_medico: { id_historial: 1001, ... } } });

// Completar una cita: diagnóstico, tratamiento y receta
clinica.citas.updateOne({ _id: 241 }, { $set: { estado: "ATENDIDA", diagnostico: {...}, ... } });

// Descontar stock
clinica.medicamentos.updateOne({ _id: 1 }, { $inc: { stock: -5 } });

// Actualización masiva
clinica.citas.updateMany({ "diagnostico.codigo_cie": "J00" },
                         { $set: { "tratamiento.descripcion": "..." } });
```

Resultado:

```
updateOne paciente 121 -> coincidencias: 1, modificados: 1
$push historial paciente 1 -> modificados: 1
updateOne cita 241 (diagnostico/tratamiento/receta) -> modificados: 1
$inc stock medicamento 1 (-5 unidades) -> modificados: 1, stock actual: 495
updateMany tratamientos J00 -> coincidencias: 25, modificados: 25
$pull registro temporal paciente 2 -> modificados: 1
replaceOne medicamento 12 -> modificados: 1
```

## Delete — eliminar documentos (sección 8)

```javascript
clinica.pacientes.deleteOne({ _id: 123 });
clinica.citas.deleteMany({ _id: { $in: [242, 243] } });
clinica.medicamentos.deleteOne({ _id: 900 });
```

Resultado:

```
deleteOne paciente de prueba 123 -> eliminados: 1
deleteMany citas de prueba 242 y 243 -> eliminadas: 2
deleteOne cita de prueba 241 -> eliminados: 1
deleteMany pacientes de prueba 121 y 122 -> eliminados: 2
deleteOne medicamento inexistente 900 -> eliminados: 0
```

## Dónde ver cada operación

| Lugar | Ubicación |
|---|---|
| Script | Bloques 5 a 8 (`BD_Clinica_MongoDB_EP3.js`, líneas 550–742) |
| Evidencia | `Evidencia_Ejecucion_EP3.txt`, secciones 5 a 8 |
| Informe | `Informe_EvaluacionParcial3_Clinica.pdf`, sección de manipulación CRUD |
| Presentación | `Presentacion_Clinica_EP3.pdf`, diapositivas 12 y 13 |

Para reproducir todo desde cero:

```bash
mongosh --file BD_Clinica_MongoDB_EP3.js
```
