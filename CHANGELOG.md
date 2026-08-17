# Wardrobe App — Changelog

A record of everything built, in order.

## 1. Initial build
- First version: categorised wardrobe (T-Shirts, Shirts, Trousers, Skirts, Dresses,
  Jackets), photo upload with manual crop, swipe-based Mix & Match (Top+Bottom or
  Dress mode), favourites row of saved combos. Cream/beige colour theme.

## 2. Expanded to full spec
- **Home** screen with greeting, quick-action cards, and stats (pieces/outfits/favourites)
- **My Wardrobe**: full category list (added Tops, Jeans, Shorts, Hoodies, Shoes,
  Bags, Accessories), colour tag, season tag, favourite toggle, filter by category/
  colour/season/favourites
- **Add Clothing** flow: photo upload, category, colour, season
- **Outfit Builder**: step-by-step wizard — Top+Bottom or Dress → swipe through
  each category → optional Jacket/Accessories → preview → name & save
- **Saved Outfits**: rename, favourite, delete
- Bottom navigation: Home / Wardrobe / Build / Saved

## 3. Photo handling
- Manual crop/trim tool (drag a box around the garment before saving)
- **AI cutout on white background**: Claude identifies the garment's rough bounding
  box in the photo; the app then samples the photo's corner colour and paints
  matching pixels white. Works best on plain backgrounds — not true image
  segmentation, since Claude can't output edited pixels directly.

## 4. AI features (calls Claude directly via the artifact's API access)
- **Auto-tag**: Claude looks at an uploaded photo and fills in name, category,
  colour, and season
- **AI outfit suggestions**: describe an occasion, Claude picks a real combo from
  your actual wardrobe with a short explanation
- **Colour-theory matching**: tap 🎨 on any item, Claude reasons about
  complementary/analogous/triadic/monochromatic/neutral pairings using that
  item's actual colour and suggests a full outfit around it
- **Style feedback**: short AI opinion on any built outfit
- **Colour detection accuracy fix**: auto-tag originally snapped to one of 12
  preset swatches; updated so it reports the garment's true hex colour and a
  readable name instead, with the 12 presets kept only as a manual fallback/filter
- **AI feedback loop**: 👍/👎 plus an optional note under every AI result, logged
  for reference (not currently used to change future AI behaviour — just recorded)

## 5. Item management
- **Edit existing items**: tap a card to reopen it pre-filled, change anything,
  save in place instead of duplicating
- **Delete confirmation**: bigger, higher-contrast delete button + a confirmation
  prompt + a toast confirming removal (previously too subtle / easy to miss)

## 6. New sections
- **Outfit Calendar**: month view, tap a day to log what you wore (quick-pick from
  saved outfits or select individual pieces), coloured dots show logged days
- **Packing List**: multiple named trips, each with its own checklist — add pieces
  from your wardrobe, tick them off as packed, progress bar per trip

## 7. Visual redesign
- Bold & vibrant palette: off-white background, white cards, near-black ink text,
  hot coral (#FF3E63) as primary accent, electric indigo (#6C5CE7) as secondary,
  acid lime (#C6F135) used once deliberately (today's date on the calendar)
- Typography swapped to Unbounded (display/headings) + Inter (body/UI)
- Deliberately left the actual clothing colour swatches and category tint colours
  untouched — those represent real garment colours, not decorative theme colours

## 8. Icon system
- Replaced every emoji and mismatched text glyph (‹ › × + ⚙ ♥ 👍 👎 etc.) with a
  single consistent inline-SVG line-icon set (`icon()` helper in script.js), all
  using `currentColor` so they follow the app's palette automatically

## Known limitations (see README.md for full detail)
- `window.storage` (persistence) and the direct Claude API calls only work inside
  Claude's artifact sandbox — this exported project includes a `localStorage`
  shim for storage, but the AI features need your own backend proxy to work
  outside that sandbox
- No true photo background segmentation (cutout is bounding-box + colour-threshold
  approximation)
- No cross-device sync
- No edit history / undo beyond the delete confirmation
