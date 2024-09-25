# NTUA ECE SAAS 2024 PROJECT

GitHub repository for solveMyProblem, a SaaS application for solving computational problems using google's OR tools.
  
## TEAM (54)

Members:
- Maria Koilalou
- Myrto Orfanakou

## Overview
This SaaS application offers users a way to submit computational problems (e.g., optimization, VRP) and receive real-time results and feedback. Users can also manage credits, view problem history, and edit their submissions. The application consists of multiple microservices communicating through RabbitMQ.

### Key Highlights:

- Microservices architecture
- Real-time problem submission and progress tracking
- Credits-based model
- RabbitMQ for microservices communication
- No centralized session management; each service stores session data independently

### Features

- Problem Submission: Submit algorithmic problems and view results as they are processed.
- Credit Management: Purchase credits and monitor usage to submit and process problems.
- Progress Monitoring: View the status of problem processing in real time.
- Microservice Communication: Services are decoupled and communicate using RabbitMQ.
- Data Isolation: Each service manages its own data and session state.
- Automatic Data Reset: Clears data upon each application build.


## Architecture
The application is built using a microservices architecture. Each service is responsible for a specific functionality and communicates with others via RabbitMQ.

### Services:

- Front End Service
- Buy Credit Service
- Submit Problem Service
- OR Tools Service
- Manage Problems Service
- Problems Stats Service
- Browse Problems Service


## Installation

### Prerequisites:

- Node.js 
- PostgreSQL 
- RabbitMQ 


## Deployment

1. Clone Repository
```
git clone https://github.com/ntua/saas2024-54
cd saas2024-54
```

3. Build Docker
```
docker-compose up --build
```


5. The project runs on http/:localhost/:4007


## License
This project is licensed under the MIT License
