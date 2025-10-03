-- Create agent_reports table
CREATE TABLE IF NOT EXISTS agent_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  lunch_start_time TIMESTAMP WITH TIME ZONE,
  lunch_end_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2) DEFAULT 0,
  lunch_duration DECIMAL(4,2) DEFAULT 0,
  work_hours DECIMAL(4,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_reports_agent_id ON agent_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reports_date ON agent_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_agent_reports_agent_date ON agent_reports(agent_id, report_date);

-- Enable RLS
ALTER TABLE agent_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Agents can view their own reports" ON agent_reports
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own reports" ON agent_reports
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own reports" ON agent_reports
  FOR UPDATE USING (auth.uid() = agent_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_agent_reports_updated_at 
  BEFORE UPDATE ON agent_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
