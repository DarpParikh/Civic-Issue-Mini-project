# Civic Issue Mini Project

Full-stack civic issue reporting platform with a Spring Boot REST backend and a React (Vite) frontend. Users can submit complaints, view dashboard data, and manage complaint lifecycle through API-driven flows.

The repository is now deployment-ready for Render with Docker. The backend can run as a standalone container from the root Dockerfile, and the frontend can be built separately from `frontend/Dockerfile`.

## Project Structure

- `/src` - Spring Boot backend source
- `/frontend` - React + Vite frontend app
- `/pom.xml` - backend build file

## Environment Variables

Backend requires:

- `OPENAI_API_KEY`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `PORT` is optional locally, but Render will provide it automatically.

Frontend requires:

- `VITE_API_URL=http://localhost:8080/api`

For production or Render builds, set `VITE_API_URL` to the deployed backend URL or to `/api` when frontend and backend are served from the same origin.

Create local env files from the examples:

- `frontend/.env.example` -> copy to `frontend/.env`

Backend runtime config is already included in `src/main/resources/application.properties` and reads secrets from environment variables.

Use `frontend/.env` with:

```env
VITE_API_URL=http://localhost:8080/api
```

`frontend/.env` is ignored by git.

## Backend Setup

Set required backend environment variables in your terminal before startup:

```bash
export OPENAI_API_KEY=your_key_here
export SPRING_MAIL_USERNAME=your_email_here
export SPRING_MAIL_PASSWORD=your_password_here
```

Run backend:

```bash
mvn spring-boot:run
```

Or run the packaged jar:

```bash
java -jar target/*.jar
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Expected runtime ports:

- Backend: `8080`
- Frontend: `5174`

Frontend API calls read base URL from `VITE_API_URL`.

## Docker And Render

Backend Docker build:

```bash
docker build -t civic-backend .
docker run -p 8080:8080 \
	-e OPENAI_API_KEY=your_key \
	-e SPRING_MAIL_USERNAME=your_email \
	-e SPRING_MAIL_PASSWORD=your_password \
	civic-backend
```

Frontend Docker build:

```bash
cd frontend
docker build -t civic-frontend --build-arg VITE_API_URL=/api .
```

Render environment variables:

- `OPENAI_API_KEY`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `VITE_API_URL` for the frontend service, if deployed separately
