<!-- PWA Icon Placeholders -->

This directory should contain:
- 192x192.png (required for PWA)
- 512x512.png (required for PWA)

Current placeholders are SVG files. To generate PNG icons:
1. Use an icon generator tool (e.g., https://www.pwabuilder.com/imageGenerator)
2. Or convert the SVG placeholder to PNG using ImageMagick:
   ```bash
   convert -background none -size 192x192 icon-placeholder.svg 192x192.png
   convert -background none -size 512x512 icon-placeholder.svg 512x512.png
   ```

For production, create a proper logo with:
- Camera or food imagery
- MealLens branding
- Green color scheme (#4CAF50)
