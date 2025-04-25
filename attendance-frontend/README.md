# Frontend - Advanced Attendance Management System

This folder contains the **Angular 18** frontend for the Advanced Attendance Management System. The frontend interacts with the Django backend using **REST API** and provides various features for students, teachers, CRCs, and Superadmins to manage attendance and other functionalities efficiently.

## Tech Stack

- **Angular 18** - Frontend framework for building the application.
- **PrimeNG 17** - UI component library for rich UI elements like buttons, tables, charts, and more.
- **FontAwesome Icons** - For adding scalable vector icons to the UI.
- **User-Agent Parsing** - To gather device-related information such as device type, OS, and location.

## Key Features

### User Role-Based Login System

- **Superadmin Login**: 
  - The Superadmin can log in to manage faculty, academic years, branches, and other system-wide settings.
  - Redirected to the admin dashboard at: `http://localhost:4200/superadmin/`.

- **Student Login**:
  - Students can only log in via **mobile devices**. 
  - They undergo a multi-step registration process where personal details are collected, followed by face recognition registration, device registration, and then final data submission.

- **Teacher Login**:
  - Teachers log in with email and employee ID that are managed by the Superadmin.
  - Teachers can access their dashboards, manage attendance, and request approval for subject completion.
  
- **CRC Login**:
  - CRCs are also registered by the Superadmin but use the system to manage student attendance, subject requests from teachers, and overall reporting.

---

## Workflow Overview

### 1. Superadmin Panel

The **Superadmin** is responsible for adding key data to the system:
- **Add Faculty**: Add faculty members by email and employee ID. This allows them to register as teachers or CRCs.
- **Add Academic Year**: Set up the academic year for various courses and subject timelines.
- **Add Branches**: Set up different branches (e.g., Computer Science, Mechanical Engineering, etc.) for class management.
- Once the Superadmin registers this data, the **Teacher** and **CRC** can log in and use the system.

### 2. Teacher Panel

- **Teacher Registration**: 
  - Teachers are registered by email and employee ID, both of which are added by the Superadmin via the Django Admin panel.
  - Once registered, the teacher can log in and access the system.
  
- **Teacher Dashboard**:
  - Teachers can view and manage attendance for subjects assigned to them.
  - They can mark student attendance via **GPS** and **face recognition**.
  - Teachers can submit subject completion requests to CRC when a subject or semester ends.
  

### 3. CRC Panel

- **CRC Registration**:
  - CRCs are registered with details like the branch, year, semester, and academic year for the students they oversee.
  - The Superadmin manages this registration via the backend.

- **CRC Dashboard**:
  - CRCs can manage the overall timetable, attendance reports, and review subject completion requests from teachers.
  - CRCs approve or reject subject completion requests submitted by teachers once the semester or course ends.
  
### 4. Student Registration (Mobile Only)

Students can only register via **mobile devices**. The registration process is done in **four steps**:

1. **Step 1: Personal Details**:
   - Students enter personal information such as name, roll number, and course details.
  
2. **Step 2: Face Registration**:
   - Using the mobile device's camera, students must register their face for future **face recognition** attendance.
  
3. **Step 3: Device Registration**:
   - The system collects the student's device information, including device type and location using the **user-agent**.
  
4. **Step 4: Final Submission**:
   - After completing all steps, the system checks if the student is already registered.
   - If the student is new, their data is saved and they are successfully registered.
   - If the student is already registered, an error message is displayed, asking them to correct their data.

---

## How to Use the Frontend

### Setup Instructions

1. **Install Dependencies**:
   - Navigate to the project folder:
     ```bash
     cd attendance-system-frontend
     ```
   - Install all required dependencies using npm:
     ```bash
     npm install
     ```

2. **Run the Development Server**:
   - After installing the dependencies, run the Angular development server:
     ```bash
     ng serve
     ```
   - This will start the app on `http://localhost:4200/`. You can access the application by opening the URL in your browser.

---

## Application Flow

### Superadmin Login and Setup

- After running the app, access the Superadmin login page at:
  - `http://localhost:4200/superadmin/`
- **Login** using credentials that are added by the **Superadmin** via the Django admin panel.
- Once logged in, the Superadmin can add the following:
  - **Faculty**: Add new teachers and their details.
  - **Branches**: Define the academic branches.
  - **Academic Years**: Add academic years to map to subjects and schedules.

### Teacher and CRC Registration

- After the **Superadmin** adds the necessary details, **Teachers** can register using their **email** and **employee ID** (added by Superadmin).
- After registration, they can log in and access the attendance management system.
- Teachers can also be assigned as **CRCs** to manage subject completion requests.

### Student Registration

- Students will be able to register using mobile devices only. The registration process consists of the following steps:
  1. **Personal Details**
  2. **Face Registration**
  3. **Device Registration**
  4. **Final Submission**

- Based on their data, students will either be registered successfully or prompted for corrections if they are already in the system.

---

## Notes on Frontend Features

- The frontend uses **PrimeNG** components for rich UI, such as tables, forms, buttons, and dialogs.
- **FontAwesome** icons are used for adding visually appealing icons throughout the app.
- Device information such as device type, OS, and location is retrieved using the **User-Agent** for device-specific actions.

---

