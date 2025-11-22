Abios Academy — React Native Mobile Application










Abios Academy is a mobile application designed for personal trainers and their clients. The platform enables clients to connect with their trainer, access personalized workout videos, complete assigned tasks, and track their progress. Trainers can upload exercise videos, manage clients, and monitor their activity through an admin dashboard.

🚀 Features
👥 User Management

Secure authentication using Supabase Auth

Separate screens for:

Clients

Personal Trainer (Admin)

🎥 Exercise Video Management

Trainers can upload exercise videos using Supabase Storage

Clients can view assigned exercise videos

Includes built-in placeholders and thumbnails

📊 Progress Tracking

Clients mark tasks as complete

Trainer can monitor client progress in real-time

🔐 Backend & Cloud

Supabase Auth for secure login/signup

PostgreSQL database (via Supabase) for users, tasks, and progress

Supabase Storage for video uploads


🛠️ Tech Stack
Frontend

React Native (Expo)

React Navigation

Context API

Backend

Supabase

Auth

PostgreSQL

Storage

📲 Getting Started
Prerequisites

Node.js LTS

Yarn or npm

Expo CLI

Supabase project

1. Clone the repository
git clone https://github.com/your-username/abios-academy.git
cd abios-academy

2. Install dependencies
npm install

3. Add your Supabase credentials

Create a .env file:

EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key

4. Run the app
expo start

🧪 Environment Setup

Create the required tables and storage buckets in Supabase:

Tables (recommended):

profiles

tasks

videos

progress

Storage:

videos bucket (public or authenticated)

👨‍💻 Author

Teboho Moloi
React Native Developer | Full Stack Developer

📄 License

MIT License
