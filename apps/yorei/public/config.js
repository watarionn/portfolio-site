// =============================================
// Supabase 設定 — config.js
// =============================================
const SUPABASE_URL  = 'https://adqpvtumlamsweiyxyvm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcXB2dHVtbGFtc3dlaXl4eXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTk1MjgsImV4cCI6MjA4OTQ3NTUyOH0.82Si0X7wUxsCEY9ahtld5AjXvknzJuIX-bC72pljQvI';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
