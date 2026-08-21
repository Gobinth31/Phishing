# Phishing
This is the project to identify whether the emails are fraud or not...

## About This Project:

This project is a privacy-focused, locally hosted phishing detection API.
Built with Node.js and Express, it leverages local AI inference powered by Ollama running the qwen2.5:3b model.
By feeding domain-specific email samples into the AI via few-shot prompting, the system analyzes incoming email 
text and returns structured JSON responses containing a binary classification (isPhishing), a confidence score, 
and detailed risk categories.

## How to Install & Test:

### Pre-requisites(Install in your local machine):

* Install Node.js (v18.0.0 or higher).

* Install Ollama.

### Post-requisites(Install Project Phishing):

* download the Project:  git clone https://github.com/Gobinth31/Phishing.git
   
* Change into the project directory:  cd Phishing/
   
* Install dependencies:   install npm
   
* download the AI model:  ollama pull qwen2.5:3b
   
* start the services and API server:  ./start.sh
   
* Click the local host link
        

## How to test Emails:
* In that webpage two boxes
    * Subject
    * Content
* Copy the Subject & Content in the mail and past in thoes seperate boxes
* It will take few second and finally you got whether the email is fraude or not.
* It give the propablity percentage for email.

                ## It can make mistake. be carefull!!
#                        Thank you !!!!
