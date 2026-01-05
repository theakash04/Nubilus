# Nubilus Frontend

The web dashboard for Nubilus infrastructure monitoring platform.

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Routing:** TanStack Router (file-based routing)
- **State Management:** TanStack Query
- **Styling:** Tailwind CSS v4
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Testing:** Vitest + Testing Library
- **Linting/Formatting:** Biome

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run test`    | Run tests                |
| `npm run lint`    | Lint code with Biome     |
| `npm run format`  | Format code with Biome   |
| `npm run check`   | Run all Biome checks     |

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations
├── lib/            # Utilities, API clients, types
├── routes/         # File-based routes (TanStack Router)
└── styles.css      # Global styles
```

## Documentation

For full documentation, visit [nubilus-docs.akashtwt.me](https://nubilus-docs.akashtwt.me)

## License

MIT License
