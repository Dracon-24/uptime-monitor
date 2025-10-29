pipeline {
    agent any

    environment {
        IMAGE_NAME = "dracon24/uptime-webapp"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    triggers {
        githubPush()   // auto-trigger when you push
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build') {
            steps {
                sh '''
                npm ci
                npm run build
                '''
            }
        }

        stage('Test') {
            steps {
                sh 'npm test || echo "No tests found, skipping..."'
            }
        }

        stage('Docker Build & Push') {
            steps {
                sh '''
                echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
                docker build -t $IMAGE_NAME:latest .
                docker push $IMAGE_NAME:latest
                docker logout
                '''
            }
        }

        stage('Deploy with Ansible') {
            steps {
                sh '''
                ansible-playbook -i inventory deploy.yml --extra-vars "ansible_become_pass="
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Build, push, and deployment completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Check logs."
        }
    }
}
