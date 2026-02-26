# _plugins/lazy_images.rb
#
# Adds loading="lazy" to every <img> tag in post/page output that doesn't
# already carry a loading attribute.
#
# Images that are explicitly loading="eager" (feature images, essay heroes)
# are untouched by the negative lookahead (?![^>]*\bloading=).

Jekyll::Hooks.register [:posts, :pages, :documents], :post_render do |doc|
  next unless doc.output_ext == '.html'

  doc.output = doc.output.gsub(
    /<img(?![^>]*\bloading=)([^>]*)>/,
    '<img loading="lazy"\1>'
  )
end
