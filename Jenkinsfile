pipeline {
  agent any

  stages {
    stage('Install') {
      steps { sh 'npm install' }
    }

    stage('Lint') {
      steps { sh 'npm run lint:report' }
    }

    stage('Test') {
      steps { sh 'npm test -- --coverage --watchAll=false' }
    }

    stage('SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          sh 'sonar-scanner -Dsonar.projectVersion=1.0'
        }
      }
    }

    stage('Deploy') {
      when { branch 'main' }
      steps { sh 'npm run build && npm run deploy' }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/eslint-report.xml,coverage/lcov.info'
    }
    failure {
      slackSend channel: '#devops', message: "🚨 Pipeline fallido: ${env.JOB_NAME}"
    }
  }
}
