import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://kvsbclenpxdsldieyege.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2c2JjbGVucHhkc2xkaWV5ZWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjMxNTksImV4cCI6MjA5MjY5OTE1OX0.gJfzd2JYZJp0kWj8TP536jncW6bepH0MS6eHQKXs6a8"
);
