# Star Counting Application

## Experience
- Replace the blank home page with a clean, responsive night-sky analysis workspace.
- Let users upload a star-field photo or choose from three built-in samples.
- Keep the selected image central, with a simple “Count Stars” action and clear loading/error states.

## AI Analysis
- Send the selected image securely to Lovable AI for visual star detection.
- Return a structured total, overall confidence, and individual detected stars with center positions, radius estimates, and confidence values.
- Surface specific AI service errors clearly and preserve the selected image for retrying.

## Results
- Draw interactive numbered star rings over the photo, with controls to show or hide detections.
- Add a compact results panel with total count, confidence summary, and per-star details.
- Make selecting a detail highlight its corresponding overlay marker.

## Visual Direction
- Use a restrained astronomical field-tool aesthetic: bright neutral canvas, deep ink, sea-glass teal, and a warm gold detection accent.
- Use crisp typography, thin dividers, minimal framing, and subtle motion that respects reduced-motion settings.

## Technical Details
- Implement the page at `/` using the existing TanStack Start and Tailwind setup.
- Add a server-only AI function using the default Lovable AI vision model and strict structured output.
- Keep the AI key and prompt server-side; validate input and output.
- Add route-specific title, description, Open Graph, and Twitter metadata.
- Verify the upload/sample selection, analysis response, overlay interaction, and desktop/mobile rendering.
