# Cypress + Video + Allure Reports

Repositorio que integra Cypress con reportes en Allure, para pruebas de extremo a extremo con evidencia visual y reportes detallados.
En este proyecto, la generación de videos comprimidos por Cypress se adjunta al reporte de Allure mediante un script en after:run dentro de cypress.config.js. De lo contrario, aunque la compresión de videos esté activada en cypress.config.js, Allure adjuntaría los videos sin comprimir por defecto.

---

## 📁 Estructura del proyecto

```text
.
├── cypress/
│   ├── e2e/                # pruebas de extremo a extremo
│   ├── fixtures/
│   ├── support/
│   ├── utils/              # scripts auxiliares (manejo de videos)
│   └── videos/             # videos generados de las ejecuciones
├── cypress.config.js
├── package.json
└── ...
```

---

## 🚀 Instalación

1. Clonar el repositorio:

   ```sh
   git clone https://github.com/jmr85/cypress-video-allure-reports.git
   cd cypress-video-allure-reports
   ```

2. Instalar dependencias:
    ```sh
    npm install
    ```

## 🏃‍♂️ Cómo ejecutar las pruebas

1. Ejecutar las pruebas

    ```sh
    npx cypress run
    ```

2. 📊 Generar reporte Allure

    Una vez hechas las pruebas, puedes generar el reporte ejecutando:
    
    ```sh
    npx allure generate allure-results --clean
    ```
    Y para abrirlo:
    ```sh
    npx allure open
    ```