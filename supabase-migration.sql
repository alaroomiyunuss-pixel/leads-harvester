-- أضف عمود max_radius لجدول searches
ALTER TABLE searches ADD COLUMN IF NOT EXISTS max_radius integer DEFAULT 0;
UPDATE searches SET max_radius = 5000 WHERE max_radius IS NULL OR max_radius = 0;

-- أضف عمود serial_number لجدول leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS serial_number integer;

-- أنشئ sequence للترقيم التسلسلي التلقائي
CREATE SEQUENCE IF NOT EXISTS leads_serial_seq START 1;

-- عيّن أرقاماً للصفوف الموجودة (مرتّبة حسب timestamp)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY timestamp ASC) AS rn
  FROM leads
  WHERE serial_number IS NULL
)
UPDATE leads SET serial_number = ranked.rn
FROM ranked WHERE leads.id = ranked.id;
