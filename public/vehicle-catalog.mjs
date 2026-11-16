// Shared by the browser and catalog/image sync. New launches can precede UEX.
export function catalogKey(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function mergeVehicleCatalogs(...catalogs) {
  const records = [];
  const keys = new Map();
  for (const rows of catalogs) {
    for (const row of rows || []) {
      if (!row?.name || row.id == null) continue;
      const identities = [`id:${row.id}`, ...[row.slug, row.name, row.name_full, ...(row.aliases || [])]
        .filter(Boolean).map((name) => `name:${catalogKey(name)}`)];
      // Preserve distinct UEX IDs (paint editions can share names or slugs).
      // Name matching is only for a wiki supplement acquiring its real UEX ID.
      const index = identities.map((key) => keys.get(key)).find((value) => value !== undefined &&
        (String(records[value].id) === String(row.id) || String(records[value].id).startsWith("wiki:") || String(row.id).startsWith("wiki:"))) ?? records.length;
      const previous = records[index] || {};
      const values = Object.fromEntries(Object.entries(row).filter(([, value]) => value != null));
      const id = String(row.id).startsWith("wiki:") && previous.id != null ? previous.id : row.id;
      records[index] = { ...previous, ...values, id,
        aliases: [...new Set([...(previous.aliases || []), ...(row.aliases || []), previous.name, previous.name_full, previous.slug].filter(Boolean))] };
      identities.forEach((key) => keys.set(key, index));
    }
  }
  return records;
}
