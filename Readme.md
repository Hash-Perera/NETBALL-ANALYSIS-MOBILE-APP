# Netball Analysis Mobile Application

The Netball Analysis Application is designed to assist coaches and players in analyzing their performance through video-based analytics. It provides features for attack analysis, injury detection, ball handling, and defense analysis. The system utilizes AWS S3 for video storage, MongoDB for data management, and AI-powered APIs for analysis.

## Features

- Attack Analysis: Upload and analyze correct and incorrect attack videos.
- Injury Detection: Detect injuries from uploaded images using AI.
- Ball Handling & Defense Analysis: Coming soon.
- User Authentication: Supports player and coach roles.
- Database Management: MongoDB used for storing user and analysis data.

## Architecture

The project consists of two main services:

1. **Node.js/Express Backend**

   - Handles user management, video uploads, and API endpoints.
   - Uses MongoDB for data storage and AWS S3 for file storage.

2. **FastAPI Analysis Service**
   - Processes uploaded videos and images for analysis.
   - Utilizes Python libraries such as Mediapipe, OpenCV, TensorFlow, and more.
   - Containerized using Docker for easy deployment.

## Technologies Used

- **Backend (Node.js/Express)**

  - Express, MongoDB, Mongoose
  - Multer for handling file uploads
  - AWS SDK for S3 integration
  - Axios for external API calls
  - JWT & bcrypt for authentication

- **Analysis Service (Python/FastAPI)**

  - Python 3.11, FastAPI, Uvicorn
  - Mediapipe, MoviePy, OpenCV
  - TensorFlow, Pillow
  - Boto3 for AWS integration
  - python-multipart for file handling

- **Containerization**
  - Docker for building and running the FastAPI service

## Installation

### Prerequisites

Ensure that the following are installed on your machine:

- Node.js (version 14 or higher)
- npm or yarn (for package management)
- MongoDB instance (or MongoDB Atlas for cloud database)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Avishka777/RP-NETBALL-ANALYSIS-MOBILE-APP

   ```

2. **Run the models:**

   ```bash
   - cd models
   - uvicorn app:app --host 0.0.0.0 --port 8000

   ```

3. **Environment Variables: Create a .env file in backend and add the following:**

   ```bash
   - PORT=5000
   - MONGO_URI=<your_mongodb_connection_string>
   - JWT_SECRET=<your_jwt_secret>
   - AWS_ACCESS_KEY_ID=<your_aws_key>
   - AWS_SECRET_ACCESS_KEY=<your_aws_secret>
   - AWS_SECRET_REGION=<your_aws_region>
   - FLASH_BACKEND=<your_ml_api_endpoint>

   ```

4. **Install dependencies for backend:**

   ```bash
   - cd backend
   - npm install

   ```

5. **Run the server:**

   ```bash
   - npm start

   ```

6. **Install dependencies for frontend:**

   ```bash
   - cd frontend
   - npm install -force

   ```

7. **Run the server:**
   ```bash
   - npm run dev
   ```

## Contributing

1. Fork the repository.
2. Create your feature branch (git checkout -b feature/your-feature).
3. Commit your changes (git commit -m 'Add some feature').
4. Push to the branch (git push origin feature/your-feature).
5. Open a pull request.
