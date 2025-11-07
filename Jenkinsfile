pipeline {
    agent any

    environment {
        // Можно задать переменные окружения, например токен
        NODE_ENV = 'development'
    }

    stages {

        stage('Frontend Build') {
            agent {
                docker {
                    image 'node:20' // Node.js для фронтенда
                    args '-u root:root' // чтобы можно было писать в смонтированные тома
                }
            }
            steps {
                dir('client') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Build') {
            agent {
                docker {
                    image 'node:20' // Node.js для бэкенда
                    args '-u root:root'
                }
            }
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to Kubernetes (or Docker) ...'
                // Здесь можно добавить kubectl apply -f k8s или docker-compose up -d
                sh 'echo "Deploy step placeholder"'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}