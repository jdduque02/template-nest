# Manual de Proyecto NestJS con Buenas Prácticas

Este documento describe la configuración base para un proyecto NestJS implementando estándares de calidad, herramientas de análisis estándar y flujos de integración continua.

## 📋 Prerrequisitos

- Node.js v18+
- npm v9+
- Docker (Opcional para despliegue)
- SonarQube (Opcional para análisis estático)
- Jenkins (Opcional para CI/CD)

## 🛠 Instalación

1. **Iniciar proyecto NestJS**:

```bash
npx @nestjs/cli new mi-proyecto
```

2.**Instalar dependencias base**:

```bash
npm i -D eslint prettier eslint-config-nestjs @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-sonarjs eslint-plugin-prettier eslint-config-prettier
```

---

## 🔧 Configuraciones Esenciales

### 1. ESLint + Prettier

`.eslintrc.json`:

```json
{
  "root": true,
  "extends": ["nestjs", "plugin:sonarjs/recommended", "plugin:prettier/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "rules": {
    "sonarjs/cognitive-complexity": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prettier/prettier": ["error", { "endOfLine": "auto" }]
  },
  "ignorePatterns": ["dist/**", "node_modules/**", "coverage/**"]
}
```

`.prettierrc`:

```json
{
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "all",
  "endOfLine": "lf"
}
```

**Scripts** en `package.json`:

```json
"scripts": {
  "lint:report": "eslint \"{src,apps,libs,test}/**/*.ts\" -f checkstyle -o reports/eslint-report.xml"
}
```

---

### 2. Husky + lint-staged

```bash
npm i -D husky lint-staged
npx husky-init && npm install
```

Configurar en `package.json`:

```json
"lint-staged": {
  "*.ts": ["npm run lint", "npm run format", "git add"]
},
"husky": {
  "hooks": {
    "pre-commit": "lint-staged && npm test",
    "pre-push": "npm run lint && npm run build"
  }
}
```

---

### 3. Conventional Commits (commitlint)

```bash
npm i -D @commitlint/cli @commitlint/config-conventional @commitlint/types
```

`commitlint.config.ts`:

```typescript
import type { UserConfig } from '@commitlint/types';

export const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'revert',
        'perf',
        'build',
      ],
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
```
### Tipos permitidos (según la configuración):
| Tipo       | Descripción                              |
|------------|------------------------------------------|
| feat       | Nueva funcionalidad                     |
| fix        | Corrección de errores                   |
| docs       | Cambios en documentación                |
| style      | Formato (espacios, comas, etc.)         |
| refactor   | Mejoras de código sin cambiar funcionalidad |
| test       | Adiciones de pruebas                    |
| chore      | Tareas de mantenimiento                 |
| revert     | Revertir un commit anterior             |

Agregar hook:

```bash
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "${1}"'
```

---

## 🛡 Integración con SonarQube

`sonar-project.properties`:

```properties
sonar.projectKey=mi-proyecto-nestjs
sonar.sources=src,apps,libs,test
sonar.language=ts
sonar.tests=test
sonar.test.inclusions=test/**/*.spec.ts
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.eslint.reportPaths=reports/eslint-report.xml
sonar.sourceEncoding=UTF-8
```

Ejecutar análisis:

```bash
npm install --save-dev sonarqube-scanner
```

---

## 🚀 Pipeline Jenkins

`Jenkinsfile`:

```groovy
pipeline {
  agent any

  stages {
    stage('Install') { steps { sh 'npm install' } }
    stage('Lint') { steps { sh 'npm run lint:report' } }
    stage('Test') { steps { sh 'npm test -- --coverage --watchAll=false' } }
    stage('SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube-Server') {
          sh 'sonar-scanner -Dsonar.projectVersion=1.0'
        }
      }
    }
    stage('Deploy') {
      when { branch 'main' }
      steps { sh 'npm run build && npm run deploy' }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/eslint-report.xml,coverage/lcov.info'
    }
    failure {
      slackSend channel: '#devops', message: "🚨 Pipeline fallido: ${env.JOB_NAME}"
    }
  }
}
```

---

## 🐳 Dockerización

`Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app
ENV NODE_ENV production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

`.dockerignore`:

```markdown
node_modules
dist
.env
\*.md
```

**Uso**:

```bash
docker build -t mi-app-nestjs .
docker run -p 3000:3000 mi-app-nestjs
```

---

## 📂 Estructura de Directorios Recomendada

```bash
src/
├── config/       # Configuraciones de la app
├── controllers/  # Controladores REST
├── entities/     # Entidades de base de datos
├── services/     # Lógica de negocio
├── repositories/ # Acceso a datos
├── interfaces/   # Tipos y interfaces TS
├── middlewares/  # Middlewares globales
├── interceptors/ # Interceptores HTTP
└──  common/
    ├── decorators/      # Decoradores personalizados
    ├── exceptions/      # Excepciones personalizadas
    ├── filters/         # Filtros de excepción
    ├── guards/          # Guards de autenticación/autorización
    ├── helpers/         # Utilidades (como tu ResponseHelper)
    ├── interceptors/    # Interceptores globales
    ├── interfaces/      # Interfaces compartidas
    ├── pipes/           # Pipes personalizados
    └── utils/           # Funciones utilitarias genéricas
```

```bash
cd src/
mkdir config && mkdir controllers && mkdir entities && mkdir interceptors && mkdir interfaces && mkdir middlewares && mkdir helpers && mkdir repositories && mkdir services
```

---

## 📚 Documentación API (Swagger)

Instalar:

```bash
npm install @nestjs/swagger
```

Configurar en `main.ts`:

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('API Docs')
  .setDescription('Documentación de endpoints')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

Acceder en: `http://localhost:3000/api`

## 🚀 Comandos CLI de NestJS

Utiliza los siguientes comandos para generar componentes en tu proyecto:

| Comando         | Alias    | Descripción                                  |
| --------------- | -------- | -------------------------------------------- |
| `application`   | `app`    | Generar una nueva aplicación en un workspace |
| `class`         | `cl`     | Generar una clase                            |
| `configuration` | `config` | Crear archivo de configuración CLI           |
| `controller`    | `co`     | Generar controlador                          |
| `decorator`     | `d`      | Crear decorador personalizado                |
| `filter`        | `f`      | Generar filtro                               |
| `gateway`       | `ga`     | Crear gateway (WebSockets)                   |
| `guard`         | `gu`     | Generar guardia de autenticación             |
| `interceptor`   | `itc`    | Crear interceptor                            |
| `interface`     | `itf`    | Generar interfaz TypeScript                  |
| `library`       | `lib`    | Crear librería en monorepo                   |
| `middleware`    | `mi`     | Generar middleware                           |
| `module`        | `mo`     | Crear módulo                                 |
| `pipe`          | `pi`     | Generar pipe de validación                   |
| `provider`      | `pr`     | Crear proveedor (service, repository, etc)   |
| `resolver`      | `r`      | Generar resolver de GraphQL                  |
| `resource`      | `res`    | Crear recurso CRUD completo                  |
| `service`       | `s`      | Generar servicio                             |
| `sub-app`       | `app`    | Crear sub-aplicación en monorepo             |

**Ejemplos de uso:**

```bash
# Generar controlador
nest generate controller users
nest g co users

# Crear módulo
nest generate module auth
nest g mo auth

# Generar recurso CRUD completo
nest generate resource products
nest g res products

# Crear servicio con test
nest generate service database
nest g s database
```

Para ver ayuda detallada de cualquier comando:

```bash
nest generate [nombre-comando] --help
```

Aquí está la tabla con las variables de entorno recomendadas para la aplicación:

## 🔧 Variables de Entorno

