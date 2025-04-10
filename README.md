# Real-time Chat Application

A real-time chat application built with React, Socket.IO, and Supabase for authentication and data persistence.

## Features

- Real-time messaging using Socket.IO
- User authentication with Supabase
- Message persistence in database
- User presence detection
- Email-based signup/login
- Responsive design

## Tech Stack

- **Frontend**: React.js
- **Backend**: 
  - Socket.IO for real-time communication
  - Supabase for authentication and database
- **Styling**: CSS
- **State Management**: React Hooks

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Chat_app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

## Database Schema

### user_chat Table
```sql
CREATE TABLE user_chat (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### messages Table
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## Project Structure

```
Chat_app/
├── src/
│   ├── components/
│   │   ├── Auth.js        # Authentication component
│   │   └── Chat.js        # Chat interface component
│   ├── App.js             # Main application component
│   ├── index.js           # Entry point
│   └── styles/            # CSS styles
├── public/
└── package.json
```

## Features Explanation

1. **Authentication**
   - Email-based signup/login
   - Password protection
   - Session management

2. **Chat Functionality**
   - Real-time message delivery
   - Message persistence
   - User presence indication
   - Timestamp for messages

3. **Data Storage**
   - Messages stored in Supabase
   - User profiles in user_chat table
   - Real-time sync with Socket.IO

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
