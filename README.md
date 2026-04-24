# Luxury Spa Backend

This repo contains the backend for the Luxury Spa booking app.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local `.env` file from `.env.example` and fill in your PostgreSQL credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/luxury_spa
   NODE_ENV=development
   EMAIL_USER=your@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. Start the backend:
   ```bash
   npm run dev
   ```

## Railway deployment

1. Create a new Railway project and connect your GitHub repo.
2. Use the default `main` branch.
3. Set these environment variables in Railway:
   - `DATABASE_URL`
   - `NODE_ENV=production`
   - `EMAIL_USER`
   - `EMAIL_PASS`

### Example Railway `DATABASE_URL`

```env
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
```

4. Railway will run `npm install` and `npm start`.
5. Use the deployed URL to connect your frontend.

## API endpoints

- `GET /api/services`
- `GET /api/services/:id`
- `POST /api/services`
- `PUT /api/services/:id`
- `DELETE /api/services/:id`
- `GET /api/bookings`
- `GET /api/bookings/availability?service_id=&date=`
- `POST /api/bookings`
- `PATCH /api/bookings/:id`
- `DELETE /api/bookings/:id`
- `GET /api/users`
- `POST /api/users`
