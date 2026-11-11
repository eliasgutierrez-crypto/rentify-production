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

## Funciones

### Exploración de inmuebles

- Página principal con acceso al catálogo.
- Filtros de catálogo por ubicación, tipo, precio mínimo/máximo, habitaciones, baños, amenidades y reglas de mascotas/niños.
- Ordenamiento y vistas de catálogo en cuadrícula, lista y mapa.
- Página de detalle con fotografías, descripción, renta, depósito, reglas, amenidades, condiciones y ubicación en mapa cuando hay coordenadas.
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
- Administración de precio de renta, depósito, descripción, reglas, fotografías, amenidades, servicios y plazo mínimo.
- Cambio del estado de inventario entre disponible, en negociación, rentado y pausado. El borrado retira la publicación del catálogo y del dashboard, conservando los registros relacionados.
- Solicitudes de renta que el propietario puede revisar, aprobar o rechazar.
- Agendamiento de visitas con fecha, hora y modalidad; los propietarios configuran los días y el horario semanal de cada inmueble.
- Dashboard con la actividad de las cuentas, propiedades y solicitudes.
- Evaluaciones asociadas a experiencias de renta.

### Administración

- Moderación: suspender, reactivar o retirar publicaciones.
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

Los estados de roles, publicaciones, solicitudes y documentos se guardan como cadenas en el esquema. Las relaciones y eliminaciones en cascada se definen en Prisma; consulta el esquema y las migraciones para conocer la estructura exacta vigente.

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

1. Importa el repositorio en Vercel y configura **Root Directory** como `rentify`, el directorio que contiene `package.json`.
2. Agrega en las variables de entorno de Vercel todas las variables marcadas como obligatorias en la tabla anterior. Configúralas para los entornos que vayas a utilizar (Preview y Production); no conectes Preview a una base de producción. Define `NEXT_PUBLIC_APP_URL` con el dominio público estable de Production (por ejemplo, `https://rentify.vercel.app`); si falta o conserva `http://localhost:3000`, la aplicación usa el dominio de Vercel automáticamente.
3. En Supabase Auth, establece como **Site URL** el dominio público final y agrega `https://TU-DOMINIO/auth/callback` a **Redirect URLs**. Para despliegues de Preview, permite explícitamente los dominios de Preview necesarios; Supabase debe aceptar la URL de callback que Vercel genere.
4. Antes de recibir tráfico con el nuevo esquema, ejecuta `npx prisma migrate deploy` con las variables de base de datos del entorno de destino. Haz una copia de seguridad y revisa el estado de migraciones primero; no ejecutes `migrate dev` en producción.
5. Despliega desde Vercel. El comando `npm run build` genera el cliente Prisma y después compila Next.js; no aplica migraciones ni ejecuta el seed.
6. Prueba registro, confirmación, inicio de sesión, recuperación, lectura/escritura autorizada de Storage y una acción operativa.

Mantén `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` y `DIRECT_URL` como secretos del servidor. Nunca publiques `.env`, ejecutes el seed en producción ni expongas documentos reales durante las pruebas.

## Base de datos y datos de demostración

Las migraciones versionadas están en `prisma/migrations/`. La configuración de Prisma define PostgreSQL y lee `DATABASE_URL` y `DIRECT_URL` desde el entorno.

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
2. Configura el bucket como **privado**. La aplicación carga archivos bajo `documentos/{auth.uid()}/` y guarda solo la ruta del objeto, no un enlace público o firmado, en PostgreSQL.
3. El formulario acepta PDF, JPG y PNG, con un límite de 5 MB por archivo.
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

5. Los documentos aparecen como pendientes para revisión administrativa. El servidor usa `SUPABASE_SERVICE_ROLE_KEY` para generar enlaces firmados de cinco minutos en el panel de revisión.

No habilites lectura pública, y no expongas la clave service role al navegador. Si agregas operaciones de descarga para los usuarios, crea políticas de lectura limitadas a su propia carpeta.

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

### Configurar los correos de Supabase Auth

1. En Supabase, habilita el proveedor de correo/contraseña y exige confirmar la dirección antes de iniciar sesión.
2. En la configuración de URL de Auth, establece como Site URL el dominio público de Rentify (el de Vercel en producción) y permite la redirección `https://tu-dominio/auth/callback` (en local, `http://localhost:3000/auth/callback`).
3. Configura las plantillas de confirmación y recuperación para usar `{{ .ConfirmationURL }}`; comprueba que la redirección llegue a `/auth/callback` y que recuperación termine en `/restablecer`.
4. El proveedor de correo predeterminado de Supabase tiene límites de entrega y es adecuado principalmente para pruebas. Para producción, revisa la documentación y los límites vigentes de Supabase; si necesitas entrega confiable, tendrás que configurar un SMTP externo con un remitente autorizado.

Si la solicitud de recuperación falla, revisa **Supabase → Authentication → Logs**. Un error `redirect_to_not_allowed` significa que falta la URL exacta `https://TU-DOMINIO/auth/callback` en **Redirect URLs**; `smtp_setup_required` o `unexpected_failure` apuntan a la configuración/límites del proveedor de correo. La página que recibe el enlace es `/restablecer`; no es necesario crear otra ruta.

Los correos de confirmación y recuperación los envía Supabase Auth. Los eventos operativos (solicitudes, visitas, evaluaciones, documentos, moderación y reportes) se guardan como notificaciones dentro de Rentify y se muestran en el dashboard; no se envían por correo. Las preferencias previas de notificación por email ya no aplican.

Si el registro falla, revisa el mensaje del formulario y los eventos en **Authentication → Logs**. Un error `401` suele significar que Supabase rechazó la clave de API: comprueba que la clave pública vigente pertenezca al mismo proyecto de `NEXT_PUBLIC_SUPABASE_URL`, que no se haya usado `service_role`, y reinicia Next.js después de modificar `.env`. Un error de límite requiere esperar; un fallo de envío de confirmación requiere revisar la configuración y los límites de correo de Supabase. Las migraciones nuevas se aplican con `npx prisma migrate deploy` en la base de pruebas antes de registrar.

Las cuentas previas de Rentify se pueden vincular al iniciar sesión si su contraseña heredada es válida y su correo todavía no tiene una identidad incompatible en Supabase. La primera vinculación requiere confirmar el correo. Si Supabase ya tiene una identidad para ese correo, usa el flujo de recuperación de Supabase antes de volver a iniciar sesión.

Las sesiones y su duración se administran mediante Supabase Auth y cookies SSR; no se necesita configurar un `JWT_SECRET` propio. Un usuario bloqueado no puede entrar a las áreas protegidas ni ejecutar acciones de servidor.

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
- Algunos textos promocionales y cifras de portada/inicio de sesión son datos demostrativos estáticos, no métricas calculadas ni garantías operativas. La interfaz incluye textos de confianza que deben revisarse antes de presentarla como servicio real.
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
