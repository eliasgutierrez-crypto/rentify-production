# Rentify

Rentify es una aplicación web académica para descubrir y administrar inmuebles en renta en Guadalajara, Jalisco. La plataforma conecta a personas que buscan vivienda con propietarios y permite publicar inmuebles, gestionar solicitudes y visitas, revisar documentos y moderar publicaciones.

> **Contexto académico:** Universidad de Guadalajara, Centro Universitario de Ciencias Exactas e Ingenierías (CUCEI), Ingeniería en Computación.

## Contenido

- [Objetivo y alcance](#objetivo-y-alcance)
- [Funciones](#funciones)
- [Roles y permisos](#roles-y-permisos)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Requisitos](#requisitos)
- [Matriz de requisitos](#matriz-de-requisitos)
- [Operación y verificación de requisitos no funcionales](#operación-y-verificación-de-requisitos-no-funcionales)
- [Configuración local](#configuración-local)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Base de datos y datos de demostración](#base-de-datos-y-datos-de-demostración)
- [Supabase Storage y documentos](#supabase-storage-y-documentos)
- [Cuentas de demostración](#cuentas-de-demostración)
- [Correo electrónico y autenticación](#correo-electrónico-y-autenticación)
- [Comandos disponibles](#comandos-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Estado y limitaciones conocidas](#estado-y-limitaciones-conocidas)
- [Equipo](#equipo)
- [Licencia](#licencia)

## Objetivo y alcance

El proyecto proporciona un flujo de renta de principio a fin para una aplicación académica:

1. Explorar publicaciones disponibles y consultar los detalles de un inmueble.
2. Registrarse e iniciar sesión con una cuenta de Rentify.
3. Publicar y administrar inmuebles como propietario.
4. Enviar solicitudes de renta o proponer visitas presenciales o virtuales.
5. Revisar solicitudes, visitas, documentos y actividad desde el dashboard.
6. Moderar publicaciones, documentos, reportes y cuentas desde el panel de administración.

El producto está orientado a Guadalajara y su zona metropolitana. No procesa pagos ni sustituye un contrato de arrendamiento; las solicitudes de la aplicación son herramientas de contacto y gestión.

## Alcance del producto escolar

Rentify es un prototipo académico ejecutable localmente. Su objetivo es demostrar los flujos principales, no operar como intermediario inmobiliario ni garantizar transacciones reales. No cobra rentas o depósitos, genera contratos, ofrece custodia de fondos, chat, avisos por SMS ni envío de alertas operativas por email.

Para trabajar en local no hace falta comprar un dominio: `NEXT_PUBLIC_APP_URL` puede ser `http://localhost:3000`. Sí se necesita configurar PostgreSQL y un proyecto de Supabase para Auth y Storage; la confirmación y recuperación de contraseña dependen de que Supabase pueda entregar sus correos a la dirección de prueba.

## Funciones

### Exploración de inmuebles

- Página principal con acceso al catálogo.
- Filtros de catálogo por ubicación, tipo, precio mínimo/máximo, habitaciones, baños, amenidades y reglas de mascotas/niños.
- Ordenamiento y vistas de catálogo en cuadrícula, lista y mapa.
- Página de detalle con fotografías, descripción, renta, depósito, reglas, amenidades, condiciones y mapa cuando hay coordenadas.
- Los datos directos de contacto de ambas partes solo se muestran después de aprobarse una solicitud. Antes de eso, se puede solicitar una visita y consultar el estado desde el dashboard.
- Calificaciones de inmuebles basadas en evaluaciones de experiencias de renta finalizadas.
- Opción para reportar una publicación.

### Cuentas y perfil

- Registro, inicio y cierre de sesión.
- El registro solicita teléfono y estado de residencia; la foto de perfil es opcional y se agrega mediante una URL.
- Restablecimiento de contraseña mediante un enlace temporal.
- Edición de datos de perfil, cambio de contraseña y gestión de referencias de renta.
- Roles independientes de propietario e inquilino: una cuenta puede tener ambos perfiles.
- Carga y seguimiento de documentos para revisión administrativa.
- Notificaciones operativas internas visibles en el dashboard; no se envían por correo.

### Publicación y renta

- Creación y edición de inmuebles y sus publicaciones.
- Administración de precio de renta, depósito, descripción, reglas, fotografías por URL, amenidades, servicios y plazo mínimo.
- Las publicaciones nuevas quedan pendientes de revisión. Un administrador puede aprobarlas o rechazarlas con motivo; el propietario puede corregir y reenviar una publicación rechazada. Las publicaciones existentes conservan su estado.
- Cambio del estado de inventario entre disponible, en negociación, rentado y pausado. El borrado retira la publicación del catálogo y del dashboard, conservando los registros relacionados.
- Solicitudes de renta que el propietario puede revisar, aprobar o rechazar.
- Agendamiento de visitas presenciales o por videollamada; los propietarios configuran franjas semanales. El sistema revisa disponibilidad y conflictos, pero no genera el enlace de videollamada.
- Dashboard del inquilino con solicitudes, visitas y rentas activas; dashboard del propietario con estado del inventario, solicitudes, rentas y visitas recibidas.
- Evaluaciones asociadas a rentas finalizadas. El inmueble recibe una calificación general; la calificación del propietario promedia atención, mantenimiento y cumplimiento, y la del inquilino promedia puntualidad, cuidado e higiene.

### Administración

- Moderación: aprobar/rechazar publicaciones pendientes, suspender/reactivar publicaciones activas y retirar publicaciones.
- Verificación: revisar y aprobar o rechazar documentos.
- Reportes: resolver o descartar reportes recibidos.
- Cuentas: bloquear y desbloquear usuarios.
- Registro de acciones de moderación y motivos de suspensión/rechazo en los datos correspondientes.

## Roles y permisos

| Rol/perfil | Responsabilidades principales |
| --- | --- |
| Visitante | Explorar las páginas públicas y consultar propiedades. |
| Usuario registrado | Administrar su perfil y documentos; consultar notificaciones internas, enviar solicitudes y agendar visitas. |
| Inquilino | Gestionar solicitudes de renta y participar en visitas y evaluaciones asociadas a una renta. |
| Propietario | Publicar y administrar sus inmuebles y atender solicitudes recibidas. |
| Administrador | Moderar publicaciones, verificar documentos, atender reportes y gestionar bloqueos de usuarios. |

Una cuenta puede ser propietaria e inquilina al mismo tiempo. El perfil se crea cuando se necesita; por ejemplo, algunas acciones crean el perfil de inquilino automáticamente si todavía no existe.

Las rutas `/dashboard` y `/perfil` requieren sesión. La administración no depende únicamente de ocultar una pantalla: las acciones administrativas verifican el rol en el servidor antes de modificar información.

### Ciclo de una publicación

1. El propietario captura la información y agrega al menos una URL de imagen.
2. La publicación se guarda como `pendiente_revision` y no aparece en el catálogo público.
3. Un administrador la aprueba o la rechaza con un motivo desde `/dashboard/admin`.
4. Si se aprueba, cambia a `activa` y aparece en búsqueda. Si se rechaza, el propietario ve el motivo en su dashboard, edita y guarda para volver a enviarla a revisión.
5. Las publicaciones que ya estaban activas antes de este flujo no se cambian retroactivamente.

La aprobación de una publicación es independiente de la verificación de identidad o del documento de propiedad. Cada verificación se refleja con su propio estado; no se debe interpretar como validación legal integral del anuncio.

### Privacidad de contacto

- La ficha pública no publica el correo ni el teléfono del propietario.
- Cuando el propietario aprueba la solicitud, el inquilino solicitante ve sus datos de contacto en la ficha.
- El propietario ve el correo y teléfono del solicitante en la solicitud aprobada de su dashboard.
- Las solicitudes pendientes no incluyen esos datos en los props enviados al componente del navegador.

Estos datos permiten que las partes coordinen directamente después de aceptar la solicitud. Rentify no proporciona chat ni mediación de mensajes.

## Rutas de la aplicación

| Ruta | Uso |
| --- | --- |
| `/` | Página principal. |
| `/propiedades` | Catálogo y búsqueda de publicaciones. |
| `/propiedad/[id]` | Detalle de una publicación, solicitud/visita y reporte. |
| `/guia` | Guía informativa sobre Guadalajara. |
| `/login` | Inicio de sesión. |
| `/registro` | Registro de cuenta. |
| `/recuperar` | Solicitud de recuperación de contraseña. |
| `/restablecer` | Formulario para establecer una contraseña nueva desde el enlace de Supabase Auth. |
| `/restablecer/[token]` | Ruta heredada que redirige a `/recuperar`; el flujo vigente usa `/restablecer`. |
| `/seguridad` | Información de seguridad. |
| `/perfil` | Datos, seguridad, referencias y documentos de la cuenta autenticada. |
| `/dashboard` | Panel principal de usuario; cambia según su información y roles. |
| `/dashboard/publicar` | Formulario para publicar un inmueble. |
| `/dashboard/editar-propiedad/[id]` | Edición de una propiedad propia. |
| `/dashboard/evaluaciones` | Evaluaciones relacionadas con la experiencia de renta. |
| `/dashboard/admin` | Panel administrativo. |

La interfaz está en español. Las rutas dinámicas usan el identificador de la publicación, inmueble o token correspondiente.

## Tecnologías y arquitectura

| Área | Tecnología | Uso |
| --- | --- | --- |
| Aplicación web | Next.js 16 App Router | Rutas, renderizado y funciones de servidor. |
| Interfaz | React 19 y TypeScript | Componentes y lógica de interfaz tipada. |
| Estilos | Tailwind CSS 4 | Estilos y diseño adaptable. |
| Mutaciones | Next.js Server Actions | Operaciones de autenticación, perfil, propiedades, solicitudes y administración. |
| Persistencia | PostgreSQL | Base de datos relacional. |
| ORM | Prisma 6 | Modelos, consultas y migraciones. |
| Autenticación | Supabase Auth y `@supabase/ssr` | Sesiones seguras, confirmación de correo, recuperación y cambio de contraseña. |
| Contraseñas | Supabase Auth y `bcryptjs` | Supabase gestiona las credenciales; bcrypt mantiene compatibilidad durante la vinculación de cuentas existentes. |
| Correo | Supabase Auth | Confirmación y recuperación de cuenta mediante correo de autenticación de Supabase. Los avisos operativos se guardan y muestran dentro de Rentify. |
| Archivos | Supabase Storage | Archivos de documentos subidos por usuarios. |
| Mapas | Leaflet y React Leaflet | Ubicación de inmuebles con coordenadas. |
| Iconografía | Lucide React | Iconos de la interfaz. |

### Organización de una operación

- Las páginas de `src/app` representan las rutas del App Router.
- Las operaciones que cambian datos se agrupan como Server Actions en `src/app/actions`.
- `src/lib/auth.ts` valida la sesión con Supabase y vincula la identidad autenticada con el perfil Prisma.
- `src/lib/supabase-server.ts` y `src/lib/supabase-client.ts` crean clientes Supabase con cookies SSR.
- `src/lib/supabase-admin.ts` limita las operaciones privilegiadas de Storage al servidor.
- `src/lib/prisma.ts` comparte el cliente de Prisma durante el desarrollo para reducir conexiones durante las recargas.
- `src/lib/disponibilidad-visitas.ts` valida disponibilidad y conflictos de agenda; `src/lib/notificaciones.ts` registra avisos internos.
- `src/lib/ubicacion-publica.ts` deriva una zona aproximada y redondea las coordenadas enviadas a las páginas públicas.
- `src/lib/estados-mexico.ts` centraliza los estados disponibles para el registro.
- `src/proxy.ts` actualiza las cookies y protege rutas privadas; cada Server Action vuelve a comprobar la identidad y los permisos.
- Las mutaciones revalidan las rutas afectadas para refrescar el contenido del dashboard y de las páginas públicas.

## Modelo de datos

El esquema está en [`prisma/schema.prisma`](./prisma/schema.prisma). Sus entidades principales son:

| Área | Modelos | Descripción |
| --- | --- | --- |
| Cuentas y roles | `Usuario`, `Propietario`, `Inquilino`, `Administrador`, `ReferenciaRenta` | Identidad, estado, datos de cuenta, perfiles y referencias de renta. |
| Inmuebles y publicaciones | `Inmueble`, `Publicacion`, `Foto`, `Caracteristica`, `InmuebleCaracteristica`, `Resena` | Datos físicos del inmueble, anuncio, imágenes, amenidades y reseñas. |
| Documentos | `Documento`, `Verificacion` | Archivos enviados y decisiones de revisión administrativa. |
| Solicitudes y visitas | `SolicitudRenta`, `Visita`, `ExperienciaRenta`, `Evaluacion` | Solicitud, agenda de visitas y evaluaciones vinculadas a una experiencia de renta. |
| Actividad y moderación | `Notificacion`, `Reporte`, `Moderacion` | Avisos internos, reportes de publicaciones y acciones administrativas. |

Los estados de roles, publicaciones, solicitudes y documentos se guardan como cadenas en el esquema. Estados de publicación usados por la aplicación: `pendiente_revision`, `activa`, `rechazada`, `suspendida` y `eliminada`. El estado del inventario es independiente: `disponible`, `en_negociacion`, `rentado` o `pausado`. Las evaluaciones de propietario e inquilino guardan tres criterios de 1 a 5 y calculan el promedio por evaluación; las evaluaciones antiguas sin criterios conservan su calificación general. Las relaciones y eliminaciones en cascada se definen en Prisma; consulta el esquema y las migraciones para conocer la estructura exacta vigente.

## Matriz de requisitos

Esta matriz describe lo que hace el código del repositorio. “Configuración externa” significa que el código no puede garantizar por sí solo el servicio, la disponibilidad o los permisos del proveedor.

| ID | Estado | Implementación / límite conocido |
| --- | --- | --- |
| RF01 | Implementado | Inicio con correo y contraseña mediante Supabase Auth. |
| RF02 | Implementado con dependencia externa | Solicitud de enlace y cambio de contraseña; el envío requiere que el proveedor Auth entregue el correo. |
| RF03 | Implementado | Cookies SSR de Supabase y acción explícita de cierre de sesión. |
| RF04 | Implementado | Registro, perfil y carga de documentos personales para revisión manual. |
| RF05 | Implementado | Referencias, verificación e historial de experiencias se muestran al propietario que revisa una solicitud. |
| RF06 | Implementado | El dashboard del inquilino muestra solicitudes, visitas y rentas activas. No se genera un contrato legal. |
| RF07 | Implementado | El propietario adjunta documentos del inmueble; un administrador los aprueba o rechaza. Esto no sustituye una validación ante autoridades. |
| RF08 | Implementado | El propietario aprueba o rechaza solicitudes de renta. |
| RF09 | Implementado | El dashboard del propietario resume estados del inventario y visitas recibidas, además de mostrar las listas de actividad. |
| RF10 | Implementado | Las publicaciones nuevas esperan aprobación administrativa; el admin puede rechazar con motivo, suspender, reactivar o retirar. Las publicaciones existentes conservan su estado. |
| RF11 | Implementado | El panel administrativo revisa documentos privados mediante enlaces firmados de cinco minutos. |
| RF12 | Implementado | Reportes, resolución, bloqueo y desbloqueo administrativo de cuentas. |
| RF13 | Implementado | Búsqueda por precio, ubicación, tipo, habitaciones, baños, amenidades y reglas. |
| RF14 | Implementado | Ficha con galería, características, precio, condiciones, zona y mapa aproximados; contacto directo después de aprobarse la solicitud. |
| RF15 | Implementado | Catálogo en cuadrícula, lista y mapa. |
| RF16 | Implementado con límite | Publicación de fotos mediante URLs HTTP/HTTPS, no carga directa de fotos del anuncio. Los documentos sí se cargan a Storage. |
| RF17 | Implementado | Estados del inventario disponibles en el dashboard del propietario. |
| RF18 | Implementado parcialmente | Franjas semanales, elección de fecha/hora próxima y modalidad presencial o videollamada. No hay excepciones por fecha, feriados ni creación del enlace de videollamada. |
| RF19 | Implementado | El inquilino califica el inmueble de 1 a 5 y agrega comentario al finalizar la renta. |
| RF20 | Implementado | El inquilino evalúa atención, mantenimiento y cumplimiento; el promedio de los tres es la calificación de la evaluación. |
| RF21 | Implementado | El propietario evalúa puntualidad de pagos, cuidado e higiene; el promedio de los tres es la calificación de la evaluación. |
| RF22 | Excluido por decisión del proyecto | No se envían alertas operativas por email; se muestran en Rentify. Confirmación y recuperación de cuenta sí usan correo de Supabase Auth. |
| RF23 | Implementado dentro de la app | Se crean notificaciones internas ante eventos operativos. No hay eventos de mensajería porque la aplicación no tiene chat. |
| RF24 | Excluido junto con el correo operativo | No existe configuración de preferencias de email, dado que las notificaciones operativas son internas y no se despachan por correo. |
| RNF-01 | Pendiente de medición | El formulario de documento limita el archivo a 5 MB en cliente. No hay medición que demuestre búsqueda menor a 2 s o carga menor a 3 s. |
| RNF-02 | Parcial / configuración externa | Supabase Auth gestiona credenciales y los documentos usan bucket privado previsto. HTTPS/TLS, políticas efectivas de Storage y protección de secretos dependen de la configuración de despliegue. |
| RNF-03 | No configurado en el repositorio | No hay garantía de 99% ni rutina de respaldo automático para base de datos y Storage. Deben configurarse y probarse en los proveedores elegidos. |
| RNF-04 | Parcial | Hay clases responsivas y publicar usa tres pasos. No se ha certificado accesibilidad ni se han realizado pruebas de usabilidad. |
| RNF-05 | Parcial | Rutas y acciones están separadas por dominio y este README documenta flujos y operación. No hay suite automatizada ni un módulo independiente por cada uno de los siete módulos funcionales. |

Los requisitos de servicio (tiempos, uptime, TLS, backups) requieren pruebas y configuración del entorno, no solo cambios en TypeScript. No se deben presentar como garantizados hasta tener evidencia de su medición y restauración.

## Operación y verificación de requisitos no funcionales

### Rendimiento

- **Búsqueda menor a 2 segundos:** el catálogo limita el resultado a 100 publicaciones, pero el tiempo real depende de PostgreSQL, volumen de datos, conexión y despliegue. Medir varias búsquedas con datos representativos, en frío y en caliente; registrar percentiles y no solo una petición aislada.
- **Carga de hasta 5 MB menor a 3 segundos:** el formulario de documentos comprueba tamaño en el navegador; Storage y la red controlan la duración real. Probar un archivo de 5 MB desde la red objetivo y revisar la configuración de tamaño y MIME del bucket.
- No afirmar cumplimiento de estos tiempos sin resultados medidos en el entorno que se va a evaluar. El repositorio no incluye una prueba de carga.

### Seguridad y privacidad

- Las contraseñas nuevas las administra Supabase Auth; `bcryptjs` permanece para verificar contraseñas de perfiles heredados durante la vinculación.
- Mantener `DATABASE_URL`, `DIRECT_URL` y `SUPABASE_SERVICE_ROLE_KEY` fuera del navegador y del control de versiones. La clave `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública, por lo que las políticas del bucket y la autorización del servidor siguen siendo obligatorias.
- Mantener el bucket privado y revisar sus políticas desde Supabase. Solo el administrador de Rentify debe recibir URL temporal de lectura de documentos. No usar documentos reales en una demo.
- En un despliegue, confirmar que todo el tráfico se redirija a HTTPS y que el proveedor realmente negocie TLS 1.3. El código de Next.js no instala certificados ni fuerza esa versión del protocolo.
- Las páginas públicas muestran la zona aproximada derivada de los últimos segmentos de la dirección y redondean latitud/longitud a dos decimales. El dashboard del propietario conserva la dirección capturada. La dirección debe escribirse con comas para que la zona se derive correctamente.

### Disponibilidad y respaldos

- El repositorio no configura uptime, monitoreo, backups programados ni restauración. En local, esos objetivos dependen de la computadora, PostgreSQL y el Storage usados.
- Para un despliegue, elegir una retención y frecuencia de backup para **PostgreSQL y Storage por separado**, habilitar el monitoreo que ofrezca el proveedor y definir quién recibe alertas.
- Antes de afirmar un 99% de disponibilidad, definir periodo, ventana de mantenimiento y método de medición; conservar los reportes del proveedor.
- Hacer una restauración de prueba en una base y bucket separados antes de confiar en los backups. Una copia que nunca se ha restaurado no demuestra que sea recuperable.

### Usabilidad y accesibilidad

- Publicar utiliza tres pasos; la solicitud de visita concentra la selección de fecha/hora y los datos en un diálogo. No se ha medido el requisito de cuatro pasos con usuarios.
- Verificar manualmente móvil, tableta y escritorio, además de teclado, foco, etiquetas de formularios, contraste y lector de pantalla. No hay certificación WCAG ni pruebas automáticas de accesibilidad configuradas.

### Mantenibilidad

- Los cambios de datos se agrupan por dominio en `src/app/actions`; los modelos y migraciones están en `prisma`.
- Las instrucciones de instalación, estados y límites están en este documento. Mantener README, esquema y migraciones sincronizados al cambiar flujos.
- No hay suite automatizada de pruebas; cada cambio debe pasar como mínimo la validación Prisma, TypeScript, lint y build descritas abajo, más una prueba manual del flujo afectado.

## Requisitos

- Node.js 20.9 o posterior.
- npm.
- PostgreSQL accesible desde la aplicación.
- Proyecto de Supabase para Auth y Storage.
- Conexión a Internet para acceder a las dependencias, recursos externos de imágenes y servicios de Supabase.

## Configuración local

1. Clona el repositorio y entra al directorio de la aplicación:

   ```bash
   git clone https://github.com/Ing-Soft-Inmuebles-tripartita/Rentify.git
   cd rentify
   ```

   Si ya tienes el repositorio, cambia a la carpeta `rentify` que contiene `package.json`.

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` a `.env` en la carpeta donde está `package.json` y completa las variables descritas en [Variables de entorno](#variables-de-entorno). No compartas ni subas `.env` al repositorio.

4. Aplica las migraciones existentes en una base local o de desarrollo:

   ```bash
   npx prisma migrate dev
   ```

5. (Opcional) Carga los datos de demostración en una base local o desechable:

   ```bash
   npm run db:seed
   ```

   **El seed elimina primero los datos de las tablas de Rentify y los vuelve a crear. No lo ejecutes en una base con datos que deban conservarse.**

6. Configura el bucket de Storage (consulta [Supabase Storage y documentos](#supabase-storage-y-documentos)).

7. Inicia Next.js en modo de desarrollo:

   ```bash
   npm run dev
   ```

8. Abre [http://localhost:3000](http://localhost:3000).

Para comprobar la aplicación antes de desplegar, ejecuta el lint, la comprobación de tipos y el build indicados en [Comandos disponibles](#comandos-disponibles).

## Variables de entorno

Define estas variables en `.env` en la raíz de la aplicación. La plantilla sin secretos está en [`.env.example`](./.env.example):

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | URL de conexión PostgreSQL usada por Prisma en tiempo de ejecución. |
| `DIRECT_URL` | Sí | URL de conexión directa que Prisma usa para operaciones de migración. |
| `NEXT_PUBLIC_APP_URL` | Recomendada en despliegue | URL pública del sitio, usada en los enlaces de confirmación y recuperación. En Vercel, si falta o apunta a localhost, se usa el dominio del despliegue; en local puede ser `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública anon/publishable del proyecto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí para revisión de documentos | Clave privada usada únicamente en el servidor para generar enlaces temporales de lectura. Nunca debe exponerse al navegador. |
| `PRISMA_LOG_QUERIES` | No | Si vale exactamente `true`, Prisma registra consultas además de advertencias y errores. |

Ejemplo de formato, usando valores propios:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USUARIO:CONTRASENA@HOST:5432/postgres"
NEXT_PUBLIC_APP_URL="https://rentify.tu-dominio.com"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT-REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="CLAVE-PUBLICA-ANON"
SUPABASE_SERVICE_ROLE_KEY="CLAVE-PRIVADA-SOLO-SERVIDOR"
PRISMA_LOG_QUERIES="false"
```

Los puertos y parámetros dependen de tu proveedor. Si usas Supabase, utiliza la URL de pool para `DATABASE_URL` cuando corresponda y una conexión directa para `DIRECT_URL`. Codifica caracteres especiales de la contraseña según el formato de URL. No copies credenciales reales a documentación, issues o commits. La clave service role es privada y la clave anon/publishable de Supabase es pública por diseño, pero no sustituye las políticas de acceso.

## Despliegue en Vercel

1. Importa el repositorio en Vercel y configura **Root Directory** como `rentify`, el directorio que contiene `package.json`. No hace falta comprar un dominio propio para una demostración: se puede usar el dominio asignado por la plataforma, si está disponible para el proyecto.
2. Agrega en las variables de entorno de Vercel todas las variables marcadas como obligatorias en la tabla anterior. Configúralas para los entornos que vayas a utilizar (Preview y Production); no conectes Preview a una base de producción. Define `NEXT_PUBLIC_APP_URL` con el dominio público estable de Production (por ejemplo, `https://rentify.vercel.app`); si falta o conserva `http://localhost:3000`, la aplicación usa el dominio de Vercel automáticamente.
3. En Supabase Auth, establece como **Site URL** el dominio público final y agrega `https://TU-DOMINIO/auth/callback` a **Redirect URLs**. Para despliegues de Preview, permite explícitamente los dominios de Preview necesarios; Supabase debe aceptar la URL de callback que Vercel genere.
4. Antes de recibir tráfico con el nuevo esquema, ejecuta `npx prisma migrate deploy` con las variables de base de datos del entorno de destino. Haz una copia de seguridad y revisa el estado de migraciones primero; no ejecutes `migrate dev` en producción.
5. Despliega desde Vercel. El comando `npm run build` genera el cliente Prisma y después compila Next.js; no aplica migraciones ni ejecuta el seed.
6. Prueba registro, confirmación, inicio de sesión, recuperación, lectura/escritura autorizada de Storage y una acción operativa.

Mantén `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` y `DIRECT_URL` como secretos del servidor. Nunca publiques `.env`, ejecutes el seed en producción ni expongas documentos reales durante las pruebas.

## Base de datos y datos de demostración

Las migraciones versionadas están en `prisma/migrations/`. La configuración de Prisma define PostgreSQL y lee `DATABASE_URL` y `DIRECT_URL` desde el entorno.

La migración `20261111201500_aprobacion_y_criterios_evaluacion` agrega el motivo de rechazo de publicaciones y los criterios de evaluación. Para probarla, confirma primero que `.env` apunta a una base local o de pruebas y ejecuta `npx prisma migrate deploy`. No se ha aplicado automáticamente a ninguna base. Antes de usarla en otro entorno, revisa el destino y el respaldo disponible; no uses `migrate dev` en producción.

```bash
# Crear una migración nueva y aplicarla en desarrollo
npx prisma migrate dev --name nombre_del_cambio

# Aplicar migraciones ya creadas en un entorno de despliegue
npx prisma migrate deploy

# Comprobar el esquema
npx prisma validate

# Regenerar el cliente si se requiere
npx prisma generate
```

El seed crea usuarios, perfiles, amenidades, inmuebles, publicaciones, fotos, reseñas y registros de ejemplo para probar solicitudes, visitas, reportes, documentos, notificaciones y experiencias de renta. El script está en [`prisma/seed.ts`](./prisma/seed.ts) y borra primero los registros existentes de las tablas que utiliza.

El seed crea perfiles de Rentify en PostgreSQL, **no identidades de Supabase Auth**. Para iniciar sesión como una cuenta sembrada, crea la identidad correspondiente en **Supabase → Authentication → Users** (por ejemplo, con auto-confirmación en una base de pruebas) usando el mismo correo y contraseña. Al autenticarse, Rentify vincula esa identidad con el perfil existente por correo. Las cuentas y contraseñas conocidas son solo para pruebas locales.

## Supabase Storage y documentos

1. Crea un bucket llamado `rentify` en el proyecto Supabase configurado.
2. Configura el bucket como **privado**, el límite de tamaño del bucket en 5 MB y los tipos permitidos en PDF, JPEG y PNG. La validación del formulario ayuda a la experiencia, pero los límites del bucket son necesarios porque las validaciones del navegador se pueden omitir.
3. La aplicación carga archivos bajo `documentos/{auth.uid()}/` y guarda solo la ruta del objeto, no una URL, en PostgreSQL.
4. Crea una política de inserción para que cada usuario autenticado solo pueda cargar archivos en su propia carpeta. Por ejemplo:

   ```sql
   create policy "Users upload documents to their own folder"
   on storage.objects for insert to authenticated
   with check (
     bucket_id = 'rentify'
     and (storage.foldername(name))[1] = 'documentos'
     and (storage.foldername(name))[2] = auth.uid()::text
   );
   ```

5. No crees políticas públicas de lectura ni de lectura para el rol `authenticated`. El panel administrativo usa `SUPABASE_SERVICE_ROLE_KEY`, solo en servidor, para generar enlaces firmados que expiran en cinco minutos.
6. La acción de servidor comprueba que la ruta pertenezca a la carpeta del usuario y que la extensión sea permitida antes de registrar el documento. La política y el límite de tamaño/MIME del bucket también deben estar activos en Supabase.

No habilites lectura pública ni expongas la clave service role al navegador. Actualmente el usuario puede consultar el estado de revisión, pero no descargar el documento desde su perfil. Si en el futuro se agrega esa función, implementar una autorización y una URL firmada limitada al propietario.

## Cuentas de demostración

El seed asigna la contraseña `test123` a las cuentas que crea:

| Correo | Perfiles |
| --- | --- |
| `carlos@rentify.com` | Propietario. |
| `maria@rentify.com` | Propietaria. |
| `ana@rentify.com` | Inquilina y propietaria. |
| `admin@rentify.com` | Administrador y propietario. |

También se crean cuentas de ejemplo para las reseñas. Todas estas credenciales son públicas y exclusivamente para pruebas locales. Cámbialas o elimina estos datos antes de cualquier entorno accesible públicamente.

## Correo electrónico y autenticación

Rentify usa Supabase Auth para registro, inicio/cierre de sesión, confirmación de correo, recuperación y cambio de contraseña. El Proxy y las Server Actions validan las sesiones con Supabase; los perfiles y roles de la aplicación continúan en PostgreSQL mediante Prisma. Las identidades se vinculan con `Usuario.auth_user_id`.

La decisión de no pagar un dominio aplica a las **alertas operativas**: solicitudes, visitas, evaluaciones, moderación y reportes se guardan en la base de datos y se muestran en el dashboard, no se envían por correo. Esto no elimina los correos de confirmación y recuperación que pide Supabase Auth. Para usar estos dos flujos, Supabase debe poder enviar un mensaje a la dirección de prueba. En local el callback puede ser `http://localhost:3000/auth/callback`; no hace falta comprar un dominio para ese callback. La entrega depende de los límites y la configuración vigentes del proveedor Auth.

### Configurar los correos de Supabase Auth

1. En Supabase, habilita el proveedor de correo/contraseña. La confirmación antes del inicio de sesión depende de la opción de confirmación de email que configures en el proyecto Supabase.
2. En la configuración de URL de Auth, establece el Site URL correspondiente al entorno y permite explícitamente el callback local `http://localhost:3000/auth/callback`. Si después se despliega públicamente, agrega también el callback HTTPS que use ese despliegue.
3. Configura las plantillas de confirmación y recuperación para usar `{{ .ConfirmationURL }}`; comprueba que la redirección llegue a `/auth/callback` y que recuperación termine en `/restablecer`.
4. Prueba los mensajes con una cuenta de prueba propia. El proveedor predeterminado de Supabase puede tener restricciones de destinatarios y cuotas. No se garantiza entrega si no se configura un proveedor compatible. Para un entorno público, verifica las condiciones del proveedor y su dominio remitente; el proyecto no incluye ni paga un dominio o un SMTP.

Si el registro o la recuperación falla, revisa **Supabase → Authentication → Logs**. Un error `redirect_to_not_allowed` significa que falta la URL exacta de callback en **Redirect URLs**; `smtp_setup_required` o `unexpected_failure` apuntan a la configuración o límites del proveedor. La página de recuperación es `/restablecer`; el callback es `/auth/callback`.

Los eventos operativos se guardan como notificaciones internas; no hay envío, preferencias ni bandeja de correo operativo. Actualmente el dashboard muestra las cinco más recientes y no incluye acción para marcarlas como leídas.

Si el registro falla, revisa el mensaje del formulario y los eventos en **Authentication → Logs**. Un error `401` suele significar que Supabase rechazó la clave de API: comprueba que la clave pública vigente pertenezca al mismo proyecto de `NEXT_PUBLIC_SUPABASE_URL`, que no se haya usado `service_role`, y reinicia Next.js después de modificar `.env`. Un error de límite requiere esperar; un fallo de envío de confirmación requiere revisar la configuración y los límites de correo de Supabase. Las migraciones nuevas se aplican con `npx prisma migrate deploy` en la base de pruebas antes de registrar.

Las cuentas previas de Rentify se pueden vincular al iniciar sesión si su contraseña heredada es válida y su correo todavía no tiene una identidad incompatible en Supabase. La primera vinculación requiere confirmar el correo. Si Supabase ya tiene una identidad para ese correo, usa el flujo de recuperación de Supabase antes de volver a iniciar sesión.

Las sesiones y su duración se administran mediante Supabase Auth y cookies SSR; no se necesita configurar un `JWT_SECRET` propio. Un usuario bloqueado no puede usar los flujos protegidos de la aplicación ni ejecutar acciones autorizadas.

El cliente anon de Storage permite subir únicamente a `documentos/{auth.uid()}/` si se instaló la política indicada arriba. El panel de administración firma accesos privados en servidor con la service role. Mantén el bucket privado y limita su clave a entornos de servidor.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Next.js. |
| `npm run build` | Genera el cliente Prisma desde el esquema y compila la aplicación para producción. |
| `npm run start` | Servidor de producción; requiere ejecutar primero `npm run build`. |
| `npm run lint` | ESLint sobre `src` y `prisma/seed.ts`. |
| `npx tsc --noEmit` | Comprobación de tipos de TypeScript. |
| `npx prisma validate` | Validación del esquema Prisma. |
| `npx prisma generate` | Generación del cliente Prisma. |
| `npx prisma migrate dev` | Crear/aplicar migraciones en desarrollo. |
| `npx prisma migrate deploy` | Aplicar migraciones existentes en un despliegue. |
| `npm run db:seed` | Borrar y volver a cargar datos de demostración. |

### Prueba manual recomendada para la entrega

1. Confirma que las variables estén en `.env`, aplica migraciones y levanta la app con `npm run dev`.
2. Prueba registro, confirmación (si Supabase puede entregar el correo), inicio de sesión, cierre y recuperación.
3. Como propietario, crea un anuncio. Debe quedar pendiente y no aparecer en `/propiedades`.
4. Como administrador, revisa el anuncio desde `/dashboard/admin`; apruébalo y confirma que aparezca en el catálogo. Repite con otro anuncio y recházalo indicando el motivo.
5. Como propietario, revisa el motivo del rechazo, edita y guarda; debe regresar a revisión. Prueba también suspender, reactivar y retirar una publicación.
6. Desde otra cuenta, envía una solicitud y agenda una visita. Confirma que ambos dashboards muestren el evento y que el propietario pueda aprobar/rechazar la solicitud.
7. Confirma que el correo/teléfono del propietario solo aparezca al solicitante después de la aprobación, y que el contacto del solicitante solo aparezca en la solicitud aprobada del propietario.
8. Finaliza una renta, registra calificaciones de inmueble, propietario e inquilino, y revisa que los tres criterios del propietario/inquilino produzcan el promedio mostrado.
9. Sube un documento ficticio menor a 5 MB; comprueba que sea privado y que solo la vista administrativa pueda abrir su enlace firmado temporal.
10. Prueba el catálogo y los formularios en móvil y escritorio. Registra por separado los tiempos de búsqueda y carga si la rúbrica los exige.

No hay un comando ni una suite de pruebas automatizadas configurados actualmente.

## Estructura del proyecto

```text
rentify/
├── prisma/
│   ├── migrations/             Historial versionado de cambios en PostgreSQL
│   ├── schema.prisma           Modelos y relaciones de datos
│   └── seed.ts                 Datos de demostración (borra datos existentes)
├── .env.example                Plantilla local de variables sin secretos
├── public/                     Recursos estáticos
└── src/
    ├── app/
    │   ├── actions/            Server Actions por dominio
    │   ├── auth/callback/      Confirmación y recuperación de Supabase Auth
    │   ├── dashboard/          Panel usuario, publicaciones y administración
    │   ├── guia/               Guía de Guadalajara
    │   ├── login/              Inicio de sesión
    │   ├── perfil/             Perfil y carga de documentos
    │   ├── propiedad/[id]/     Detalle y acciones de una publicación
    │   ├── propiedades/        Catálogo y filtros
    │   ├── recuperar/          Solicitud de recuperación de contraseña
    │   ├── registro/            Alta de usuario
    │   ├── restablecer/         Cambio de contraseña mediante Supabase Auth
    │   └── seguridad/          Información de seguridad
    ├── components/             Componentes reutilizables de interfaz
    ├── lib/
    │   ├── auth.ts             Usuario autenticado y perfil Rentify
    │   ├── notificaciones.ts   Registro de notificaciones dentro de la aplicación
    │   ├── password.ts         Hash y verificación de contraseñas
    │   ├── prisma.ts           Cliente de base de datos
    │   ├── supabase-client.ts  Cliente Supabase Storage
    │   └── tokens.ts           Tokens y expiraciones
    └── proxy.ts                Sesión SSR y protección de rutas privadas
```

Las acciones de servidor están separadas por dominio:

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/actions/auth.ts` | Registro, login, logout y recuperación de contraseña. |
| `src/app/actions/perfil.ts` | Perfil, contraseña y documentos. |
| `src/app/actions/propiedades.ts` | Publicación de inmuebles. |
| `src/app/actions/inmuebles.ts` | Edición, estado y eliminación de inmuebles. |
| `src/app/actions/solicitudes.ts` | Solicitudes de renta y decisiones del propietario. |
| `src/app/actions/visitas.ts` | Agendamiento de visitas. |
| `src/app/actions/evaluaciones.ts` | Evaluaciones de experiencias de renta. |
| `src/app/actions/reportes.ts` | Creación de reportes. |
| `src/app/actions/admin.ts` | Moderación, verificaciones y gestión de usuarios. |

## Estado y limitaciones conocidas

- Es un proyecto académico; antes de usarlo con usuarios o documentos reales se deben revisar seguridad, privacidad, políticas de Storage, manejo de correo y operación de producción.
- No existe integración de pagos.
- No se ha probado la entrega real de correos ni todos los flujos de Supabase con credenciales de producción.
- La confirmación de correo depende de las URL permitidas, SMTP y plantillas configuradas en el proyecto Supabase.
- Los avisos de actividad se muestran en el dashboard y no se envían por email; no hay mensajería directa ni notificaciones de mensajes.
- El dashboard muestra un número limitado de notificaciones recientes; no hay una bandeja completa ni una acción para marcar cada aviso como leído.
- Los horarios de visita son una franja semanal por día de la semana; no existe calendario de excepciones, feriados ni disponibilidad por fecha.
- La foto de perfil y las fotos de publicaciones se capturan como URLs; solo los documentos de verificación usan Storage privado.
- Las cifras, calificaciones y testimonios promocionales que no provenían de datos fueron retirados de la portada y del inicio de sesión. Algunas imágenes externas de esas pantallas son ilustrativas y no representan necesariamente inmuebles publicados.
- No se ha configurado una suite de pruebas automatizadas.
- El seed es destructivo y las cuentas de prueba tienen contraseñas conocidas.
- El panel de guía contiene actualmente contenido introductorio básico.
- Para producción se requiere configurar secretos, base de datos, Storage, políticas y variables de entorno propias; no se incluye aquí una configuración de despliegue específica del proveedor.

## Equipo

- Juan Elias Gutierrez Torres — 212547129
- Samuel García Rodríguez — 223992361
- Juan Jose Maldonado Pérez — 221139866
- Oswaldo Santiago Aceves Rodriguez — 221105244

## Licencia

Proyecto académico de la Universidad de Guadalajara, 2026. No se especifica una licencia de software en este repositorio.
