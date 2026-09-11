# Wave Counting Application

## Experience
- Replace the blank home page with a clean, responsive wave analysis workspace.
- Let users upload a wave photo or choose from three built-in ocean samples.
- Keep the selected image central, with a simple “Count Waves” action and clear loading/error states.

## AI Analysis
- Send the selected image securely to Lovable AI for visual wave-crest detection.
- Return a structured total, overall confidence, and individual detected wave lines with positions and confidence values.
- Surface specific AI service errors clearly and preserve the selected image for retrying.

## Results
- Draw interactive numbered crest lines over the photo, with controls to show or hide detections.
- Add a compact results panel with total count, confidence summary, and per-wave details.
- Make selecting a detail highlight its corresponding overlay line.

## Visual Direction
- Use a restrained oceanographic field-tool aesthetic: bright neutral canvas, deep ink, sea-glass teal, and a warm coral detection accent.
- Use crisp typography, thin dividers, minimal framing, and subtle motion that respects reduced-motion settings.

## Technical Details
- Implement the page at `/` using the existing TanStack Start and Tailwind setup.
- Add a server-only AI function using the default Lovable AI vision model and strict structured output.
- Keep the AI key and prompt server-side; validate input and output.
- Add route-specific title, description, Open Graph, and Twitter metadata.
- Verify the upload/sample selection, analysis response, overlay interaction, and desktop/mobile rendering.
