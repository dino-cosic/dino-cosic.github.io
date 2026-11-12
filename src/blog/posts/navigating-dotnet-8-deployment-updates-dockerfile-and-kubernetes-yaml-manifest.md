---
title: "Navigating .NET 8 Deployment Updates: Dockerfile and Kubernetes YAML Manifest Adjustments"
description: "What to change in your Dockerfile and Kubernetes manifests when moving a service from .NET 6 to .NET 8, including the new default port 8080."
date: 2024-05-07
updated:
slug: "navigating-dotnet-8-deployment-updates-dockerfile-and-kubernetes-yaml-manifest"
tags:
  - ".NET"
  - "Docker"
  - "Kubernetes"
  - "Migration"
coverImage:
coverAlt:
mediumUrl: "https://medium.com/@dino.cosic/navigating-net-8-deployment-updates-dockerfile-and-kubernetes-yaml-manifest-adjustments-0b936fe07695"
canonicalUrl:
draft: false
---

*Last week, I wanted to deploy a brand-new service developed with .NET 8, aiming to utilize the same Dockerfile and YAML manifests that had served seamlessly for projects built on .NET 6. However, the deployment didn’t go as smoothly as anticipated. Instead, it hit a roadblock and failed to proceed as expected. In the end, the issue was resolved and this article describes how.*

If you want to transition your codebase to .NET 8, you may need to make changes to your deployment yaml manifests and docker files. This article will walk you through the small adjustments that you will need to implement.

![Typewriter with a sheet of paper reading “Update”](/assets/blog/navigating-dotnet-8-deployment-updates-dockerfile-and-kubernetes-yaml-manifest/01.jpg "Photo by Markus Winkler on Unsplash")

We can start by looking at the adjustments we need to make to our Docker file. Let’s assume that we have an example *dockerfile* like this one:

```dockerfile
# Use the .NET SDK 6.0 image to create a build environment
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build-env
# Set the working directory inside the container to /app
WORKDIR /app
# # Expose ports for documentation purposes
EXPOSE 80 443

# Copy all files from the current directory on the host to the /app directory in the container
COPY . ./
# Restore dependencies as separate layers to cache them for faster builds
RUN dotnet restore
# Build the application and publish it to the 'out' directory with configuration set to 'Release'
RUN dotnet publish -c Release -o out

# Use the .NET runtime 6.0 image for the runtime environment
FROM mcr.microsoft.com/dotnet/aspnet:6.0
# Set the working directory inside the container to /App
WORKDIR /App
# Copy the published application from the build environment to the /App directory in the runtime container
COPY --from=build-env /app/out .
# Set the entry point for the container to run the application
ENTRYPOINT ["dotnet", "DockerConsoleApp.dll"]
```

The sample above describes each task with comments. In our scenario, we needed to tell Docker that the container is listening on the given network ports during runtime. Here we expose ports 80 (HTTP) and 443 (HTTPS).

Since we want this to work with .NET 8, we need to introduce the following changes:

![Side-by-side diff of the Dockerfile: SDK and runtime images move from 6.0 to 8.0 and exposed ports change from 80 and 443 to 8080 and 8081](/assets/blog/navigating-dotnet-8-deployment-updates-dockerfile-and-kubernetes-yaml-manifest/02.png)

The screenshot above shows the changes in the following sections of the *dockerfile*:

1. **Base Image —** The change to .NET 8 reflects an upgrade to a newer version of the base image for the build environment, which may include bug fixes, performance improvements, and new features.
2. **Exposed Ports —** Instead of 80 and 443 ports used for HTTP and HTTPS traffic, 8080 and 8081 ports are exposed. This was necessary because of **braking changes** introduced with .NET 8. More details regarding this matter can be found on the following [link](https://learn.microsoft.com/en-us/dotnet/core/compatibility/containers/8.0/aspnet-port).
3. **Environment Variables —** New environment variables are introduced to handle changes introduced with .NET 8 related to ports and hosting URLs.

- ASPNETCORE\_HTTP\_PORTS=8080: This variable specifies the port(s) that the ASP.NET Core application should listen on.
- ASPNETCORE\_URLS=http://+:8080: This variable defines the URLs that the ASP.NET Core application will respond to.

> Apps built using the older [WebHost.CreateDefaultBuilder()](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.webhost.createdefaultbuilder#microsoft-aspnetcore-webhost-createdefaultbuilder) API won’t respect the new ASPNETCORE\_HTTP\_PORTS environment variable. And now that ASPNETCORE\_URLS is no longer set automatically, they'll switch to use a default URL of http://localhost:5000, rather than http://\*:80, as formerly.

The code of the final version of the *dockerfile* is shown below:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app
EXPOSE 8080 8081

COPY . ./
RUN dotnet restore
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "DockerConsoleApp.dll"]
```

After updating the *dockerfile*, we must also update the yaml manifests used for the CI/CD pipelines. Here, we need to change the SDK version and ports that were used before.

In the Build pipeline, we need to update the SDK version to use .NET 8:

```yaml
steps:
- task: UseDotNet@2
  displayName: 'Use .NET 8 SDK'
  inputs:
    packageType: 'sdk'
    version: '8.0.x'
    includePreviewVersions: false
```

To comply with the new .NET 8 regulations, update the deployment yaml manifest with the necessary ports.

The ports in the service manifest should be set as follows:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-backend-service
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
# Add anything else that you need
```

The deployment manifest should have ports configured as shown here:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-service
  labels:
    app: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-backend-image
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 2
          successThreshold: 1
          failureThreshold: 3
# Same port I've used for other probes as well
```

After implementing these changes, the CI/CD pipelines were completed successfully, and pods could start without errors. I hope that this article will save you some time if you decide to migrate your codebase from earlier versions of .NET to .NET 8. 🚀
