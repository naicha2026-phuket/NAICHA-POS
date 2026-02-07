# PWA Icon Generation Instructions

To complete the PWA setup, you need to create app icons in the following sizes:

1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels

## Option 1: Use your existing NAICHA.png

You can resize your existing NAICHA.png logo to create these icons.

## Option 2: Use an online tool

Use a PWA icon generator like:

- https://www.pwabuilder.com/imageGenerator
- https://favicon.io/
- https://realfavicongenerator.net/

Upload your NAICHA.png and it will generate all the required sizes.

## Option 3: Use command line (if you have ImageMagick)

```bash
convert NAICHA.png -resize 192x192 icon-192x192.png
convert NAICHA.png -resize 512x512 icon-512x512.png
```

## Manual Setup

After generating the icons:

1. Place `icon-192x192.png` in the `/public` folder
2. Place `icon-512x512.png` in the `/public` folder

The PWA will then be fully functional!
