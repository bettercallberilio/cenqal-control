# Evaluación intermedia CENQAL–Berilio · versión 1

Campaña `MID-2026-11-30`: lunes **30 de noviembre de 2026**, 00:00–23:59:59, zona Europe/Madrid. El mes indicado oralmente como octubre se interpretó como noviembre porque es el próximo lunes 30. Apertura y cierre se comprueban en el servidor: no requieren que la profesora abra una página ni un cron. El envío se rechaza desde el 01/12/2026 a las 00:00 peninsulares.

## Acceso y seguimiento

- Alumnado: abrir Gym desde el acceso personal existente de Berilio, luego «Cuestionario docente». Se reutiliza el token Gym vigente, limitado al alumno y al curso. El acceso a la encuesta no cambia el bot ni otorga puntos.
- Sin acceso Gym: Control → Learning Analytics → Evaluación de la experiencia → Consultar entregas → Preparar enlace personal. Entregar el enlace únicamente a su titular. No publicarlo en el grupo.
- Los alumnos solo pueden consultar su propio justificante. Reintentar no duplica ni sobrescribe respuestas. El texto libre no se guarda en el almacenamiento del navegador.
- El permiso de investigación se decide por separado. Puede retirarse entrando de nuevo con un acceso personal válido. La entrega docente se conserva.
- No hay suspensión automática ni cambios de reglas de calificación. La consideración como requisito para superar la asignatura necesita concordar con los criterios de evaluación comunicados al alumnado.

## Informes

El Excel docente añade `ENCUESTA_DATOS`, `ENCUESTA_RESUMEN`, `ENCUESTA_DICCIONARIO`, `ENCUESTA_METODO` y `ENCUESTA_ENTREGAS`. Las filas incluyen campaña, fase, versión, código CENQAL y datos PRE disponibles para ese mismo alumno y curso. La ausencia de PRE se conserva como dato ausente. No se modifica `cenqal_initial_assessments` ni se registra esta encuesta como un examen POST de conocimientos.

«Excel de investigación» es un archivo separado: incluye únicamente consentimientos afirmativos vigentes, códigos de estudio estables dentro del curso y omite texto libre y nombres. La fecha se reduce al día. El Excel general «anonimizado» también limita las nuevas hojas de encuesta a los autorizados, pero sus hojas académicas anteriores mantienen su comportamiento existente: no considerar por ello todo el libro autorizado para publicar.

## Diseño del estudio

43 variables estables cubren participación, aprendizaje percibido, tecnología, utilidad, emociones, malestar, organización, cinco ítems repetidos de autorregulación y comentarios. Responder el contenido personal es opcional; el registro de entrega y la elección del uso de datos sí requieren confirmación. «NA» y omisiones son datos ausentes; nunca equivalen a cero. Se conservan las distribuciones incluyendo «prefiero no responder» como categoría separada. No sumar dimensiones heterogéneas.

Los ítems AR01–AR05 repiten las preguntas 17–21 del formulario inicial; antes de calcular diferencias, verificar cómo el importador inicial codificó y calculó `self_regulation` y el ítem inverso AR05. El informe presenta el índice PRE original sin inventar una equivalencia con el promedio intermedio. Las preguntas nuevas carecen de PRE equivalente. La satisfacción y el aprendizaje percibido no demuestran aprendizaje real ni causalidad.

El instrumento es propio y no está validado psicométricamente. Para el congreso del 16–18 de diciembre, reportar resultados intermedios descriptivos, número de matriculados, entregas, autorizaciones y respuestas válidas por variable; detallar sesgos de no respuesta y de obligatoriedad de entrega. Antes del uso científico, concretar protocolo, información y consentimiento con la universidad, incluido el uso de registros PRE previos. La inclusión de un texto de consentimiento no sustituye esa revisión. No publicar datos individuales ni comentarios identificables, especialmente en grupos pequeños.

Para la evaluación final o próximas ediciones: crear otra campaña con fase FINAL o MID, curso y fechas propios, copiando la misma definición y versión cuando se quieran comparar iguales variables. No reutilizar la campaña intermedia ni sobrescribir sus registros. Los cambios de preguntas requieren una versión nueva y documentar qué ítems siguen siendo comparables.

## Instalación y pruebas

`install.sql` es la instalación única, aditiva y transaccional, con esquema privado, RLS, RPCs que verifican sesión y campaña y la programación del curso activo. No ejecutar de nuevo si ya está instalada. `schema.sql` es la fuente legible; `instrument-v1.json` contiene el diccionario. Ninguna tabla es accesible directamente desde el navegador. Las funciones docentes exigen la sesión de Control; las del alumno solo admiten accesos existentes de Gym o enlaces individuales limitados a la campaña.

Pruebas: `test_database.sql` verifica permisos, plazos, idempotencia, separación por campaña, rangos, consentimiento, retirada y exportación en una transacción con ROLLBACK. No deja respuestas ficticias. Las pruebas cliente se encuentran en `cenqal-gym/test_survey.cjs`; comprobar también los scripts integrados de ambos HTML.
