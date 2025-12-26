# Telegram Bot Boilerplate

A production-ready Telegram bot built with **TypeScript**, **Telegraf**, and **Prisma ORM**.

## Features

- 🤖 Built with [Telegraf](https://telegraf.js.org/) - modern Telegram Bot API framework
- 📝 TypeScript for type safety and better developer experience
- 🗄️ Prisma ORM for database management
- 🔐 User authentication and data persistence
- 📊 Command logging and analytics
- ⚙️ User settings with inline keyboards
- 🛡️ Error handling and graceful shutdown
- 📦 Modular architecture with separation of concerns

## Project Structure

```
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── commands/          # Command handlers
│   │   ├── echo.command.ts
│   │   ├── help.command.ts
│   │   ├── me.command.ts
│   │   ├── settings.command.ts
│   │   ├── start.command.ts
│   │   ├── stats.command.ts
│   │   └── index.ts
│   ├── middleware/        # Bot middleware
│   │   ├── auth.middleware.ts
│   │   └── logging.middleware.ts
│   ├── services/          # Business logic
│   │   ├── command-log.service.ts
│   │   └── user.service.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   │   └── logger.ts
│   ├── bot.ts             # Bot configuration
│   ├── config.ts          # Environment config
│   ├── db.ts              # Database client
│   └── index.ts           # Entry point
├── .env.example           # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18+
- A Telegram Bot Token (get one from [@BotFather](https://t.me/botfather))

## Quick Start

### 1. Clone and Install

```bash
cd telegram-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your bot token:

```env
BOT_TOKEN=your_bot_token_here
DATABASE_URL="file:./dev.db"
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Create database and apply schema
npm run db:push
```

### 4. Run the Bot

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize the bot and see welcome message |
| `/help` | Show all available commands |
| `/me` | View your profile information |
| `/stats` | View bot statistics |
| `/settings` | Manage your preferences |
| `/echo <text>` | Echo back your message |
| `/notifications <on\|off>` | Toggle notifications |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in development mode with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## Database

This boilerplate uses SQLite by default for easy development. For production, switch to PostgreSQL:

### Switch to PostgreSQL

1. Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/telegram_bot"
```

3. Regenerate and migrate:

```bash
npm run db:generate
npm run db:migrate
```

## Architecture

### Middleware Chain

1. **Logging Middleware** - Logs all incoming updates
2. **Auth Middleware** - Creates/updates user in database
3. **Parse Args Middleware** - Extracts command arguments
4. **Command Logging** - Logs command usage to database

### Services

- **UserService** - User CRUD operations and statistics
- **CommandLogService** - Command logging and analytics

## Adding New Commands

1. Create a new file in `src/commands/`:

```typescript
// src/commands/mycommand.command.ts
import { BotContext } from "../types/index.js";

export async function myCommand(ctx: BotContext): Promise<void> {
  await ctx.reply("Hello from my command!");
}
```

2. Export from `src/commands/index.ts`:

```typescript
export { myCommand } from "./mycommand.command.js";
```

3. Register in `src/bot.ts`:

```typescript
import { myCommand } from "./commands/index.js";
// ...
bot.command("mycommand", myCommand);
```

4. Add to command menu in `setBotCommands()`:

```typescript
{ command: "mycommand", description: "My new command" }
```

## Production Deployment

### Using PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name telegram-bot
```

### Using Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
CMD ["node", "dist/index.js"]
```

## Best Practices

- ✅ Store sensitive data in environment variables
- ✅ Use Prisma migrations for production databases
- ✅ Implement proper error handling
- ✅ Log important events for debugging
- ✅ Validate user input before processing
- ✅ Use TypeScript strict mode
- ✅ Keep commands modular and testable

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Bot Tutorial](https://core.telegram.org/bots/tutorial)

## License

MIT

