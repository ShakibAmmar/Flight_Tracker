# Flight Tracker Deployment

Recommended production setup:

- Frontend: Vercel
- Backend: Render Web Service
- Database: MongoDB Atlas

## 1. MongoDB Atlas

1. Create an Atlas cluster.
2. Create a database user.
3. Add a network access rule. For Render, use `0.0.0.0/0` if you do not have a fixed outbound IP.
4. Copy the connection string and set the database name to `flightTracker`.

Backend environment variable:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flightTracker
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
```

## 2. Render Backend

Create a new Render Web Service from this GitHub repository.

Settings:

- Root Directory: `backend`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`

Add environment variables from `backend/.env.example`.

After deployment, copy the Render backend URL. It will look like:

```text
https://your-service-name.onrender.com
```

## 3. Vercel Frontend

Create a Vercel project from this GitHub repository.

Settings:

- Root Directory: `frontend`
- Framework Preset: Create React App
- Build Command: `npm run build`
- Output Directory: `build`

Add environment variables:

```env
REACT_APP_API_URL=https://your-service-name.onrender.com
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 4. Firebase

In Firebase Console, add the deployed Vercel domain to:

Authentication -> Settings -> Authorized domains

Add both:

- `your-project.vercel.app`
- any custom domain you connect later

## 5. Local Development

Backend:

```powershell
cd backend
npm install
npm start
```

Frontend:

```powershell
cd frontend
npm install
npm start
```

If `REACT_APP_API_URL` is not set locally, the frontend defaults to `http://localhost:5000`.
