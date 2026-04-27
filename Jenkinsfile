pipeline {
  agent any
  options { timestamps() }
  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }
    stage('Run tests') {
      steps {
        sh 'npm test:unit'
      }
    }
  }
}