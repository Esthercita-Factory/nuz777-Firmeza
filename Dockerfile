FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Firmeza.sln ./
COPY Firmeza.Domain/Firmeza.Domain.csproj Firmeza.Domain/
COPY Firmeza.Application/Firmeza.Application.csproj Firmeza.Application/
COPY Firmeza.Infrastructure/Firmeza.Infrastructure.csproj Firmeza.Infrastructure/
COPY Firmeza.Api/Firmeza.Api.csproj Firmeza.Api/
RUN dotnet restore Firmeza.Api/Firmeza.Api.csproj

COPY Firmeza.Domain/ Firmeza.Domain/
COPY Firmeza.Application/ Firmeza.Application/
COPY Firmeza.Infrastructure/ Firmeza.Infrastructure/
COPY Firmeza.Api/ Firmeza.Api/
RUN dotnet publish Firmeza.Api/Firmeza.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Firmeza.Api.dll"]
