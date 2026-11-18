-- HU-03/HU-04: reforzar fechas y horas sin reconstruir ni reemplazar trainings.
-- La migración se ejecuta en una transacción de createDatabase. Si existen
-- datos inválidos, se cancela completa para que puedan revisarse explícitamente.
CREATE TEMP TABLE training_dates_preflight (
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  CONSTRAINT training_dates_valid CHECK (
    start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    AND COALESCE(date(start_date, '+0 days') = start_date, 0)
    AND end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    AND COALESCE(date(end_date, '+0 days') = end_date, 0)
    AND start_time GLOB '[0-2][0-9]:[0-5][0-9]' AND start_time < '24:00'
    AND end_time GLOB '[0-2][0-9]:[0-5][0-9]' AND end_time < '24:00'
  )
);
INSERT INTO training_dates_preflight (start_date, end_date, start_time, end_time)
SELECT start_date, end_date, start_time, end_time FROM trainings;
DROP TABLE training_dates_preflight;

CREATE TRIGGER trainings_validate_dates_insert
BEFORE INSERT ON trainings
WHEN NOT COALESCE(
  NEW.start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  AND date(NEW.start_date, '+0 days') = NEW.start_date
  AND NEW.end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  AND date(NEW.end_date, '+0 days') = NEW.end_date
  AND NEW.start_time GLOB '[0-2][0-9]:[0-5][0-9]' AND NEW.start_time < '24:00'
  AND NEW.end_time GLOB '[0-2][0-9]:[0-5][0-9]' AND NEW.end_time < '24:00', 0)
BEGIN
  SELECT RAISE(ABORT, 'trainings: fecha YYYY-MM-DD u hora HH:mm invalida');
END;

CREATE TRIGGER trainings_validate_dates_update
BEFORE UPDATE OF start_date, end_date, start_time, end_time ON trainings
WHEN NOT COALESCE(
  NEW.start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  AND date(NEW.start_date, '+0 days') = NEW.start_date
  AND NEW.end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  AND date(NEW.end_date, '+0 days') = NEW.end_date
  AND NEW.start_time GLOB '[0-2][0-9]:[0-5][0-9]' AND NEW.start_time < '24:00'
  AND NEW.end_time GLOB '[0-2][0-9]:[0-5][0-9]' AND NEW.end_time < '24:00', 0)
BEGIN
  SELECT RAISE(ABORT, 'trainings: fecha YYYY-MM-DD u hora HH:mm invalida');
END;
