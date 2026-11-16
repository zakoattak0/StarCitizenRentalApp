// Read exterior profiles, never interior, component, or paint galleries.
export function decodeHtml(value) {
  return value.replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function wikiImageCandidates(html) {
  const images = [];
  for (const match of html.matchAll(/<a\b[^>]*href="\/File:[^"]+"[^>]*class="mw-file-description"[^>]*>[\s\S]*?<\/a>\s*<a\b[^>]*class="mw-file-source"[^>]*>[\s\S]*?<\/a>/g)) {
    const file = match[0].match(/href="\/File:([^"]+)"/);
    const original = match[0].match(/<a\b[^>]*href="(https:\/\/media\.starcitizen\.tools\/[^\"]+)"[^>]*class="mw-file-source"/);
    if (file && original) images.push({ file: decodeURIComponent(decodeHtml(file[1])).replaceAll("_", " "), url: decodeHtml(original[1]), offset: match.index });
  }
  return images;
}

export function selectWikiShipImage(html) {
  const images = wikiImageCandidates(html);
  const exteriorStart = html.search(/id="(?:Exterior|Ship_profile|Vehicle_profile)(?:_\d+)?"/);
  if (exteriorStart >= 0) {
    const following = html.slice(exteriorStart);
    const sectionEnd = following.search(/<h[234]\b[^>]*id="(?:Interior|Paints|Gallery|Variants|Development)/);
    const end = sectionEnd >= 0 ? exteriorStart + sectionEnd : html.length;
    const profile = images.filter((image) => image.offset >= exteriorStart && image.offset < end);
    const isometric = profile.find((image) => /isometric/i.test(image.file) && !/placeholder|line.?drawing|blueprint|schematic|floor.?plan|interior|cockpit|cutaway|cross.?section|cutout with black BG/i.test(image.file));
    if (isometric) return { ...isometric, kind: "isometric" };
  }
  const headerEnd = html.indexOf('<div class="t-infobox-header-content"');
  const infobox = images.find((image) => image.offset < headerEnd);
  if (infobox && !/interior|cockpit|cargo.?hold|placeholder|logo|icon|schematic|floor.?plan|cutaway|cross.?section|cutout with black BG/i.test(infobox.file)) return { ...infobox, kind: /isometric|[- ]iso[- .]/i.test(infobox.file) ? "isometric" : "exterior-fallback" };
  return null;
}
