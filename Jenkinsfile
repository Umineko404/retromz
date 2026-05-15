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
        NEXT_PUBLIC_FIREBASE_API_KEY = credentials('FIREBASE_API_KEY')
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = credentials('FIREBASE_AUTH_DOMAIN')
        NEXT_PUBLIC_FIREBASE_PROJECT_ID = credentials('FIREBASE_PROJECT_ID')
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = credentials('FIREBASE_STORAGE_BUCKET')
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = credentials('FIREBASE_MESSAGING_SENDER_ID')
        NEXT_PUBLIC_FIREBASE_APP_ID = credentials('FIREBASE_APP_ID')
    }
    stages {
        // Stage 1: Code Build 
        stage('Code Build') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm ci --include=dev'

                echo 'Building Next.js application...'
                sh 'npm run build'

                echo 'Code Build stage complete.'
            }
        }
        // Stage 2: Unit Testing 
        stage('Unit Testing') {
            steps {
                echo 'Running Jest unit tests...'

                sh '''
                    npx jest --ci --passWithNoTests --forceExit
                '''

                echo 'Unit Testing stage complete.'
            }
        }
        // Stage 3: Containerized Deployment
        stage('Containerized Deployment') {
            steps {
                echo 'Building Docker image for Retromz...'
                sh """
                    docker build -t \$APP_IMAGE \
                    --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=\$NEXT_PUBLIC_FIREBASE_API_KEY \
                    --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
                    --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=\$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
                    --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
                    --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
                    --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=\$NEXT_PUBLIC_FIREBASE_APP_ID \
                    .
                """

                echo 'Removing any existing container...'
                sh 'docker rm -f $CONTAINER_NAME || true'

                echo 'Starting RetroMZ container...'
                // Rest of your steps...
                sh 'docker run -d --name $CONTAINER_NAME -p $APP_PORT:3000 $APP_IMAGE'
                sh 'sleep 10'
                echo 'Containerized Deployment stage complete.'
            }
        }
        // Stage 4: Containerized Selenium Testing
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
