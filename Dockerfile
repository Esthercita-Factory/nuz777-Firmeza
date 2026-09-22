FROM node:22-alpine AS frontend
WORKDIR /src/Firmeza.Web
COPY Firmeza.Web/package*.json ./
RUN npm ci
COPY Firmeza.Web/Assets ./Assets
COPY Firmeza.Web/Views ./Views
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Firmeza.sln ./
COPY Firmeza.Web/Firmeza.Web.csproj Firmeza.Web/
RUN dotnet restore Firmeza.Web/Firmeza.Web.csproj

COPY Firmeza.Web/ Firmeza.Web/
COPY --from=frontend /src/Firmeza.Web/wwwroot/dist Firmeza.Web/wwwroot/dist
RUN dotnet publish Firmeza.Web/Firmeza.Web.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Firmeza.Web.dll"]
