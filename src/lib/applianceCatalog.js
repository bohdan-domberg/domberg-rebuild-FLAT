import { supabase } from './supabaseClient';

/**
 * Small catalog of appliance SKUs (brand/model/description/price) used to
 * autocomplete items on an Appliance quote. Grows organically — there's no
 * bulk-import UI, items get added one at a time via "Save to catalog" as
 * they're typed into a real quote.
 */

export async function searchCatalog(term, limit = 15) {
  if (!term || !term.trim()) return [];
  const q = term.trim();
  const { data, error } = await supabase
    .from('appliance_catalog')
    .select('id, brand, model, description, category, list_price')
    .or(`brand.ilike.%${q}%,model.ilike.%${q}%,description.ilike.%${q}%`)
    .order('brand')
    .limit(limit);
  if (error) throw new Error(`Catalog search failed: ${error.message}`);
  return data;
}

export async function saveCatalogItem({ brand, model, description, category = '', listPrice }) {
  const { data, error } = await supabase
    .from('appliance_catalog')
    .insert({
      brand: brand || '',
      model: model || '',
      description: description || '',
      category,
      list_price: Number(listPrice) || 0,
    })
    .select()
    .single();
  if (error) throw new Error(`Could not save to catalog: ${error.message}`);
  return data;
}
