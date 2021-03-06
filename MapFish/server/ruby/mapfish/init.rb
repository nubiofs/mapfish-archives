require 'geojson'

# Load CoreExtensions
Dir[File.join("#{File.dirname(__FILE__)}", 'lib', 'mapfish_core_extensions', '**', '*.rb')].each do |f|
  extension_module = f.sub(/(.*)(mapfish_core_extensions.*)\.rb/,'\2').classify.constantize
  base_module = f.sub(/(.*mapfish_core_extensions.)(.*)\.rb/,'\2').classify.constantize
  base_module.class_eval { include extension_module }
end
