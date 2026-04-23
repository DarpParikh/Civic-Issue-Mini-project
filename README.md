# Civic Issue Mini Project

Spring Boot backend and React frontend in one repository.

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

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:8081/api
```

`frontend/.env` is ignored by git.

## Run The Project

Backend:

```bash
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Expected runtime ports:

- Backend: `8081`
- Frontend: `5174`

Frontend API calls read base URL from `VITE_API_URL`.
