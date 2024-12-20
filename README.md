# ToDo List

This web application is a standard todo list app with a twist: it allows users to create and manage persistent sets of todo lists, eliminating the need to recreate lists for recurring tasks, such as packing for a trip.

## Features

- Create and manage multiple todo lists
- Persistent storage for todo lists
- User-friendly interface
- Editable and deletable tasks
- Recurring tasks management

## Technologies Used

- TypeScript
- JavaScript
- HTML
- CSS
- Firebase

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js installed on your local machine
- Firebase account

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/adiso06/ToDoList.git
   ```
2. Navigate to the project directory
   ```sh
   cd ToDoList
   ```
3. Install the dependencies
   ```sh
   npm install
   ```
### Firebase Setup
1. Go to the Firebase Console and create a new project.
2. Navigate to Project Settings, then add a new web app.
3. Copy the Firebase configuration settings.
4. Create a .env file in the root of your project and add your Firebase configuration:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Running the Application
To start the application, run:

```sh
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Usage

1. Create a new todo list by clicking "New List".
2. Add tasks to your list by typing in the input field and pressing "Enter".
3. Edit or delete tasks by clicking the respective buttons next to each task.
4. Manage recurring tasks by creating lists that you can reuse.

## ToDo
[ ] can't delete sublists lists 
[ ] can't drag individual tasks 
[ ] can't create ful llists 

