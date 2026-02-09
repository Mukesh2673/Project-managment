# Project Management Tool

A modern, attractive project management tool built with Next.js, TypeScript, and Tailwind CSS. Manage your project tickets with an intuitive Kanban board interface.

## Features

- 🎯 **Ticket Management**: Create, edit, and delete tickets
- 📊 **Status Tracking**: Organize tickets by status (To Do, In Progress, Review, Done)
- 🏷️ **Priority Levels**: Assign priority levels (Low, Medium, High) to tickets
- 👤 **Assignee Support**: Assign tickets to team members
- 🎨 **Modern UI**: Beautiful, responsive design with dark theme
- 💾 **MySQL Database**: Robust MySQL database for data persistence
- 🖱️ **Drag & Drop**: Intuitive drag-and-drop to change ticket status
- 🔍 **Filtering**: Filter tickets by priority level
- 🚀 **Production Ready**: Complete deployment guide included

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- MySQL 8.0+ (for production)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize database:
```bash
# Create database and user in MySQL
mysql -u root -p < database/schema.sql
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

Quick deployment steps:
1. Build the application: `npm run build`
2. Start with PM2: `pm2 start ecosystem.config.js`
3. Configure Nginx as reverse proxy
4. Setup SSL with Let's Encrypt

## Project Structure

```
├── app/
│   ├── api/
│   │   └── tickets/
│   │       ├── route.ts           # GET all, POST create
│   │       └── [id]/
│   │           └── route.ts       # GET, PUT, DELETE single ticket
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main page with Kanban board
│   └── globals.css                # Global styles
├── components/
│   ├── TicketCard.tsx             # Individual ticket card component
│   ├── TicketModal.tsx            # Modal for creating/editing tickets
│   └── StatusColumn.tsx            # Column component for each status
├── lib/
│   ├── api.ts                     # API client utilities
│   ├── constants.ts               # Status columns and color constants
│   └── db.ts                      # Database/storage layer
├── types/
│   └── index.ts                   # TypeScript type definitions
├── data/
│   └── tickets.json               # JSON file storage (auto-created)
└── package.json                   # Dependencies and scripts
```

## API Endpoints

The backend provides RESTful API endpoints:

- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets/[id]` - Get a single ticket
- `PUT /api/tickets/[id]` - Update a ticket
- `DELETE /api/tickets/[id]` - Delete a ticket

### Data Storage

Tickets are stored in `data/tickets.json` (created automatically on first use). This can be easily upgraded to a database (PostgreSQL, MongoDB, etc.) by modifying `lib/db.ts`.

## Usage

1. **Create a Ticket**: Click the "New Ticket" button or the "+" button in any status column
2. **Edit a Ticket**: Click the edit icon on any ticket card
3. **Delete a Ticket**: Click the delete icon on any ticket card
4. **Change Status**: Edit a ticket and select a new status from the dropdown
5. **Filter Tickets**: Use the priority filter buttons to view tickets by priority

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **MySQL**: Relational database management system
- **Lucide React**: Beautiful icon library
- **date-fns**: Date formatting utilities
- **@dnd-kit**: Drag and drop functionality

## License

MIT
