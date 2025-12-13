import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkihmiyosknwewefqbei.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhraWhtaXlvc2tud2V3ZWZxYmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjQ1OTYsImV4cCI6MjA3OTc0MDU5Nn0.byymCjd2GAgR6LY4TZX9w38pwuJAxcJ7EFCrL1Vt0tE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
