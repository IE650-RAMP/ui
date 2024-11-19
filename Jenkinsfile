@Library("teckdigital") _
def appName = "ramp-ui"
def localBranchToGitopsValuesPath = [
    'main': 'apps/ramp/ui.values.yaml',
]

pipeline {
   agent {
    kubernetes {
        inheritFrom "kaniko-template"
    }
  }
    
    stages {
        stage('Build and Tag Image') {
            steps {
                container('kaniko') {
                    script {
                        buildDockerImage()
                    }
                }
            }
        }

        stage('Update GitOps') {
            when {
                expression {
                    return localBranchToGitopsValuesPath.containsKey(getLocalBranchName())
                }
            }
            steps {
                script {
                    def valuesPath = localBranchToGitopsValuesPath[getLocalBranchName()]

                    updateGitops(appName: appName, valuesPath: valuesPath, gitOpsRepo: "https://github.com/ItsZiroy/gitops", credentialsId: "h4hn-service-user" , gitUserEmail: "github-bot@h4hn.de")
                }
            }
        }
    }
}