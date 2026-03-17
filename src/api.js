import { supabase } from './supabaseClient'

export const getDonations = async () => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching donations:', error)
    return null
  } else {
    console.log('Fetched donations:', data)
  }

  return data
}
