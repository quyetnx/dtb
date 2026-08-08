/**
 * Clean Google Docs exported HTML:
 * - Strip inline styles / class / id that conflict with our design
 * - Preserve semantic structure: headings, p, blockquote, lists, tables, img, strong, em, u, s
 * - Images keep their src (Google CDN) so they render inline
 */
export function cleanGoogleDocsHtml(raw: string): string {
  // Extract <body> content
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  let html = bodyMatch?.[1] ?? raw

  // Remove <style> blocks and <head>
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Remove all style="" and class="" and id="" attributes, but KEEP src, href, alt, colspan, rowspan, width, height on img/table
  html = html.replace(/(<(?!img|table|td|th|a)[^>]*?)\s+style="[^"]*"/gi, '$1')
  html = html.replace(/(<(?!img|table|td|th|a)[^>]*?)\s+class="[^"]*"/gi, '$1')
  html = html.replace(/(<[^>]*?)\s+id="[^"]*"/gi, '$1')

  // Remove Google Docs wrapper artifacts
  html = html.replace(/(<img[^>]*?)\s+style="[^"]*"/gi, '$1')  // strip img inline styles too
  html = html.replace(/(<img[^>]*?)\s+class="[^"]*"/gi, '$1')

  // Remove empty spans (Google wraps every run in a styled span)
  // Collapse nested spans down to their text content
  let prev = ''
  while (prev !== html) {
    prev = html
    html = html.replace(/<span[^>]*?>([^<]*?)<\/span>/gi, '$1')
  }

  // Remove empty paragraphs used purely for spacing
  html = html.replace(/<p[^>]*?>\s*<\/p>/gi, '')
  html = html.replace(/<p[^>]*?>\s*<br\s*\/?>\s*<\/p>/gi, '')

  // Remove Google Docs anchor targets (bookmarks)
  html = html.replace(/<a[^>]*?name="[^"]*"[^>]*?><\/a>/gi, '')

  // Remove page-break divs
  html = html.replace(/<div[^>]*?page-break[^>]*?>[\s\S]*?<\/div>/gi, '')

  // Strip remaining empty divs/spans that add no meaning
  html = html.replace(/<div[^>]*?>\s*<\/div>/gi, '')

  // Normalize multiple blank lines
  html = html.replace(/(\s*\n){3,}/g, '\n\n')

  return html.trim()
}
