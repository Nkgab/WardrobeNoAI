# Wardrobe App - No AI Version

This version removes the dependency on paid external AI APIs.

## What changed
- No Anthropic/Gemini/OpenAI API calls.
- Smart outfit suggestions use local wardrobe rules and colour matching.
- Colour matching is calculated locally from item hex colours.
- Photo tag suggestions use local image colour sampling plus the filename/category.
- Background removal is manual: use the built-in Trim & continue flow.
- Smart style feedback is generated locally from the outfit pieces.
- Existing wardrobe, saved outfits, calendar, and packing-list features remain browser-local.

## Installation
Replace the `script.js` file in your existing WardrobeApp project with the `script.js` from this package.

No API key or billing account is required.
