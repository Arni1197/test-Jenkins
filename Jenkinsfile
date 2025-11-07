pipeline {
    agent any

    environment {
        REGISTRY = "localhost:5001"
        FRONTEND_IMAGE = "${REGISTRY}/frontend:latest"
        BACKEND_IMAGE  = "${REGISTRY}/backend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                // Клонируем репозиторий (если Jenkins не делает это сам)
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                dir('client') {
                    sh 'docker build -t $FRONTEND_IMAGE .'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t $BACKEND_IMAGE .'
                }
            }
        }

        stage('Push Images') {
            steps {
                // Для локального registry login не нужен
                sh 'docker push $FRONTEND_IMAGE'
                sh 'docker push $BACKEND_IMAGE'
            }
        }
    }

    post {
        success {
            echo 'Docker images successfully built and pushed!'
        }
        failure {
            echo 'Something went wrong!'
        }
    }
}