| Variable            | Descripción                              | Tipo    | Requerido | Valor por Defecto |
| ------------------- | ---------------------------------------- | ------- | --------- | ----------------- |
| `JOB_NAME`          | Nombre identificador del servicio        | string  | ✅        | -                 |
| `APP_PORT`          | Puerto de ejecución de la aplicación     | number  | ✅        | 3000              |
| `ENV`               | Entorno de ejecución (DEV/QA/PROD)       | string  | ✅        | DEV               |
| `HASH_KEY_USER`     | Clave secreta para hashing de usuarios   | string  |           | -                 |
| `HASH_KEY_JWT`      | Clave secreta para firmar JWT            | string  | ✅        | -                 |
| `VERSION`           | Versión actual de la aplicación          | string  | ⚠️        | 1.0.0             |
| `SALT`              | Salt para procesos de encriptación       | number  | ✅        | 10                |
| `APP_DEV`           | Modo desarrollo (true/false)             | boolean | ⚠️        | false             |
| `DATABASE_HOST`     | Host de la base de datos                 | string  | ✅        | -                 |
| `DATABASE_PORT`     | Puerto de la base de datos               | number  | ✅        | -                 |
| `DATABASE_USERNAME` | Usuario de la base de datos              | string  | ✅        | -                 |
| `DATABASE_PASSWORD` | Contraseña de la base de datos           | string  | ✅        | -                 |
| `DATABASE_NAME`     | Nombre de la base de datos               | string  | ✅        | -                 |
| `RATE_LIMIT_TTL`    | Ventana de tiempo para rate limiting (s) | number  | ⚠️        | 60                |
| `RATE_LIMIT_MAX`    | Máximo de peticiones por ventana         | number  | ⚠️        | 100               |

**Leyenda:**
✅ = Requerido - ⚠️ = Opcional

## 🛡️ Consideraciones de Seguridad

1. **Variables sensibles** (`HASH_KEY_*`, `DATABASE_PASSWORD`) deben:
   - **Nunca** committearse al repositorio
   - Usarse desde sistemas de gestión de secretos (Vault, AWS Secrets Manager)
   - Rotarse periódicamente

## 🔧 Configuración de Variables de Entorno con Validación

## 1. Instalar dependencias requeridas

```bash
npm install class-validator class-transformer

# Dependencias principales de NestJS
npm install @nestjs/common @nestjs/core @nestjs/config @nestjs/typeorm typeorm

# Dependencias de desarrollo y tipos
npm install --save-Dv @types/node

# Para commitlint (si lo necesitas)
npm install --save-Dv @commitlint/cli @commitlint/config-conventional @commitlint/types
```

## 2. Crear esquema de validación

`src/config/env.validation.ts`:

```typescript
import { plainToInstance } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  JOB_NAME: string;

  @IsString()
  APP_PORT: string;

  @IsString()
  HASH_KEY_USER: string;

  @IsString()
  HASH_KEY_JWT: string;

  @IsString()
  VERSION: string;

  @IsString()
  @IsOptional()
  SALT = 10;

  @IsString()
  APP_DEV = 'false';

  @IsString()
  DATABASE_HOST: string;

  @IsString()
  DATABASE_PORT: string;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  RATE_LIMIT_TTL = 60;

  @IsString()
  RATE_LIMIT_MAX = 100;

  @IsString()
  LOG_SERVICE_URL: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

## 3. Configurar módulo principal

`app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true,
      envFilePath: '.env',
    }),
    // ...otros módulos
  ],
})
export class AppModule {}
```

## 4. Servicio de configuración tipado

`src/config/configuration.ts`:

```typescript
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

export const getDatabaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<DataSourceOptions> => ({
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', ''),
    database: configService.get<string>('DATABASE_DATABASE', 'dbTest'),
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    synchronize: configService.get<string>('APP_DEV', 'true') === 'true',
    logging: configService.get<string>('APP_DEV', 'true') === 'true',
  }),
  inject: [ConfigService],
};
```

## 5. Ejemplo de archivo .env

`.env.dev`:

```env
# Configuración básica
JOB_NAME=USER_MS
APP_PORT=3000
ENV=DEV

# Seguridad
HASH_KEY_USER=my_strong_user_secret
HASH_KEY_JWT=jwt_super_secret_key
SALT=12

# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=securepassword
DATABASE_NAME=main_db

# Rate limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# logs
LOG_SERVICE_URL=localhost:3000/
```

## 🖌 Editar eslint.config.mjs para windows

`eslint.config.mjs`:

```javascript

rules: {
      /* Reglas configuradas */
      'linebreak-style': ['off', 'windows'],
      'linebreak-style': 'off',
    },
```
