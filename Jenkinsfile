pipeline {
    agent any

    environment {
        DOCKER_CREDS = credentials('docker-hub-credentials') // Needs to be configured in Jenkins
        IMAGE_TAG = "${env.BUILD_ID}"
        DOCKER_REGISTRY = "your-dockerhub-username" // Change this
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test & Quality') {
            parallel {
                stage('Auth Service Tests') {
                    steps {
                        dir('auth-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
                stage('Team Service Tests') {
                    steps {
                        dir('team-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
                stage('Task Service Tests') {
                    steps {
                        dir('task-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
                stage('Chat Service Tests') {
                    steps {
                        dir('chat-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
                stage('SonarQube Analysis') {
                    steps {
                        // Assuming SonarQube Scanner is configured in Jenkins tools
                        script {
                            def scannerHome = tool 'SonarQubeScanner'
                            withSonarQubeEnv('SonarQube') { // Server name in Jenkins config
                                sh "${scannerHome}/bin/sonar-scanner"
                            }
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}/taskflow-auth:${IMAGE_TAG}", "./auth-service")
                    docker.build("${DOCKER_REGISTRY}/taskflow-team:${IMAGE_TAG}", "./team-service")
                    docker.build("${DOCKER_REGISTRY}/taskflow-task:${IMAGE_TAG}", "./task-service")
                    docker.build("${DOCKER_REGISTRY}/taskflow-chat:${IMAGE_TAG}", "./chat-service")
                    docker.build("${DOCKER_REGISTRY}/taskflow-frontend:${IMAGE_TAG}", "./frontend")
                }
            }
        }

        stage('Deploy to Kubernetes (Minikube)') {
            steps {
                script {
                    // Update image tags in k8s manifests before applying
                    sh "sed -i 's|image: .*/taskflow-auth:.*|image: ${DOCKER_REGISTRY}/taskflow-auth:${IMAGE_TAG}|g' k8s/auth-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-team:.*|image: ${DOCKER_REGISTRY}/taskflow-team:${IMAGE_TAG}|g' k8s/team-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-task:.*|image: ${DOCKER_REGISTRY}/taskflow-task:${IMAGE_TAG}|g' k8s/task-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-chat:.*|image: ${DOCKER_REGISTRY}/taskflow-chat:${IMAGE_TAG}|g' k8s/chat-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-frontend:.*|image: ${DOCKER_REGISTRY}/taskflow-frontend:${IMAGE_TAG}|g' k8s/frontend-deployment.yaml"
                    
                    // Apply manifests using kubectl (assumes kubeconfig is set up for Jenkins)
                    sh "kubectl apply -f k8s/"
                }
            }
        }
    }
}
