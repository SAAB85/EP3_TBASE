# EP3 — Taller de Base de Datos (BDY1103)

**Diseño e implementación de un modelo de datos No Relacional — Clínica**

- Estudiante: Sebastián Antipán
- Sección: 005V · 2026-2
- Evaluación Parcial 3 · 30% de la asignatura

## Descripción

El caso semestral (una clínica) se rediseña desde el modelo relacional de Oracle (12 tablas) a un modelo documental en MongoDB (6 colecciones), implementado con operaciones CRUD y agregaciones.

## CRUD demostrado

Ver [`CRUD.md`](CRUD.md): las cuatro operaciones (Create, Read, Update, Delete) con el código ejecutado y sus resultados. La salida completa está en `Evidencia_Ejecucion_EP3.txt`.

## Contenido del repositorio

| Archivo | Descripción |
|---|---|
| `CRUD.md` | Guía del CRUD: Create, Read, Update y Delete con código y resultados |
| `BD_Clinica_MongoDB_EP3.js` | Script reproducible que crea la base `clinica` desde cero: colecciones con validación `$jsonSchema`, 13 índices, carga de datos, CRUD y reportes |
| `Evidencia_Ejecucion_EP3.txt` | Salida completa de `mongosh` al ejecutar el script |
| `Informe_EvaluacionParcial3_Clinica.pdf` / `.docx` | Informe de la evaluación: contexto, diferencias relacional vs NoSQL, modelo, CRUD, conclusión y anexos |
| `Presentacion_Clinica_EP3.pdf` / `.pptx` | Presentación ejecutiva (17 diapositivas, con notas del orador) |
| `LEEME.txt` | Instrucciones del paquete |

## Cómo ejecutar

Requisitos: MongoDB y mongosh.

```bash
mongosh --file BD_Clinica_MongoDB_EP3.js
```

o dentro de mongosh:

```javascript
load("BD_Clinica_MongoDB_EP3.js")
```

El script elimina y recrea la base `clinica`. Al finalizar imprime `Script EP3 ejecutado correctamente.`

## Resultado esperado

- 6 colecciones, 13 índices y 398 documentos
- 120 pacientes y 240 citas
- CRUD demostrado y 7 reportes de gestión

## Modelo

12 tablas relacionales → 6 colecciones (`pacientes`, `medicos`, `citas`, `medicamentos`, `especialidades`, `consultorios`). La colección `citas` es el documento central: embebe diagnóstico, tratamiento y recetas, y guarda un snapshot de paciente, médico y consultorio.
