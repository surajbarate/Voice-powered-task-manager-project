# 🎙️ Voice-Powered Task Manager

Task management applications play a crucial role in improving productivity and organization.  
The **Voice-Powered Task Manager** enhances the traditional task management system by allowing users to **create, update, and delete tasks using voice commands**, reducing manual effort and improving accessibility.

This application integrates **speech recognition technology** to convert voice input into actionable tasks. Users can manage their daily activities efficiently through a **secure, real-time, and user-friendly platform**. The system also includes **authentication, protected routes, and personalized task storage**, ensuring data privacy and security.


The application is developed using:
- **React.js** for frontend user interaction  
- **Node.js & Express.js** for backend API handling  
- **Firebase Authentication** for secure login & signup  
- **Firebase Firestore** for real-time task storage  

Together, these technologies create a seamless experience with **real-time task updates**, **voice-controlled operations**, and **secure cloud-based data management**.

---

## 🚀 Tech Stack

![React](https://img.shields.io/badge/React.js-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## 🧪 Installation & Setup Guide

### 🔁 Clone the Repository

```bash
git clone https://github.com/surajbarate/Voice-powered-task-manager-project.git
cd Voice-powered-task-manager-project
```

---

### ⚙️ Backend Setup (Python)

```bash
cd backend
npm install
node index.js
```

---

### 💻 Frontend Setup (React.js)

> Open a new terminal:

```bash
cd frontend
npm install
npm start
```


📆 Your project is now running successfully!

---

## 📂 Environment Variables

### 🔐 Backend `.env`

```env
GEMINI_API_KEY=
```

---
🔐 Firebase Configuration Notice:
This project uses Google Firebase for authentication and database services.
To run the application locally, users must provide their own Firebase configuration keys.

Before running the project, please create a Firebase project in the Firebase Console and add your configuration values in a firebase.js and firebase-messaging-sw.js in public in frontend file. and for notification also you need a public-vapid-key and use in notification.js.
