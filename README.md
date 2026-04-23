# Civic Issue Mini Project

Full-stack civic issue reporting platform with a Spring Boot REST backend and a React (Vite) frontend. Users can submit complaints, view dashboard data, and manage complaint lifecycle through API-driven flows.

## Project Structure

- `/src` - Spring Boot backend source
- `/frontend` - React + Vite frontend app
- `/pom.xml` - backend build file

## Environment Variables

Backend requires:

- `OPENAI_API_KEY`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`

Frontend requires:

- `VITE_API_URL=http://localhost:8081/api`

Create local env files from the examples:

- `frontend/.env.example` -> copy to `frontend/.env`

Backend runtime config is already included in `src/main/resources/application.properties` and reads secrets from environment variables.

Use `frontend/.env` with:

```env
VITE_API_URL=http://localhost:8081/api
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

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Expected runtime ports:

- Backend: `8081`
- Frontend: `5174`

Frontend API calls read base URL from `VITE_API_URL`.
