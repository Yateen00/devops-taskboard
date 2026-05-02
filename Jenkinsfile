pipeline {
    agent any

    environment {
        DOCKER_CREDS = credentials('docker-hub-credentials') // Needs to be configured in Jenkins
        IMAGE_TAG = "${env.BUILD_ID}"
        DOCKER_REGISTRY = "your-dockerhub-username" // Change this
        MINIKUBE_HOME = "/home/yeet/.minikube"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit Tests') {
            parallel {
                stage('Auth Service Tests') {
                    steps {
                        dir('auth-service') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/jest || true'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Team Service Tests') {
                    steps {
                        dir('team-service') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/jest || true'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Task Service Tests') {
                    steps {
                        dir('task-service') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/jest || true'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
                stage('Chat Service Tests') {
                    steps {
                        dir('chat-service') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/jest || true'
                            sh 'npm test -- --coverage --passWithNoTests'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                        script {
                            // Download and run sonar-scanner directly (avoids Docker-in-Docker path issues)
                            sh '''
                            if [ ! -f /tmp/sonar-scanner/bin/sonar-scanner ]; then
                                echo "Downloading SonarScanner CLI..."
                                curl -sL "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip" -o /tmp/sonar-scanner.zip
                                cd /tmp && unzip -qo sonar-scanner.zip && mv sonar-scanner-*-linux-x64 sonar-scanner
                            fi

                            # Fix lcov path inconsistencies since Jest generates them relative to service folder
                            sed -i 's|SF:src/|SF:auth-service/src/|g' auth-service/coverage/lcov.info || true
                            sed -i 's|SF:src/|SF:team-service/src/|g' team-service/coverage/lcov.info || true
                            sed -i 's|SF:src/|SF:task-service/src/|g' task-service/coverage/lcov.info || true
                            sed -i 's|SF:src/|SF:chat-service/src/|g' chat-service/coverage/lcov.info || true
                            '''
                            sh """
                            /tmp/sonar-scanner/bin/sonar-scanner \
                                -Dsonar.host.url=http://taskflow-sonarqube:9000 \
                                -Dsonar.token=\${SONAR_TOKEN} \
                                -Dsonar.projectKey=TaskFlow \
                                -Dsonar.projectName='TaskFlow' \
                                -Dsonar.projectBaseDir=\$(pwd) \
                                -Dsonar.sources=auth-service/src,team-service/src,task-service/src,chat-service/src \
                                -Dsonar.tests=auth-service/tests,team-service/tests,task-service/tests,chat-service/tests \
                                -Dsonar.test.inclusions=**/*.test.js \
                                -Dsonar.javascript.file.suffixes=.js,.jsx \
                                -Dsonar.scm.disabled=true \
                                -Dsonar.javascript.lcov.reportPaths=auth-service/coverage/lcov.info,team-service/coverage/lcov.info,task-service/coverage/lcov.info,chat-service/coverage/lcov.info \
                                -Dsonar.exclusions="**/node_modules/**,**/coverage/**,**/tests/**"
                            """
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    withEnv([
                        "DOCKER_HOST=tcp://192.168.49.2:2376",
                        "DOCKER_TLS_VERIFY=1",
                        "DOCKER_CERT_PATH=/home/yeet/.minikube/certs"
                    ]) {
                        sh "docker build -t taskflow-auth:${IMAGE_TAG} ./auth-service"
                        sh "docker build -t taskflow-team:${IMAGE_TAG} ./team-service"
                        sh "docker build -t taskflow-task:${IMAGE_TAG} ./task-service"
                        sh "docker build -t taskflow-chat:${IMAGE_TAG} ./chat-service"
                        sh "docker build -t taskflow-frontend:${IMAGE_TAG} ./frontend"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes (Minikube)') {
            steps {
                script {
                    // Update image tags in k8s manifests before applying (note we use local images directly now)
                    sh "sed -i 's|image: .*/taskflow-auth:.*|image: taskflow-auth:${IMAGE_TAG}|g' k8s/auth-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-team:.*|image: taskflow-team:${IMAGE_TAG}|g' k8s/team-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-task:.*|image: taskflow-task:${IMAGE_TAG}|g' k8s/task-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-chat:.*|image: taskflow-chat:${IMAGE_TAG}|g' k8s/chat-deployment.yaml"
                    sh "sed -i 's|image: .*/taskflow-frontend:.*|image: taskflow-frontend:${IMAGE_TAG}|g' k8s/frontend-deployment.yaml"
                    
                    // Apply manifests using kubectl
                    sh "echo 'Deploying to Kubernetes cluster...'"
                    sh "kubectl apply -f k8s/namespace.yaml || true"
                    sh "kubectl apply -f k8s/ -n taskflow"
                    
                    // Verify rollout
                    sh "kubectl rollout status deployment/auth-deployment -n taskflow"
                    sh "kubectl rollout status deployment/team-deployment -n taskflow"
                    sh "kubectl rollout status deployment/task-deployment -n taskflow"
                    sh "kubectl rollout status deployment/chat-deployment -n taskflow"
                    sh "kubectl rollout status deployment/frontend-deployment -n taskflow"
                    sh "echo 'Successfully deployed to Minikube!'"
                }
            }
        }
    }
}
