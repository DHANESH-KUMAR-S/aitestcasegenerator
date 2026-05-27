@echo off
gcloud run deploy aitestcasegenerator --source . --region us-central1 --platform managed --allow-unauthenticated --quiet > deploy_log.txt 2>&1
echo Exit code: %ERRORLEVEL% >> deploy_log.txt
