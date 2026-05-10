-- أضف عمود max_radius لجدول searches
ALTER TABLE searches ADD COLUMN IF NOT EXISTS max_radius integer DEFAULT 0;

-- تحديث القيم الموجودة (اجعلها 5000 كافتراضي إن لم تكن موجودة)
UPDATE searches SET max_radius = 5000 WHERE max_radius IS NULL OR max_radius = 0;
