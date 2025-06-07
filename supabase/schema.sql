-- Create tables for BeeKeeper Pro app

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Apiaries table
CREATE TABLE public.apiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for apiaries
ALTER TABLE public.apiaries ENABLE ROW LEVEL SECURITY;

-- Apiaries policies
CREATE POLICY "Users can view their own apiaries"
  ON public.apiaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own apiaries"
  ON public.apiaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own apiaries"
  ON public.apiaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own apiaries"
  ON public.apiaries FOR DELETE
  USING (auth.uid() = user_id);

-- Hives table
CREATE TABLE public.hives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiary_id UUID NOT NULL REFERENCES public.apiaries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  established_date DATE NOT NULL,
  queen_source TEXT,
  queen_introduced DATE,
  hive_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'dead', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for hives
ALTER TABLE public.hives ENABLE ROW LEVEL SECURITY;

-- Hives policies
CREATE POLICY "Users can view their own hives"
  ON public.hives FOR SELECT
  USING (
    apiary_id IN (
      SELECT id FROM public.apiaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own hives"
  ON public.hives FOR INSERT
  WITH CHECK (
    apiary_id IN (
      SELECT id FROM public.apiaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own hives"
  ON public.hives FOR UPDATE
  USING (
    apiary_id IN (
      SELECT id FROM public.apiaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own hives"
  ON public.hives FOR DELETE
  USING (
    apiary_id IN (
      SELECT id FROM public.apiaries WHERE user_id = auth.uid()
    )
  );

-- Inspections table
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  inspection_date TIMESTAMP WITH TIME ZONE NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('excellent', 'good', 'fair', 'poor', 'critical')),
  population_strength INTEGER CHECK (population_strength BETWEEN 1 AND 10),
  observations TEXT,
  weather_conditions JSONB,
  queen_seen BOOLEAN NOT NULL DEFAULT false,
  brood_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for inspections
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Inspections policies
CREATE POLICY "Users can view their own inspections"
  ON public.inspections FOR SELECT
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own inspections"
  ON public.inspections FOR INSERT
  WITH CHECK (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own inspections"
  ON public.inspections FOR UPDATE
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own inspections"
  ON public.inspections FOR DELETE
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Inspection photos table
CREATE TABLE public.inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for inspection_photos
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Inspection photos policies
CREATE POLICY "Users can view their own inspection photos"
  ON public.inspection_photos FOR SELECT
  USING (
    inspection_id IN (
      SELECT i.id FROM public.inspections i
      JOIN public.hives h ON i.hive_id = h.id
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own inspection photos"
  ON public.inspection_photos FOR INSERT
  WITH CHECK (
    inspection_id IN (
      SELECT i.id FROM public.inspections i
      JOIN public.hives h ON i.hive_id = h.id
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own inspection photos"
  ON public.inspection_photos FOR UPDATE
  USING (
    inspection_id IN (
      SELECT i.id FROM public.inspections i
      JOIN public.hives h ON i.hive_id = h.id
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own inspection photos"
  ON public.inspection_photos FOR DELETE
  USING (
    inspection_id IN (
      SELECT i.id FROM public.inspections i
      JOIN public.hives h ON i.hive_id = h.id
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Harvests table
CREATE TABLE public.harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL,
  honey_amount DECIMAL(10,2) NOT NULL,
  honey_type TEXT,
  quality_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for harvests
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

-- Harvests policies
CREATE POLICY "Users can view their own harvests"
  ON public.harvests FOR SELECT
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own harvests"
  ON public.harvests FOR INSERT
  WITH CHECK (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own harvests"
  ON public.harvests FOR UPDATE
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own harvests"
  ON public.harvests FOR DELETE
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Treatments table
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  application_date DATE NOT NULL,
  treatment_type TEXT NOT NULL,
  dosage TEXT,
  followup_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for treatments
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Treatments policies
CREATE POLICY "Users can view their own treatments"
  ON public.treatments FOR SELECT
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own treatments"
  ON public.treatments FOR INSERT
  WITH CHECK (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own treatments"
  ON public.treatments FOR UPDATE
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own treatments"
  ON public.treatments FOR DELETE
  USING (
    hive_id IN (
      SELECT h.id FROM public.hives h
      JOIN public.apiaries a ON h.apiary_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Equipment table (premium feature)
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  condition TEXT CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "Premium users can view their own equipment"
  ON public.equipment FOR SELECT
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium = true)
  );

CREATE POLICY "Premium users can insert their own equipment"
  ON public.equipment FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium = true)
  );

CREATE POLICY "Premium users can update their own equipment"
  ON public.equipment FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium = true)
  );

CREATE POLICY "Premium users can delete their own equipment"
  ON public.equipment FOR DELETE
  USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium = true)
  );

-- Setup function for creating new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_premium)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Beekeeper'), false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inspection', 'harvest', 'treatment', 'system', 'alert')),
  read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to create notification on new inspection
CREATE OR REPLACE FUNCTION public.create_inspection_notification()
RETURNS TRIGGER AS $$
DECLARE
  hive_name TEXT;
  user_id UUID;
BEGIN
  -- Get the hive name
  SELECT h.name, a.user_id 
  INTO hive_name, user_id
  FROM public.hives h
  JOIN public.apiaries a ON h.apiary_id = a.id
  WHERE h.id = NEW.hive_id;
  
  -- Create a notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    user_id,
    'New Inspection Recorded',
    'An inspection was recorded for hive ' || hive_name || ' with health status: ' || NEW.health_status,
    'inspection',
    'inspection',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating inspection notifications
CREATE TRIGGER on_inspection_created
  AFTER INSERT ON public.inspections
  FOR EACH ROW EXECUTE PROCEDURE public.create_inspection_notification();

-- Function to create notification on new treatment
CREATE OR REPLACE FUNCTION public.create_treatment_notification()
RETURNS TRIGGER AS $$
DECLARE
  hive_name TEXT;
  user_id UUID;
BEGIN
  -- Get the hive name
  SELECT h.name, a.user_id 
  INTO hive_name, user_id
  FROM public.hives h
  JOIN public.apiaries a ON h.apiary_id = a.id
  WHERE h.id = NEW.hive_id;
  
  -- Create a notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    user_id,
    'New Treatment Added',
    'Treatment ' || NEW.treatment_type || ' was added to hive ' || hive_name,
    'treatment',
    'treatment',
    NEW.id
  );
  
  -- If there's a followup date, create a reminder notification for that date
  IF NEW.followup_date IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      user_id,
      'Treatment Follow-up Reminder',
      'You have a follow-up scheduled for treatment ' || NEW.treatment_type || ' on hive ' || hive_name,
      'alert',
      'treatment',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating treatment notifications
CREATE TRIGGER on_treatment_created
  AFTER INSERT ON public.treatments
  FOR EACH ROW EXECUTE PROCEDURE public.create_treatment_notification();

-- Function to create notification on new harvest
CREATE OR REPLACE FUNCTION public.create_harvest_notification()
RETURNS TRIGGER AS $$
DECLARE
  hive_name TEXT;
  user_id UUID;
BEGIN
  -- Get the hive name
  SELECT h.name, a.user_id 
  INTO hive_name, user_id
  FROM public.hives h
  JOIN public.apiaries a ON h.apiary_id = a.id
  WHERE h.id = NEW.hive_id;
  
  -- Create a notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    user_id,
    'New Harvest Recorded',
    'A harvest of ' || NEW.honey_amount || 'kg was recorded for hive ' || hive_name,
    'harvest',
    'harvest',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating harvest notifications
CREATE TRIGGER on_harvest_created
  AFTER INSERT ON public.harvests
  FOR EACH ROW EXECUTE PROCEDURE public.create_harvest_notification();

-- Indexes
CREATE INDEX idx_apiaries_user_id ON public.apiaries(user_id);
CREATE INDEX idx_hives_apiary_id ON public.hives(apiary_id);
CREATE INDEX idx_inspections_hive_id ON public.inspections(hive_id);
CREATE INDEX idx_harvests_hive_id ON public.harvests(hive_id);
CREATE INDEX idx_treatments_hive_id ON public.treatments(hive_id);
CREATE INDEX idx_equipment_user_id ON public.equipment(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_entity ON public.notifications(entity_type, entity_id);
