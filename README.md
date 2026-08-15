# Phishing
This is the project to identify whether the emails are fraud or not...

About This Project:

      This project is a privacy-focused, locally hosted phishing detection API.
  Built with Node.js and Express, it leverages local AI inference powered by Ollama running the qwen2.5:3b model.
  By feeding domain-specific email samples into the AI via few-shot prompting, the system analyzes incoming email 
  text and returns structured JSON responses containing a binary classification (isPhishing), a confidence score, 
  and detailed risk categories.

How to Install & Test:

    Pre-requisites(Install in your local machine):

        Install Node.js (v18.0.0 or higher).

        Install Ollama.

    Post-requisites(Install Project Phishing):
    
        step-1(download the Project):  git clone https://github.com/Gobinth31/Phishing.git
        
        step-2(Change into the project directory):  cd Phishing/
        
        step-3(Install dependencies):   install npm
        
        step-4(download the AI model):  ollama pull qwen2.5:3b
        
        step-5(start the services and API server):  ./start.sh
        

How to test Emails:
 #Open a new terminal window(In another terminal ./start.sh running is compalsory) and run Your email in curl inside emailText command


bash:
 curl -X POST http://localhost:3000/api/detect-phishing \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Urgent:ENTER_YOUR_SUSPENTED_EMAIL'S_SUBJECT_HERE...."
  }'


  


                                  Thank you !!!!
