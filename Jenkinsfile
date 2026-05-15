pipeline {
    agent any

    tools {
        nodejs 'NodeJS-26'
    }

    environment {
        APP_IMAGE      = 'retromz-app'
        SELENIUM_IMAGE = 'retromz-selenium'
        CONTAINER_NAME = 'retromz-container'
        APP_PORT       = '3000'
    }

    stages {

        stage('Code Build') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm ci'
                echo 'Building Next.js application...'
                sh 'npm run build'
                echo 'Code Build stage complete.'
            }
        }

        stage('Unit Testing') {
            steps {
                echo 'Running Jest unit tests...'
                sh 'npm test -- --forceExit --passWithNoTests'
                echo 'Unit Testing stage complete.'
            }
        }

        stage('Containerized Deployment') {
            steps {
                echo 'Building Docker image for RetroMZ...'
                sh 'docker build -t $APP_IMAGE .'
                echo 'Removing any existing container...'
                sh 'docker rm -f $CONTAINER_NAME || true'
                echo 'Starting RetroMZ container...'
                sh 'docker run -d --name $CONTAINER_NAME -p $APP_PORT:3000 $APP_IMAGE'
                echo 'Waiting for app to initialize...'
                sh 'sleep 10'
                echo 'Containerized Deployment stage complete.'
            }
        }

        stage('Containerized Selenium Testing') {
            steps {
                echo 'Building Selenium test container...'
                sh 'docker build -t $SELENIUM_IMAGE ./selenium_tests'
                echo 'Running Selenium tests against deployed container...'
                sh '''
                    docker run --rm \
                        --network host \
                        -e APP_URL=http://localhost:$APP_PORT \
                        $SELENIUM_IMAGE
                '''
                echo 'Containerized Selenium Testing stage complete.'
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
            sh 'docker rm -f $CONTAINER_NAME || true'
        }
        success {
            echo 'SUCCESS: All 4 stages completed.'
        }
        failure {
            echo 'FAILURE: Pipeline failed. Review stage logs above.'
        }
    }
}