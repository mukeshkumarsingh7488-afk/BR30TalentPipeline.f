# BR30 Talent Pipeline — Frontend

<p align="center">
  <strong>A Modern Recruitment & Applicant Tracking Platform</strong>
</p>

<p align="center">
  Manage job roles, candidates, applications, interviews and recruitment workflows through a centralized hiring dashboard.
</p>

<p align="center">
  Built with React, Vite and a modular API-driven architecture.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Frontend Architecture](#frontend-architecture)
- [Complete Folder Structure](#complete-folder-structure)
- [Application Modules](#application-modules)
- [Application Routes](#application-routes)
- [Authentication and Access Control](#authentication-and-access-control)
- [API Integration](#api-integration)
- [Public Application Forms](#public-application-forms)
- [Theme Management](#theme-management)
- [Environment Configuration](#environment-configuration)
- [Installation](#installation)
- [Development](#development)
- [Production Build](#production-build)
- [Deployment on Vercel](#deployment-on-vercel)
- [Error Handling and Troubleshooting](#error-handling-and-troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Development Guidelines](#development-guidelines)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## Overview

**BR30 Talent Pipeline** is a recruitment management and applicant tracking application developed under BR30 Group.

The frontend provides an interface for managing job roles, departments, candidates, applications, interviews, recruitment reports and public application forms.

The application is built using React and Vite, with React Router DOM for client-side navigation and a dedicated HTTP client for communication with the backend API.

The frontend and backend are maintained as separate applications. Recruitment data, authentication, business rules, file uploads and application processing are handled through backend services.

### Project Information

| Property             | Details                    |
| -------------------- | -------------------------- |
| Project              | BR30 Talent Pipeline       |
| Application          | Frontend Web Application   |
| Architecture         | React SPA                  |
| Build Tool           | Vite                       |
| Language             | JavaScript and JSX         |
| Routing              | React Router DOM           |
| HTTP Client          | Native Fetch API           |
| Authentication State | React Context              |
| Theme Management     | React Context              |
| Backend              | Node.js and Express        |
| Database             | MongoDB                    |
| Frontend Hosting     | Vercel                     |
| Backend Hosting      | Compatible Node.js hosting |
| Frontend Directory   | `BR30TalentPipeline-F`     |

---

## Key Features

### 1. Recruitment Dashboard

- Centralized recruitment workspace.
- Dashboard overview.
- Quick access to recruitment modules.
- Recruitment activity visibility.
- Data loaded through the backend API.

### 2. Job Role Management

- View job roles.
- Create and manage job-role records.
- Organize recruitment opportunities.
- Work with the backend's job-role and department data.

### 3. Department Management

- View departments.
- Create and manage department records.
- Organize hiring operations by department.
- Use department data when configuring recruitment forms.

### 4. Candidate Management

- View candidate records.
- Search and review candidate information.
- Open individual candidate details.
- Access candidate-related application information.

### 5. Application Management

- View submitted applications.
- Open individual application details.
- Review applicant information.
- Work with application statuses.
- Access the recruitment application pipeline.

### 6. Public Application Forms

- Public application form access without requiring an applicant account.
- Published form management.
- Public form links.
- Form availability and status management.
- Resume PDF upload.
- Optional profile photo and cover letter support, where enabled.
- Application submission through the backend API.

### 7. Interview Management

- Access interview records.
- Review interview-related information.
- Coordinate recruitment interviews through the available interface.

### 8. Reports

- Recruitment reports.
- Candidate and application reporting interfaces.
- Access to data supplied by the backend reporting endpoints.

### 9. Authentication

- Login.
- Registration.
- Email verification.
- Forgot password.
- Password reset.
- Protected dashboard access.
- Role-based access eligibility.

### 10. Search

- Dedicated search results page.
- Recruitment data discovery through the available search interface.

### 11. Activity Log

- View recruitment-related activity records.
- Review activity information supplied by the backend.

### 12. Settings and Theme

- User settings interface.
- Light theme.
- Dark theme.
- Device-preference theme.
- Persistent theme selection.

---

## Technology Stack

| Technology       | Purpose                                   |
| ---------------- | ----------------------------------------- |
| React            | Component-based user interface            |
| Vite             | Development server and production bundler |
| JavaScript       | Application logic                         |
| JSX              | React component markup                    |
| React Router DOM | Client-side routing                       |
| Fetch API        | Backend HTTP communication                |
| React Context    | Authentication and theme state            |
| CSS              | Styling and responsive layouts            |
| npm              | Dependency and script management          |
| Node.js          | Frontend development tooling              |

Exact dependency versions and available npm scripts are defined in `package.json` and `package-lock.json`.

---

## Frontend Architecture

BR30 Talent Pipeline follows a separated frontend and backend architecture.

```text
                BR30 Talent Pipeline
                         |
               React + Vite Frontend
                         |
                  React Router
                         |
             Pages and Shared Layouts
                         |
               Context and API Clients
                         |
                   HTTP Fetch API
                         |
                  Backend REST API
                         |
                Express Controllers
                         |
                 Recruitment Services
                         |
                      MongoDB
```

### Frontend responsibilities

- Render recruitment interfaces.
- Handle client-side navigation.
- Manage authentication and theme state.
- Collect and validate user input.
- Send API requests.
- Display loading, success and error states.
- Provide public application forms.
- Present recruitment information returned by the backend.

### Backend responsibilities

- Authenticate users.
- Authorize administrative and HR operations.
- Manage departments and job roles.
- Validate applications and candidate data.
- Process resume and file uploads.
- Store recruitment records.
- Enforce application and publishing rules.
- Return API responses to the frontend.

The frontend must not be treated as the authority for access permissions, application eligibility or published-form status. These rules must be enforced by the backend.

---

## Complete Folder Structure

The following tree documents the frontend `src` archive and the root files visible in the supplied project screenshot.

```text
BR30TalentPipeline-F/
│
├── node_modules/                     # Installed dependencies
├── public/                            # Public static assets
│
├── src/
│   │
│   ├── api/
│   │   ├── activity.api.js            # Activity API
│   │   ├── application.api.js         # Application API
│   │   ├── auth.api.js                # Authentication API
│   │   ├── candidate.api.js           # Candidate API
│   │   ├── dashboard.api.js           # Dashboard API
│   │   ├── department.api.js          # Department API
│   │   ├── http.js                    # Shared HTTP client
│   │   ├── interview.api.js           # Interview API
│   │   ├── job-role.api.js            # Job-role API
│   │   └── public-form.api.js         # Public-form API
│   │
│   ├── context/
│   │   ├── AuthContext.jsx            # Authentication state
│   │   └── ThemeContext.jsx           # Theme state and persistence
│   │
│   ├── layouts/
│   │   ├── AuthLayout.jsx             # Authentication layout
│   │   └── DashboardLayout.jsx        # Protected dashboard layout
│   │
│   ├── pages/
│   │   │
│   │   ├── activity/
│   │   │   └── ActivityLog.jsx
│   │   │
│   │   ├── applications/
│   │   │   ├── ApplicationDetails.jsx
│   │   │   ├── Applications.jsx
│   │   │   ├── PublicApplicationForm.jsx
│   │   │   └── PublishForms.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── VerifyEmail.jsx
│   │   │
│   │   ├── candidates/
│   │   │   ├── CandidateDetails.jsx
│   │   │   └── Candidates.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── departments/
│   │   │   └── Departments.jsx
│   │   │
│   │   ├── interviews/
│   │   │   └── Interviews.jsx
│   │   │
│   │   ├── job-roles/
│   │   │   └── JobRoles.jsx
│   │   │
│   │   ├── reports/
│   │   │   └── Reports.jsx
│   │   │
│   │   ├── search/
│   │   │   └── SearchResults.jsx
│   │   │
│   │   └── settings/
│   │       └── Settings.jsx
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.jsx         # Protected route guard
│   │   └── PublicRoute.jsx            # Public/auth route guard
│   │
│   ├── App.css                        # Application styling
│   ├── App.jsx                        # Application routes
│   ├── index.css                      # Global styles
│   └── main.jsx                       # React entry point
│
├── .env                               # Local environment variables
├── .env.example                       # Environment template
├── .gitignore
├── index.html                         # HTML entry point
├── package.json                       # Scripts and dependencies
├── package-lock.json                  # Dependency lockfile
├── README.md                          # Project documentation
├── vercel.json                        # Vercel deployment configuration
└── vite.config.js                     # Vite configuration
```

**Important:** `node_modules/` is generated by npm and should not be committed to Git. The `.env` file must remain private.

---

## Application Modules

| Module                  | Main file                                      |
| ----------------------- | ---------------------------------------------- |
| Dashboard               | `pages/dashboard/Dashboard.jsx`                |
| Job roles               | `pages/job-roles/JobRoles.jsx`                 |
| Departments             | `pages/departments/Departments.jsx`            |
| Candidates              | `pages/candidates/Candidates.jsx`              |
| Candidate details       | `pages/candidates/CandidateDetails.jsx`        |
| Applications            | `pages/applications/Applications.jsx`          |
| Application details     | `pages/applications/ApplicationDetails.jsx`    |
| Public application form | `pages/applications/PublicApplicationForm.jsx` |
| Published forms         | `pages/applications/PublishForms.jsx`          |
| Interviews              | `pages/interviews/Interviews.jsx`              |
| Reports                 | `pages/reports/Reports.jsx`                    |
| Search                  | `pages/search/SearchResults.jsx`               |
| Activity log            | `pages/activity/ActivityLog.jsx`               |
| Settings                | `pages/settings/Settings.jsx`                  |

---

## Application Routes

Routes are configured in:

`src/App.jsx`

The application uses React Router DOM.

### Public application routes

| Path           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `/apply`       | Public application form                             |
| `/f/:publicId` | Public application form identified by its public ID |

These routes do not require an authenticated HR or administrator session.

### Authentication routes

| Path               | Purpose            |
| ------------------ | ------------------ |
| `/`                | Login              |
| `/register`        | Registration       |
| `/verify-email`    | Email verification |
| `/forgot-password` | Password recovery  |
| `/reset-password`  | Password reset     |

Authentication pages use `AuthLayout.jsx` and the public-route guard.

### Protected dashboard routes

| Path                | Purpose                |
| ------------------- | ---------------------- |
| `/dashboard`        | Recruitment dashboard  |
| `/job-roles`        | Job-role management    |
| `/candidates`       | Candidate management   |
| `/candidates/:id`   | Candidate details      |
| `/applications`     | Application management |
| `/applications/:id` | Application details    |
| `/departments`      | Department management  |
| `/interviews`       | Interview management   |
| `/reports`          | Recruitment reports    |
| `/publish-forms`    | Public form management |
| `/settings`         | User settings          |
| `/search`           | Search results         |
| `/activity`         | Activity log           |

Protected pages use `ProtectedRoute.jsx` and `DashboardLayout.jsx`.

Unknown routes redirect to `/`.

---

## Authentication and Access Control

Authentication logic is maintained in:

```text
src/
├── api/
│   └── auth.api.js
├── context/
│   └── AuthContext.jsx
├── layouts/
│   └── AuthLayout.jsx
└── routes/
    ├── ProtectedRoute.jsx
    └── PublicRoute.jsx
```

### Authentication features

- Login and registration.
- Email verification.
- Password recovery and reset.
- Authentication state management.
- Session persistence in browser storage.
- Protected dashboard access.

### Supported account roles

The current authentication context recognizes:

- `ADMIN`
- `HR`

The HR role must have an approved account before accessing the dashboard. The frontend also checks account activation and email-verification status.

These checks improve the user experience but do not replace backend authorization.

### Session storage

The authentication context uses the following browser storage keys:

```text
br30-talent-pipeline-token
br30-talent-pipeline-user
```

The token is attached to protected API requests through the shared HTTP client.

Because browser local storage is accessible to JavaScript, it should not be treated as a secure secret vault. Review token lifetime, refresh behavior, XSS protections and the overall authentication design as part of production security maintenance.

---

## API Integration

API clients are organized under:

`src/api/`

The shared HTTP client is:

`src/api/http.js`

### API base URL

The frontend reads:

```text
VITE_API_BASE_URL
```

If this variable is not configured, the current default is:

```text
http://localhost:5000/api/v1
```

### Available API clients

| File                 | Responsibility                          |
| -------------------- | --------------------------------------- |
| `http.js`            | Shared HTTP requests and error handling |
| `auth.api.js`        | Authentication                          |
| `dashboard.api.js`   | Dashboard data                          |
| `job-role.api.js`    | Job roles                               |
| `department.api.js`  | Departments                             |
| `candidate.api.js`   | Candidates                              |
| `application.api.js` | Applications                            |
| `public-form.api.js` | Public forms and submissions            |
| `interview.api.js`   | Interviews                              |
| `activity.api.js`    | Activity records                        |

### HTTP client behavior

The shared HTTP client:

- Uses the Fetch API.
- Builds requests from the configured API base URL.
- Supports query parameters.
- Attaches the saved bearer token when available.
- Supports JSON request bodies.
- Supports `FormData` uploads.
- Supports abort signals.
- Supports blob responses for file-related operations.
- Parses JSON responses.
- Converts failed HTTP responses into JavaScript errors.
- Provides readable connection-error messages.

### Example

```javascript
import http from "./http.js";

const response = await http.get("/job-roles");
```

Use the relevant module-specific API client when extending existing features.

### Error handling

The shared HTTP client exposes failed requests as errors and includes the HTTP status and response data where available.

Pages should handle loading, success, empty and error states without hiding meaningful backend error messages.

---

## Public Application Forms

Public form UI:

`src/pages/applications/PublicApplicationForm.jsx`

Form management UI:

`src/pages/applications/PublishForms.jsx`

Public form API client:

`src/api/public-form.api.js`

### Public form workflow

1. An authorized HR user accesses the dashboard.
2. The user configures a form for an eligible job role.
3. The form is published through the backend.
4. The backend provides a public form URL.
5. An applicant opens the URL without logging in.
6. The frontend retrieves the published form configuration.
7. The applicant enters their details and uploads the required resume.
8. The frontend submits the application to the backend.
9. The backend validates the request and processes the application.
10. The application becomes available through the recruitment management interface.

### Public form endpoints

The frontend API client includes operations for:

- Listing forms.
- Creating forms.
- Updating forms.
- Changing form status.
- Deleting forms.
- Retrieving a public form.
- Retrieving public job roles.
- Submitting applications.

The exact endpoint paths and request formats are maintained in `src/api/public-form.api.js`.

### Performance considerations

Public application forms should load quickly, particularly for applicants accessing them from mobile devices.

When investigating a slow public form:

1. Open browser Developer Tools.
2. Select Network.
3. Open the public form URL.
4. Inspect the form retrieval request.
5. Review request duration, Waiting (TTFB) and response size.
6. Check backend logs and database queries if the request is slow.
7. Verify that unrelated background processing does not unnecessarily block form retrieval.

The frontend should not use artificial delays or reduced timeouts to disguise slow backend responses.

---

## Theme Management

Theme logic is maintained in:

`src/context/ThemeContext.jsx`

### Supported themes

- `light`
- `dark`
- `device`

### Theme behavior

- The initial theme preference is loaded from local storage.
- The default preference is `device`.
- Device mode follows the operating system's color scheme.
- Explicit light and dark selections are persisted.
- System theme changes are observed while device mode is active.
- The resolved theme is applied to the document root.

Theme preference is stored under:

```text
br30-talent-pipeline-theme
```

When modifying theme behavior, preserve the existing context interface and verify all dashboard layouts and authentication pages.

---

## Environment Configuration

Create or update the root `.env` file.

### Local development

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Production example

```dotenv
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN/api/v1
```

Replace the placeholder with the actual deployed backend API URL.

### Environment variable guidelines

- Vite exposes variables prefixed with `VITE_` to browser-side code.
- Never place MongoDB credentials, JWT signing secrets, SMTP credentials or payment gateway secrets in frontend variables.
- Frontend environment variables are not private.
- Restart the Vite development server after changing `.env`.
- Update production environment variables in the hosting dashboard.
- Keep `.env` out of Git.

The backend must independently validate and protect its own environment variables.

---

## Installation

### Prerequisites

Install:

- Node.js compatible with the project's Vite version.
- npm.
- Git.
- A code editor such as Visual Studio Code.
- Access to the BR30 Talent Pipeline backend API.

### Step 1: Open the frontend project

```bash
cd BR30TalentPipeline-F
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure environment variables

Create the root `.env` file:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Ensure the backend is running and reachable.

### Step 4: Start the development server

```bash
npm run dev
```

Vite displays the local development URL in the terminal, usually:

```text
http://localhost:5173
```

Open that URL in your browser.

---

## Development

### Available commands

The actual npm scripts are defined in `package.json`.

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Creates the production build.

```bash
npm run preview
```

Previews the production build locally.

Run the following command to inspect all available scripts:

```bash
npm run
```

### Recommended workflow

1. Start the backend.
2. Start the frontend.
3. Log in with a valid test account.
4. Open the relevant recruitment module.
5. Test the full user workflow.
6. Inspect the browser Console and Network tabs.
7. Verify API responses and saved data.
8. Run the production build before committing changes.

---

## Production Build

Create the production build:

```bash
npm run build
```

Vite normally generates the production assets in:

```text
dist/
```

### Build verification checklist

- [ ] Build completes successfully.
- [ ] No missing import errors.
- [ ] No JSX syntax errors.
- [ ] Environment variables point to the correct backend.
- [ ] Authentication works.
- [ ] Protected dashboard routes work.
- [ ] Public application forms load.
- [ ] Application submission works.
- [ ] Resume upload works.
- [ ] Browser refresh works on supported routes.
- [ ] No unexpected runtime errors appear in the browser Console.

---

## Deployment on Vercel

The frontend can be deployed separately from the backend.

### Deployment steps

1. Push the frontend repository to GitHub.
2. Import the repository into Vercel.
3. Select Vite as the framework if prompted.
4. Set the project root to the frontend root.
5. Configure the build command as `npm run build`.
6. Configure the output directory as `dist`.
7. Add `VITE_API_BASE_URL` to Vercel environment variables.
8. Deploy the application.
9. Test the live application and backend connectivity.

### SPA routing

The project includes a root `vercel.json` file.

Ensure that direct navigation and browser refreshes work for React Router routes, especially:

- `/dashboard`
- `/applications`
- `/candidates`
- `/publish-forms`
- `/f/:publicId`

The deployment rewrite should serve the frontend entry point for application routes while allowing API requests to reach the backend.

### CORS configuration

The backend must allow requests from the deployed frontend origin.

Configure the actual production frontend domain and any explicitly authorized development origins. Do not permit arbitrary origins for authenticated requests.

---

## Error Handling and Troubleshooting

### 1. Unable to connect to the backend

Possible causes:

- Backend server is stopped.
- Incorrect `VITE_API_BASE_URL`.
- CORS configuration is incorrect.
- Backend hosting service is unavailable.
- Network connection failed.

Check the configured URL and browser Network tab first.

### 2. Public form fails to load

Check:

- The public form URL.
- The public ID supplied to the route.
- The public form GET request.
- Backend publishing status.
- Backend API logs.
- The form response returned by the server.

### 3. Application submission fails

Check:

- Required fields.
- Resume file type and size.
- Network request payload.
- Backend validation response.
- File upload configuration.
- Published form eligibility.
- Job-role and department status.

### 4. Login fails

Check:

- Email and password.
- Backend authentication response.
- Account activation status.
- Email verification status.
- HR approval status.
- Token response format.
- Browser storage availability.

### 5. Dashboard redirects to login

Check:

- Saved authentication token.
- Saved user information.
- `ProtectedRoute.jsx`.
- `AuthContext.jsx`.
- Backend authentication status.

Do not disable authentication checks to work around session issues.

### 6. Theme does not persist

Check:

- `ThemeContext.jsx`.
- The saved `br30-talent-pipeline-theme` value.
- Browser storage permissions.
- Theme-related CSS variables and document-root classes.

### 7. Production build fails

Run:

```bash
npm install
npm run build
```

Resolve missing imports, invalid JSX and other build errors before deployment.

---

## Security Best Practices

- Never commit `.env` files containing secrets.
- Do not expose backend credentials in frontend code.
- Enforce authentication and authorization on the backend.
- Validate all submitted application data on the server.
- Apply appropriate file upload limits and validation.
- Verify public form status on the backend.
- Use HTTPS in production.
- Configure CORS with trusted origins.
- Avoid exposing sensitive server errors.
- Protect user and candidate information.
- Review token storage and session expiration behavior.
- Apply appropriate rate limits to public application and authentication endpoints.
- Do not rely on hidden UI elements or client-side route protection as security boundaries.

---

## Development Guidelines

### Adding a new page

1. Create the page under the appropriate `src/pages/` directory.
2. Create or reuse the corresponding API client.
3. Register the route in `src/App.jsx`.
4. Apply the existing layout and styling.
5. Implement loading, success, empty and error states.
6. Verify authentication and authorization behavior.
7. Test the complete workflow against the backend.

### Adding a new API operation

1. Identify the relevant module API file.
2. Reuse the shared HTTP client in `src/api/http.js`.
3. Match the backend endpoint and request format.
4. Handle successful and failed responses.
5. Avoid duplicating token-handling logic.
6. Test the request using the browser Network panel.

### Modifying existing functionality

- Inspect the existing implementation before changing it.
- Keep modifications focused.
- Preserve existing UI and route behavior.
- Avoid unnecessary global CSS changes.
- Verify related recruitment workflows.
- Run the production build before committing.

### Git workflow

```bash
git status
git add .
git commit -m "Describe the frontend change"
git push
```

Review staged files before committing. Ensure that `.env` and other sensitive configuration files are not included.

---

## Future Roadmap

Potential improvements for BR30 Talent Pipeline include:

- Expanded recruitment analytics.
- Improved applicant tracking workflows.
- Enhanced interview scheduling.
- Additional search and filtering capabilities.
- Better mobile application experiences.
- Automated frontend testing.
- Improved accessibility and keyboard navigation.
- Enhanced application form performance.
- Additional reporting and export options.
- Improved error monitoring.
- Further UI and responsive design refinements.

These items represent potential future improvements, not a claim that every feature is already implemented.

---

## License

Copyright © BR30 Group.

All rights reserved unless a separate license is supplied with the repository.

Unauthorized redistribution, commercial reuse or modification may be restricted by the applicable project ownership terms.

---

<p align="center">
  <strong>Built with ❤️ by BR30 Group</strong>
</p>

<p align="center">
  Building practical digital products for modern businesses.
</p>
