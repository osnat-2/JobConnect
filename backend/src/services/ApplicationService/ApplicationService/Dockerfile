# ApplicationService - .NET 8 multi-stage Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/src/services/ApplicationService/ApplicationService/. ./
COPY backend/shared/dotnet/Shared.Infrastructure/ /shared/dotnet/Shared.Infrastructure/
RUN dotnet publish ./ApplicationService.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet","ApplicationService.dll"]
