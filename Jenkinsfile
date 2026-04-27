pipeline {
  agent any
  options { timestamps() }
  tools {
    nodejs 'NodeJS'
  }
    environment {
    LOG_IP_HASH_SECRET = 'test-secret'
  }
  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }
    stage('Run tests') {
      steps {
        sh 'npm run test:unit -- --ci'
      }
    }
    stage('Verify startup') {
      steps {
        sh '''
          node src/index.js &
          SERVER_PID=$!
          sleep 5
          kill -0 $SERVER_PID && echo "Servidor OK" || { echo "Servidor falló"; exit 1; }
          kill $SERVER_PID
        '''
      }
    }
  }
  post {
    failure {
      echo 'Pipeline falló'
    }
    success {
      echo 'Pipeline completado correctamente'
    }
  }
}