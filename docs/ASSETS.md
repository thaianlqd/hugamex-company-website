# Temporary assets

User authorized temporary remote images. Hero: Anna Shvets, https://www.pexels.com/photo/a-tailor-sewing-on-a-sewing-machine-5830692/ . About: https://www.pexels.com/photo/a-person-using-a-sewing-machine-12362544/ . Remote delivery: images.pexels.com; CSP must allow it while placeholders remain. Product illustrations are original SVGs, explicitly illustrative.

One image was generated with built-in imagegen before the user requested stock links: frontend/public/assets/sewing-editorial.png, unused alternate. Prompt: generic editorial industrial sewing workstation, beige cotton jacket under sewing machine, hands guiding fabric, warm window light, no brand/text. No claim that this depicts HUGAMEX. All these temporary visuals must be replaced or approved before launch.

The development fixture seed downloads these two stock photos and uploads them through the CMS into BYTEA. The preview can then use local API media rather than third-party links. Uploaded alt text explicitly identifies them as temporary stock. `/favicon.svg` is an original temporary H monogram, not the company's approved logo.

## Phase 2 stock additions

Generic outerwear [Unsplash image](https://images.unsplash.com/photo-1551028719-00167b16eac5), sportswear [Unsplash image](https://images.unsplash.com/photo-1556821840-3a63f95609a7), trousers [Unsplash image](https://images.unsplash.com/photo-1542272604-787c3835535d), and hero store photograph [Unsplash image](https://images.unsplash.com/photo-1441986300917-64674bd600d8). These are temporary visual references, not HUGAMEX catalogue/factory photographs. Owner approval/replacement and final image rights/attribution review remain required before launch.

Five fixed sewing/material/garment photos are persisted through `MediaService.upload` into BYTEA by the explicit dev job. Three hero metadata URLs remain replaceable in CMS. Allowed external hero hosts are `images.pexels.com` and `images.unsplash.com`, HTTPS only. They are fetched by the browser with anonymous CORS/no referrer; the backend never fetches arbitrary image URLs. Original local SVGs remain error fallbacks. No image generation was used in Phase 2.
