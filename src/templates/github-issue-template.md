# Reporte de Análisis de Seguridad Titvo

**Fecha de Análisis**: {{scan_date}}

## Resumen

- **Total de Problemas**: {{total_issues}}
- **Problemas Críticos**: {{critical_issues}}
- **Problemas Altos**: {{high_issues}}
- **Problemas Medios**: {{medium_issues}}
- **Problemas Bajos**: {{low_issues}}

## Problemas Detectados

{{#issues}}

### {{title}}

`{{severity_label}}`

- **Archivo**: {{path}}
- **Línea**: {{line}}
- **Código**:

```
{{code}}
```

### Descripción

{{description}}

> **Recomandación**
> {{recommendation}}

{{#summary}}

### Resumen

{{summary}}

{{/summary}}

{{/issues}}
