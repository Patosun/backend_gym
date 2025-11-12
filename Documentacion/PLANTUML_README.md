# 📊 Diagramas PlantUML - GymMaster

Este directorio contiene los diagramas del sistema GymMaster en formato PlantUML, que pueden ser renderizados y editados fácilmente.

## 📁 Archivos de Diagramas

### 1. `DATABASE_ERD.puml` - Diagrama de Entidad-Relación
- **Propósito**: Muestra todas las entidades de la base de datos y sus relaciones
- **Incluye**: 
  - 13 entidades principales
  - 6 enumeraciones
  - Relaciones y cardinalidades
  - Claves primarias y foráneas
  - Restricciones y validaciones

### 2. `PROCESS_FLOWS.puml` - Flujos de Proceso
- **Propósito**: Ilustra los procesos principales del sistema
- **Incluye**:
  - Registro de miembros
  - Check-in con QR
  - Procesamiento de pagos
  - Reserva de clases

### 3. `SYSTEM_ARCHITECTURE.puml` - Arquitectura del Sistema
- **Propósito**: Muestra la arquitectura técnica completa
- **Incluye**:
  - Aplicaciones cliente (Desktop/Móvil)
  - Backend API con Node.js
  - Base de datos PostgreSQL
  - Componentes de seguridad
  - Servicios de monitoreo

## 🛠️ Cómo Usar los Diagramas

### Opción 1: VS Code (Recomendado)
1. **Instalar extensión**: 
   ```
   PlantUML (by jebbs)
   ```

2. **Previsualizar**:
   - Abrir cualquier archivo `.puml`
   - Presionar `Alt + D` (Windows/Linux) o `Option + D` (Mac)
   - O usar comando: `PlantUML: Preview Current Diagram`

3. **Exportar**:
   - `Ctrl + Shift + P` → `PlantUML: Export Current Diagram`
   - Formatos disponibles: PNG, SVG, PDF, etc.

### Opción 2: Online
1. **PlantUML Online Server**: 
   - Ir a: http://www.plantuml.com/plantuml/uml/
   - Copiar y pegar el contenido del archivo `.puml`
   - Ver el diagrama renderizado

2. **PlantText**:
   - Ir a: https://www.planttext.com/
   - Pegar el código y ver el resultado

### Opción 3: Línea de Comandos
1. **Instalar PlantUML**:
   ```bash
   # Con Java instalado
   wget http://sourceforge.net/projects/plantuml/files/plantuml.jar/download -O plantuml.jar
   ```

2. **Generar imagen**:
   ```bash
   java -jar plantuml.jar DATABASE_ERD.puml
   java -jar plantuml.jar PROCESS_FLOWS.puml
   java -jar plantuml.jar SYSTEM_ARCHITECTURE.puml
   ```

## 🎨 Personalización

### Cambiar Colores
Los diagramas usan un esquema de colores personalizado. Para modificar:

```plantuml
skinparam entity {
  BackgroundColor #TuColor
  BorderColor #TuBorde
  FontColor #TuTexto
}
```

### Agregar Nuevas Entidades
Para el ERD, seguir este formato:

```plantuml
ENTITY(NuevaEntidad) {
  PRIMARY_KEY(id) : UUID
  NOT_NULL(campo) : TIPO
  FOREIGN_KEY(relacion) : UUID
}
```

### Modificar Flujos
Para los procesos, usar la sintaxis de secuencia:

```plantuml
Actor -> Sistema: Acción
activate Sistema
Sistema -> BaseDatos: Consulta
BaseDatos --> Sistema: Resultado
Sistema --> Actor: Respuesta
deactivate Sistema
```

## 📋 Requisitos

### Para VS Code:
- **Extensión**: PlantUML by jebbs
- **Java**: JRE 8+ (requerido por PlantUML)
- **Graphviz**: Para layouts complejos (opcional)

### Para línea de comandos:
- **Java**: JRE 8+
- **PlantUML JAR**: Descarga desde el sitio oficial

## 🔄 Actualización de Diagramas

Cuando se modifique la base de datos o la arquitectura:

1. **ERD**: Actualizar entidades, campos y relaciones
2. **Flujos**: Modificar secuencias según nuevos procesos
3. **Arquitectura**: Ajustar componentes y tecnologías

## 💡 Consejos de Uso

### Performance
- Los diagramas grandes pueden tardar en renderizar
- Usar `!include` para dividir diagramas complejos
- Comentar secciones temporalmente con `'`

### Colaboración
- Los archivos `.puml` son texto plano
- Funcionan perfectamente con Git
- Fáciles de revisar en pull requests
- Pueden ser editados por múltiples desarrolladores

### Documentación
- Usar `note` para agregar explicaciones
- Incluir títulos descriptivos
- Mantener consistencia en nombres y estilos

## 🚀 Integración en CI/CD

Para generar automáticamente las imágenes:

```yaml
# GitHub Actions example
- name: Generate PlantUML diagrams
  uses: cloudbees/plantuml-github-action@master
  with:
    args: -v -tpng docs/**/*.puml
```

## 📚 Referencias

- **PlantUML**: https://plantuml.com/
- **Guía de sintaxis**: https://plantuml.com/guide
- **Ejemplos**: https://plantuml.com/commons
- **VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml

---

> 💡 **Tip**: Mantén estos diagramas actualizados con cada cambio en la base de datos o arquitectura. Son una herramienta invaluable para nuevos desarrolladores y documentación del proyecto.