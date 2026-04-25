# SchuldWijzer (Debt Tracker)

A React-based debt management app for tracking and projecting debt scenarios.

## Project Structure

```
src/schuld/
├── components/           # UI components
│   ├── Dashboard.jsx      # Main overview screen
│   ├── DebtList.jsx       # List of all debts
│   ├── DebtDetail.jsx     # Individual debt details
│   ├── MailLog.jsx        # Correspondence log
│   ├── CalendarView.jsx   # Monthly calendar with payments
│   ├── Alerts.jsx         # Notification center
│   ├── AddDebtModal.jsx   # Debt creation/photo OCR
│   ├── TrajectoryChart.jsx # SVG projection chart
│   └── PPill.jsx          # Projection value pill
├── constants/            # Data definitions
│   ├── creditors.js       # Creditor types, stage configs, helpers
│   └── demoData.js        # Demo debts, mail, income
├── context/              # React context
│   └── LangContext.js     # Language/translation context
├── hooks/                # Custom React hooks
│   └── useLang.js         # Language context hook
├── styles/               # Styling
│   └── styles.js          # Inline style object
├── utils/                # Utilities
│   ├── helpers.js         # Formatting, storage, CSS
│   └── i18n.js            # Translations (NL/EN)
├── index.jsx             # Main app entry point
└── README.md
```

## Key Features

- **Debt Tracking**: Add, view, and organize debts by creditor and stage
- **Projections**: Visual chart showing debt growth over 3, 6, 12 months
- **Photo OCR**: Upload a letter/invoice for AI analysis (Claude API)
- **Correspondence Log**: Track all mail and documents
- **Calendar View**: See payments and income on a monthly calendar
- **Alerts**: Automatic notifications for urgent debts
- **Bilingual**: Dutch and English support
- **Persistent Storage**: Auto-save via window.storage API

## Component Responsibilities

| Component | Purpose |
|-----------|---------|
| **Dashboard** | Main overview with hero stats, trajectory, creditor breakdown |
| **DebtList** | Sortable list of all debts with quick actions |
| **DebtDetail** | Full debt record with correspondence history |
| **MailLog** | Chronological email/letter archive |
| **CalendarView** | Monthly grid with income and payment indicators |
| **Alerts** | List of urgent/escalated debts requiring action |
| **AddDebtModal** | Bottom sheet for adding debts (manual or photo) |

## Usage

```jsx
import SchuldOverzicht from "./schuld/index";

export default function App() {
  return <SchuldOverzicht />;
}
```

## Data Flow

1. Main component loads saved data from `window.storage`
2. Passes state down to child screens via props
3. Children call parent callbacks to update state
4. Changes auto-save to storage
5. Notifications re-computed whenever debts change
6. All UI reads from single i18n context

## Styling

All styles are inline JavaScript objects in `styles/styles.js`. CSS variables are set in global CSS for theming:
- `--bg`: Background color
- `--card-bg`: Card background
- `--text-primary`: Main text color
- `--text-secondary`: Muted text
- `--border-color`: Border and divider color
