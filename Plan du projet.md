# API REST - Gestion de Tâches Collaborative

## 📋 Vue d'ensemble du projet

API backend pour gérer des projets et tâches en mode collaboratif avec authentification et permissions.

## 🛠 Stack Technique

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Base de données:** MySQL + Sequelize ORM
- **Authentification:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Sécurité:** bcryptjs, helmet, cors
- **Documentation:** Swagger/OpenAPI (optionnel mais recommandé)
- **Tests:** Jest + Supertest (optionnel)

## 📁 Structure du projet

```
task-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── helpers.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

## 🎯 Fonctionnalités principales

### 1. Authentification
- ✅ Inscription utilisateur
- ✅ Connexion (retour token JWT)
- ✅ Profil utilisateur
- ✅ Modification profil

### 2. Gestion des Projets
- ✅ Créer un projet
- ✅ Lister ses projets
- ✅ Voir détails d'un projet
- ✅ Modifier un projet
- ✅ Supprimer un projet
- ✅ Ajouter des membres au projet

### 3. Gestion des Tâches
- ✅ Créer une tâche dans un projet
- ✅ Lister les tâches d'un projet
- ✅ Voir détails d'une tâche
- ✅ Modifier une tâche (titre, description, statut, priorité)
- ✅ Assigner une tâche à un membre
- ✅ Supprimer une tâche
- ✅ Filtrer par statut/priorité

### 4. Fonctionnalités bonus (si temps)
- 🔄 Websockets pour notifications temps réel
- 📊 Statistiques du projet
- 🔍 Recherche avancée
- 📎 Commentaires sur les tâches

## 📊 Modèles de données (Tables MySQL)

### users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### projects
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### tasks
```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in-progress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  project_id INT NOT NULL,
  assigned_to INT,
  created_by INT NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

### project_members (table de liaison)
```sql
CREATE TABLE project_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (project_id, user_id)
);
```

## 🗓 Planning de développement (6 jours)

### Jour 1 : Configuration & Authentification
- Initialiser le projet Node.js
- Installer dépendances (express, sequelize, mysql2, etc.)
- Configuration MySQL + Sequelize
- Modèle User (Sequelize)
- Migrations de base de données
- Routes auth (register, login)
- Middleware JWT

### Jour 2 : Gestion des Projets
- Modèle Project
- CRUD Projets
- Gestion des membres
- Middleware de permissions

### Jour 3 : Gestion des Tâches
- Modèle Task
- CRUD Tâches
- Association avec projets
- Assignation de tâches

### Jour 4 : Validation & Sécurité
- Validation des entrées
- Gestion erreurs
- Sécurisation (helmet, rate limiting)
- Tests des endpoints

### Jour 5 : Fonctionnalités avancées
- Filtres et recherche
- Statistiques
- Optimisations
- Documentation API

### Jour 6 : Finalisation & Déploiement
- Tests finaux
- README complet
- Déploiement (Render/Railway/Heroku)
- Postman collection

## 🚀 Routes API

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

### Tasks
```
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
