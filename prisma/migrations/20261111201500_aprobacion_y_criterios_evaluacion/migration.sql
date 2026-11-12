-- Add moderation state details and support averaged, multi-criterion evaluations.
ALTER TABLE "Publicacion"
ADD COLUMN "motivo_rechazo" TEXT;

ALTER TABLE "Evaluacion"
ALTER COLUMN "calificacion" TYPE DOUBLE PRECISION
USING "calificacion"::DOUBLE PRECISION;

ALTER TABLE "Evaluacion"
ADD COLUMN "calificacion_atencion" INTEGER,
ADD COLUMN "calificacion_mantenimiento" INTEGER,
ADD COLUMN "calificacion_cumplimiento" INTEGER,
ADD COLUMN "calificacion_puntualidad" INTEGER,
ADD COLUMN "calificacion_cuidado" INTEGER,
ADD COLUMN "calificacion_higiene" INTEGER;
