# Backend - Advanced Attendance Management System

This folder contains the **Django REST Framework (DRF)** backend for the Advanced Attendance Management System.

## Tech Stack

- **Django 4.x**
- **Django REST Framework**
- **MySQL**
- **JWT Auth**
- **FaceAPI.js Integration**
- **Scheduled Scripts for Notifications**

## Core Modules

The backend consists of four primary modules:

1. **Superadmin**
    - Manages faculty, CRCs, and student data.
    - Adds faculty details (email, employee ID) and registers them into the system.

2. **Teacher**
    - Registers with faculty details and manages attendance for assigned subjects.
    - Submits subject completion requests to CRC when a subject/semester ends.

3. **CRC**
    - Registers by class with details such as branch, year, semester, and academic year.
    - Approves teacher-submitted subject completion requests.
    - Manages the timetable and attendance reports for students.

4. **Student**
    - Views personal timetable and marks attendance using GPS and face recognition.
    - Engages in gamified features, assignments, and chats with teachers.

## Workflow Overview

- **Superadmin** adds faculty members to the database (email, employee ID).
- **Faculty** registers with personal and subject details.
- **CRC** registration is handled per class, including branch, year, semester, and academic year.
- **Teacher** submits subject completion requests to CRC at the end of a subject/semester.
- **CRC** reviews and approves subject completion requests, closing the subject and adding it to the subject history.

## Environment Configuration

To securely store sensitive data such as email credentials and passwords, use environment variables in a `.env` file.

### Example `.env` File:
```bash
# .env file example

EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password
SECRET_KEY=your-django-secret-key
DEBUG=False

DB_NAME=databasename
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
```

### Steps to Configure:

1. **Install `python-dotenv`:**  
    If not already installed, run the following command:  
    ```bash
    pip install python-dotenv
    ```
    This package allows your Django project to read environment variables from the `.env` file.

2. **Install Dependencies:**  
    Run the following command to install the necessary packages:  
    ```bash
    pip install -r requirements.txt
    ```

3. **Make Migrations:**  
    Create the necessary database tables:  
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

4. **Create a Superuser:**  
    Set up an admin account to access the Django admin panel:  
    ```bash
    python manage.py createsuperuser
    ```
    Create a superuser: Create an admin account to access the Django admin panel:

    ```bash 
    python manage.py createsuperuser```
    
5.  **Initial Superadmin Setup**

        After creating the superuser, follow these steps to add the actual Superadmin for the system:

        1. Open your browser and go to the Django Admin Panel:  
            [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

        2. Log in using the superuser credentials you just created.

        3. In the admin dashboard, scroll down to the **Core** section and click on **Superadmin**.

        4. Click the **"Add"** button in the top right.

        5. Fill in the following details:  
            - **Name**  
            - **Email**  
            - **Password**

        6. Click **Save**.

        ✅ This will register the actual root-level Superadmin required to manage the system.

5. **Start the Development Server:**  
    Run the following command to start the Django development server:  
    ```bash
    python manage.py runserver
    ```

6. **Access the Application:**  
    Open your browser and navigate to [http://127.0.0.1:8000/](http://127.0.0.1:8000/) to access the system.