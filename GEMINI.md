# Glass OS - Trip Manager Project Context

## Project Overview
"Glass OS - Trip Manager" is a web-based travel planning application featuring a futuristic, glassmorphism-styled user interface that simulates a desktop operating system environment. It leverages **Google Gemini AI** to generate personalized travel recommendations and integrates **Google Maps 3D** for immersive visualization.

**Key Features:**
*   **AI-Powered Planning:** Users input a destination, theme, and requirements to receive a curated "best single spot" recommendation from Gemini.
*   **Data Enrichment:** AI recommendations are cross-referenced with the Google Places API to provide real-world data (ratings, photos, precise location).
*   **Interactive UI:** A "Glass OS" interface with draggable windows, a dock, and widgets, built without heavy frontend frameworks (using Vanilla JS + Tailwind).
*   **3D Mapping:** Utilizes the Google Maps JavaScript API (beta 3D features) for a dynamic background map.
*   **Smart Schedule:** A drag-and-drop timeline that automatically calculates routes and travel times between activities.

## Technical Architecture

### Backend (Node.js + Express)
*   **Framework:** Express.js handling routing and middleware.
*   **View Engine:** EJS (Embedded JavaScript) for server-side rendering.
*   **Controllers:**
    *   `aiController.js`: Handles the `/api/recommend` endpoint. It creates a prompt for Gemini, parses the JSON response, and then validates/enriches the data using the Google Places API (`axios` call).
    *   `mainController.js`: Standard page rendering logic.
*   **Dependencies:** `dotenv` (config), `cors`, `axios`, `@google/generative-ai`, `express-async-handler`.

### Frontend (Vanilla JS + EJS)
*   **Styling:** TailwindCSS (via CDN) and custom CSS for the glassmorphism effect.
*   **State Management:** Local component state within `plan.ejs` (e.g., `scheduleState` object).
*   **Map Integration:** Uses `<gmp-map-3d>` custom element from Google Maps Platform.
*   **Interactivity:** Custom implementation of window dragging, minimizing/maximizing, and sortable lists (drag-and-drop) for the itinerary.

## Directory Structure

```text
web_app_subject/
├── app.js                  # Application entry point (Server setup)
├── controllers/
│   ├── aiController.js     # Core logic: Gemini + Google Places API integration
│   └── mainController.js   # View rendering logic
├── routes/
│   └── mainRoutes.js       # Route definitions including /api/recommend
├── views/
│   └── plan/
│       └── plan.ejs        # MAIN UI FILE: Contains the Glass OS logic, Map init, and Client-side scripts
└── public/                 # Static assets
```

## Setup & Development

**Prerequisites:**
*   Node.js (v14+ recommended)
*   `.env` file in the root directory containing:
    ```env
    PORT=3000
    GEMINI_API_KEY=your_gemini_key
    GOOGLE_MAPS_API_KEY=your_maps_key
    ```

**Commands:**
*   `npm install` - Install dependencies.
*   `npm run dev` - Start the server with `nodemon` (auto-restart on changes).
*   `npm start` - Start the server in production mode.

**Server:** Defaults to `http://localhost:3000`.

## Key Logic Flows

### 1. AI Recommendation Flow (`aiController.js`)
1.  **Request:** Frontend sends `{ city, theme, requirements }`.
2.  **Gemini:** Generates a JSON response with a recommended place and a `searchQuery` (e.g., "Official Name + City").
3.  **Places API:** The backend uses the `searchQuery` to hit the Google Places Text Search API.
4.  **Merge:** The Place ID, formatted address, rating, and photo references from Google Maps are merged with the description/reasoning from Gemini.
5.  **Response:** Returns a unified JSON object to the client.

### 2. Schedule & Drag-and-Drop (`plan.ejs`)
*   The schedule is stored in `scheduleState.activities`.
*   **Rendering:** `renderSchedule()` regenerates the DOM based on this state.
*   **Calculations:** Distance between points is calculated using the Haversine formula (approximate) to display travel connectors.
*   **Interaction:** Native HTML5 Drag and Drop API is used for reordering list items.

## Conventions
*   **Frontend Logic:** Most UI interaction logic is currently embedded directly within `plan.ejs` script tags. When refactoring, consider moving this to `public/javascripts/`.
*   **Styling:** Use Tailwind utility classes. Custom styles for the "Glass" effect are defined in the `<style>` block of `plan.ejs`.
*   **Error Handling:** Async errors in controllers are caught by `express-async-handler`.
