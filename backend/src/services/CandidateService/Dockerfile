# CandidateService - .NET 8 multi-stage Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY CandidateService/CandidateService.csproj ./CandidateService/
RUN dotnet restore ./CandidateService/CandidateService.csproj
COPY CandidateService/. ./CandidateService/
RUN dotnet publish ./CandidateService/CandidateService.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet","CandidateService.dll"]
