const fs = require('fs');

const services = ['auth', 'team', 'task', 'chat', 'frontend'];
const ports = { auth: 3001, team: 3002, task: 3003, chat: 3004, frontend: 80 };

services.forEach(svc => {
  const content = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${svc}-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${svc}
  template:
    metadata:
      labels:
        app: ${svc}
    spec:
      containers:
      - name: ${svc}
        image: your-dockerhub-username/taskflow-${svc}:latest
        ports:
        - containerPort: ${ports[svc]}
        ${svc !== 'frontend' ? `env:
        - name: MONGO_URI
          value: mongodb://mongo-service:27017/taskflow
        - name: PORT
          value: "${ports[svc]}"` : ''}
---
apiVersion: v1
kind: Service
metadata:
  name: ${svc}-service
spec:
  type: ${svc === 'frontend' ? 'NodePort' : 'ClusterIP'}
  selector:
    app: ${svc}
  ports:
  - port: ${ports[svc]}
    targetPort: ${ports[svc]}
    ${svc === 'frontend' ? 'nodePort: 30080' : ''}
`;
  fs.writeFileSync(`./k8s/${svc}-deployment.yaml`, content);
});

const mongoContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongo-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongo
        image: mongo:6.0
        ports:
        - containerPort: 27017
---
apiVersion: v1
kind: Service
metadata:
  name: mongo-service
spec:
  selector:
    app: mongo
  ports:
  - port: 27017
    targetPort: 27017
`;
fs.writeFileSync('./k8s/mongo-deployment.yaml', mongoContent);
