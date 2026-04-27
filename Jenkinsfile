pipeline {
  agent any
  options { timestamps() }
  tools {
    nodejs 'NodeJS'
  }
  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }
    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }
    stage('Unit tests') {
      steps {
        sh 'npm run test:unit -- --ci'
      }
    }
    stage('Verify startup') {
      steps {
        sh '''
          node src/index.js &
          SERVER_PID=$!
          echo "Servidor iniciado con PID $SERVER_PID"

          sleep 5

          if kill -0 $SERVER_PID 2>/dev/null; then
            echo "El servidor arrancó correctamente"
            kill $SERVER_PID
          else
            echo "El servidor falló al iniciar"
            exit 1
          fi
        '''
      }
    }
  }
  post {
    failure {
      echo 'Pipeline falló — revisa los logs'
    }
    success {
      echo 'Pipeline completado correctamente'
    }
  }
}