# ⚖️ Indian Kanoon Search App

A full-stack web application designed to search and view Indian court judgments and legal documents. It scrapes data from [Indian Kanoon](https://indiankanoon.org/) and provides a clean, modern user interface to search through legal cases and read full judgments.

## 🚀 Features

- **Search Cases:** Enter legal queries (e.g., "property dispute", "murder", "section 302") to find relevant cases.
- **View Full Judgments:** Click on any search result to read the full text of the court judgment.
- **Responsive UI:** Clean, modern, and minimal user interface built with React.
- **Real-time Scraping:** Fetches live data from Indian Kanoon using a custom Node.js scraper.

## 🛠️ Tech Stack

**Frontend:**
- React (Create React App)
- Axios (for API requests)
- Vanilla CSS

**Backend:**
- Node.js
- Express.js (REST API)
- Cheerio (HTML parsing for web scraping)
- Axios (for HTTP requests to Indian Kanoon)
- CORS & dotenv

## ⚙️ Application Workflow

Here is the complete end-to-end workflow of how the application functions:

### 1. Search Workflow
1. **User Action:** The user types a search query (e.g., "murder") into the frontend search bar and clicks **Search**.
2. **Frontend Request:** React uses `axios` to send a `GET` request to the backend: `http://localhost:3001/search?query=murder`.
3. **Backend Processing:** 
   - The Express server receives the request on the `/search` route.
   - It calls the `searchCases` function from `scraper.js`.
   - The scraper fetches the search results HTML page from Indian Kanoon and uses `cheerio` to parse out the titles, case URLs, courts, dates, and snippets.
4. **Response:** The backend sends the parsed data back to the frontend as a JSON array.
5. **UI Update:** The React frontend updates its state and renders the list of search result cards.

### 2. View Case Workflow
1. **User Action:** The user clicks on a specific case card from the search results.
2. **Frontend Request:** React sends a `GET` request to the backend containing the specific case URL: `http://localhost:3001/case?url=<case-url>`.
3. **Backend Processing:**
   - The Express server receives the request on the `/case` route.
   - It calls the `fetchCase` function from `scraper.js`.
   - The scraper accesses the specific case document on Indian Kanoon, parses the HTML, and extracts the full judgment text, case title, and court name.
4. **Response:** The backend returns the full case details to the frontend as a JSON object.
5. **UI Update:** The React frontend hides the search results, displays the full judgment text in a scrollable view, and provides a "Back to Results" button.

## 🏃‍♂️ How to Run Locally

### Prerequisites
- Node.js installed on your machine.

### 1. Start the Backend
```bash
cd backend
npm install
node index.js
```
The backend server will start running at `http://localhost:3001`.

### 2. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm start
```
The React development server will start and open the application in your browser at `http://localhost:3000`.

## 📁 Project Structure

```text
indian-kanoon-app/
├── backend/
│   ├── .env               # Environment variables
│   ├── index.js           # Express server and API routes
│   ├── package.json       # Backend dependencies
│   └── scraper.js         # Scraping logic handling Indian Kanoon data
└── frontend/
    ├── package.json       # Frontend dependencies
    ├── public/            # Static files
    └── src/
        ├── App.css        # Styling
        ├── App.js         # Main React Component & UI Logic
        └── index.js       # React Entry point
```
