# MongoDB Setup for Audio Diary App

## The Problem
The app is failing because MongoDB is not connected. You're seeing this error:
```
MongooseError: Operation `users.findOne()` buffering timed out after 10000ms
```

## Solution: Choose One Option

### Option 1: MongoDB Atlas (Recommended - Free & Easy)

1. **Create a free account** at [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)

2. **Create a free cluster**:
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select a cloud provider and region
   - Click "Create"

3. **Create a database user**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Grant "Read and write to any database" role

4. **Whitelist your IP**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Confirm

5. **Get your connection string**:
   - Go back to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

6. **Update your `.env` file**:
   ```bash
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/diary?retryWrites=true&w=majority
   ```
   Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual values.

7. **Restart the server**:
   - Stop the current `npm run dev` (Ctrl+C)
   - Run `npm run dev` again

---

### Option 2: Local MongoDB (For Advanced Users)

1. **Install MongoDB**:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB**:
   ```bash
   brew services start mongodb-community
   ```

3. **Update your `.env` file**:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/diary
   ```

4. **Restart the server**:
   - Stop the current `npm run dev` (Ctrl+C)
   - Run `npm run dev` again

---

## Verify It's Working

After setting up MongoDB, you should see this in your terminal:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:3000
```

Then try registering again!
