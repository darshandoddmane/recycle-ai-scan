-- Create storage bucket for uploaded images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-images', 'scan-images', true);

-- Create table to store scan results
CREATE TABLE public.image_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_recyclable BOOLEAN,
  material_type TEXT,
  confidence FLOAT,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on image_scans
ALTER TABLE public.image_scans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view scans (public app)
CREATE POLICY "Anyone can view image scans"
ON public.image_scans
FOR SELECT
USING (true);

-- Allow anyone to insert scans (public app)
CREATE POLICY "Anyone can insert image scans"
ON public.image_scans
FOR INSERT
WITH CHECK (true);

-- Storage policies for scan-images bucket
CREATE POLICY "Anyone can upload to scan-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'scan-images');

CREATE POLICY "Anyone can view scan-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'scan-images');